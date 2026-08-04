const db = require("../config/db");
const bcrypt = require("bcrypt");

// Show Company Registration Page

const registerPage = (req, res) => {
  res.render("company/register");
};

// Register Company

const registerCompany = async (req, res) => {
  try {
    const { company_name, owner_name, email, password } = req.body;

    // Validation
    if (!company_name || !owner_name || !email || !password) {
      return res.send("All fields are required.");
    }

    // Check if email already exists
    const [rows] = await db.query("SELECT id FROM companies WHERE email = ?", [
      email,
    ]);

    if (rows.length > 0) {
      return res.send("Email already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert company
    const [result] = await db.query(
      `INSERT INTO companies
            (company_name, owner_name, email, password)
            VALUES (?, ?, ?, ?)`,
      [company_name, owner_name, email, hashedPassword],
    );

    console.log("Company Registered Successfully");
    console.log("Company ID:", result.insertId);

    req.flash("success", "Company registered successfully. Please login.");

    res.redirect("/company/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
const loginPage = (req, res) => {
  res.render("company/login");
};

const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login function called");

    const [rows] = await db.query("SELECT * FROM companies WHERE email = ?", [
      email,
    ]);

    console.log(rows);

    if (rows.length === 0) {
      req.flash("error", "Invalid Email");

      return res.redirect("/company/login");
    }

    const company = rows[0];

    const isMatch = await bcrypt.compare(password, company.password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      req.flash("error", "Invalid Password");

      return res.redirect("/company/login");
    }

    req.session.company = {
      id: company.id,
      company_name: company.company_name,
    };

    console.log("Session after setting:", req.session);

    req.session.save((err) => {
      if (err) {
        console.log(err);
        return res.send("Session Error");
      }

      res.redirect("/company/dashboard");
    });
  } catch (err) {
    console.log(err);
  }
};

const dashboardPage = async (req, res) => {
  try {
    const companyId = req.session.company.id;

    // Total Employees
    const [employees] = await db.query(
      "SELECT COUNT(*) AS total FROM employees WHERE company_id = ?",
      [companyId],
    );

    // Pending Tasks
    const [pending] = await db.query(
      `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'Pending'`,
      [companyId],
    );

    // In Progress Tasks
    const [progress] = await db.query(
      `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'In Progress'`,
      [companyId],
    );

    // Completed Tasks
    const [completed] = await db.query(
      `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'Completed'`,
      [companyId],
    );

    // Recent Tasks
    const [tasks] = await db.query(
      `SELECT
                tasks.*,
                employees.full_name
             FROM tasks
             JOIN employees
             ON tasks.employee_id = employees.id
             WHERE tasks.company_id = ?
             ORDER BY tasks.created_at DESC
             LIMIT 10`,
      [companyId],
    );

    res.render("company/dashboard", {
      company: req.session.company,

      totalEmployees: employees[0].total,

      pendingTasks: pending[0].total,

      progressTasks: progress[0].total,

      completedTasks: completed[0].total,

      tasks,
    });
  } catch (err) {
    console.error(err);

    res.status(500).send("Database Error");
  }
};

// Show Pending Join Requests
const joinRequestsPage = async (req, res) => {
  try {
    const companyId = req.session.company.id;

    const [requests] = await db.query(
      `SELECT *
             FROM join_requests
             WHERE company_id = ?
             AND status = 'Pending'
             ORDER BY created_at DESC`,
      [companyId],
    );

    res.render("company/joinRequests", {
      company: req.session.company,
      requests,
    });
  } catch (err) {
    console.error(err);
    res.send(err.message);
  }
};

// ===============================
// Approve Employee
// ===============================
const approveEmployee = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Get join request
    const [requests] = await db.query(
      "SELECT * FROM join_requests WHERE id = ?",
      [requestId],
    );

    if (requests.length === 0) {
      return res.send("Request not found.");
    }

    const request = requests[0];

    // Insert into employees table
    await db.query(
      `INSERT INTO employees
            (company_id, full_name, email, password, designation)
            VALUES (?, ?, ?, ?, ?)`,
      [
        request.company_id,
        request.employee_name,
        request.email,
        request.password,
        request.designation,
      ],
    );

    // Update join request status
    await db.query(
      "UPDATE join_requests SET status = 'Approved' WHERE id = ?",
      [requestId],
    );

    res.redirect("/company/join-requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
// ===============================
// Reject Employee
// ===============================
const rejectEmployee = async (req, res) => {
  try {
    const requestId = req.params.id;

    await db.query(
      "UPDATE join_requests SET status = 'Rejected' WHERE id = ?",
      [requestId],
    );

    res.redirect("/company/join-requests");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
// ===============================
// Show Create Task Page
// ===============================
const createTaskPage = async (req, res) => {
  try {
    const companyId = req.session.company.id;

    const [employees] = await db.query(
      `SELECT id, full_name
             FROM employees
             WHERE company_id = ?
             ORDER BY full_name`,
      [companyId],
    );

    res.render("company/createTask", {
      company: req.session.company,
      employees,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};

// ===============================
// Create Task
// ===============================
const createTask = async (req, res) => {
  try {
    const companyId = req.session.company.id;

    const { employee_id, title, description, priority, due_date } = req.body;

    // Validation
    if (!employee_id || !title || !priority) {
      return res.send("Please fill all required fields.");
    }

    // Insert Task
    await db.query(
      `INSERT INTO tasks
            (
                company_id,
                employee_id,
                title,
                description,
                priority,
                due_date
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
      [companyId, employee_id, title, description, priority, due_date],
    );

    req.flash("success", "Task created successfully.");

    res.redirect("/company/tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
const tasksPage = async (req, res) => {
  try {
    if (!req.session.company) {
      return res.redirect("/company/login");
    }

    const companyId = req.session.company.id;

    const { search, status, priority } = req.query;

    let sql = `
            SELECT
                tasks.*,
                employees.full_name
            FROM tasks
            LEFT JOIN employees
            ON tasks.employee_id = employees.id
            WHERE tasks.company_id = ?
        `;

    const values = [companyId];

    if (search) {
      sql += " AND tasks.title LIKE ?";

      values.push(`%${search}%`);
    }

    if (status) {
      sql += " AND tasks.status = ?";

      values.push(status);
    }

    if (priority) {
      sql += " AND tasks.priority = ?";

      values.push(priority);
    }

    sql += " ORDER BY tasks.due_date ASC";

    const [tasks] = await db.query(sql, values);

    res.render("company/tasks", {
      company: req.session.company,

      tasks,

      search,

      status,

      priority,
    });
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const editTaskPage = async (req, res) => {
  try {
    const companyId = req.session.company.id;
    const taskId = req.params.id;

    // Get Task
    const [tasks] = await db.query(
      `SELECT *
             FROM tasks
             WHERE id = ?
             AND company_id = ?`,
      [taskId, companyId],
    );

    if (tasks.length === 0) {
      return res.send("Task not found.");
    }

    // Get Employees
    const [employees] = await db.query(
      `SELECT id, full_name
             FROM employees
             WHERE company_id = ?
             ORDER BY full_name`,
      [companyId],
    );

    res.render("company/editTask", {
      task: tasks[0],
      employees,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};

const updateTask = async (req, res) => {
  try {
    const companyId = req.session.company.id;
    const taskId = req.params.id;

    const { title, description, employee_id, priority, due_date } = req.body;

    // Validation
    if (!title || !employee_id || !priority) {
      return res.send("Please fill all required fields.");
    }

    // Update task
    const [result] = await db.query(
      `UPDATE tasks
             SET
                title = ?,
                description = ?,
                employee_id = ?,
                priority = ?,
                due_date = ?
             WHERE id = ?
             AND company_id = ?`,
      [title, description, employee_id, priority, due_date, taskId, companyId],
    );

    if (result.affectedRows === 0) {
      return res.send("Task not found or access denied.");
    }

    req.flash("success", "Task updated successfully.");

    res.redirect("/company/tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
const deleteTask = async (req, res) => {
  try {
    const companyId = req.session.company.id;
    const taskId = req.params.id;

    const [result] = await db.query(
      `DELETE FROM tasks
             WHERE id = ?
             AND company_id = ?`,
      [taskId, companyId],
    );

    if (result.affectedRows === 0) {
      return res.send("Task not found or access denied.");
    }

    req.flash("success", "Task deleted successfully.");

    res.redirect("/company/tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Error");
  }
};
const employeesPage = async (req, res) => {
  try {
    if (!req.session.company) {
      return res.redirect("/company/login");
    }

    const companyId = req.session.company.id;

    const search = req.query.search || "";

    const [employees] = await db.query(
      `
            SELECT
                e.*,
                COUNT(t.id) AS total_tasks,
                SUM(CASE WHEN t.status='Completed' THEN 1 ELSE 0 END) AS completed_tasks
            FROM employees e
            LEFT JOIN tasks t
                ON e.id = t.employee_id
            WHERE
                e.company_id = ?
                AND e.full_name LIKE ?
            GROUP BY e.id
            ORDER BY e.full_name
            `,
      [companyId, `%${search}%`],
    );

    res.render("company/employees", {
      company: req.session.company,

      employees,

      search,
    });
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const reportsPage = async (req, res) => {
  try {
    if (!req.session.company) {
      return res.redirect("/company/login");
    }

    const companyId = req.session.company.id;

    // Total Employees
    const [[employeeCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM employees WHERE company_id=?",
      [companyId],
    );

    // Total Tasks
    const [[taskCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM tasks WHERE company_id=?",
      [companyId],
    );

    // Pending
    const [[pending]] = await db.query(
      "SELECT COUNT(*) AS total FROM tasks WHERE company_id=? AND status='Pending'",
      [companyId],
    );

    // In Progress
    const [[progress]] = await db.query(
      "SELECT COUNT(*) AS total FROM tasks WHERE company_id=? AND status='In Progress'",
      [companyId],
    );

    // Completed
    const [[completed]] = await db.query(
      "SELECT COUNT(*) AS total FROM tasks WHERE company_id=? AND status='Completed'",
      [companyId],
    );

    // Top Performer
    const [topEmployee] = await db.query(
      `
            SELECT
                employees.full_name,
                COUNT(tasks.id) AS completed
            FROM employees
            LEFT JOIN tasks
            ON employees.id = tasks.employee_id
            AND tasks.status='Completed'
            WHERE employees.company_id=?
            GROUP BY employees.id
            ORDER BY completed DESC
            LIMIT 1
            `,
      [companyId],
    );

    // Due Today
    const [[todayTasks]] = await db.query(
      `
            SELECT COUNT(*) AS total
            FROM tasks
            WHERE company_id=?
            AND due_date = CURDATE()
            `,
      [companyId],
    );

    const completion =
      taskCount.total === 0
        ? 0
        : Math.round((completed.total / taskCount.total) * 100);

    res.render("company/reports", {
      company: req.session.company,

      employeeCount: employeeCount.total,

      taskCount: taskCount.total,

      pending: pending.total,

      progress: progress.total,

      completed: completed.total,

      completion,

      todayTasks: todayTasks.total,

      topEmployee: topEmployee[0] || null,
    });
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const editEmployeePage = async (req, res) => {
  try {
    if (!req.session.company) {
      return res.redirect("/company/login");
    }

    const companyId = req.session.company.id;
    const employeeId = req.params.id;

    const [rows] = await db.query(
      `
            SELECT *
            FROM employees
            WHERE id = ?
            AND company_id = ?
            `,
      [employeeId, companyId],
    );

    if (rows.length === 0) {
      return res.send("Employee not found.");
    }

    res.render("company/editEmployee", {
      company: req.session.company,

      employee: rows[0],
    });
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const updateEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const {
      full_name,

      designation,

      status,
    } = req.body;

    await db.query(
      `
            UPDATE employees
            SET
                full_name=?,
                designation=?,
                status=?
            WHERE id=?
            `,

      [full_name, designation, status, employeeId],
    );

    req.flash("success", "Employee Updated Successfully.");

    res.redirect("/company/employees");
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    await db.query(
      "DELETE FROM employees WHERE id=?",

      [employeeId],
    );

    req.flash("success", "Employee Deleted Successfully.");

    res.redirect("/company/employees");
  } catch (err) {
    console.log(err);

    res.send("Database Error");
  }
};
const notificationsPage = async (req, res) => {

    try {

        if (!req.session.company) {

            return res.redirect("/company/login");

        }

        const companyId = req.session.company.id;

        const [notifications] = await db.query(

            `
            SELECT *
            FROM notifications
            WHERE company_id=?
            ORDER BY created_at DESC
            `,

            [companyId]

        );

        await db.query(

            `
            UPDATE notifications
            SET is_read=1
            WHERE company_id=?
            `,

            [companyId]

        );

        res.render("company/notifications",{

            company:req.session.company,

            notifications

        });

    } catch(err){

        console.log(err);

        res.send("Database Error");

    }

};
const settingsPage = async (req, res) => {

    try {

        const companyId = req.session.company.id;

        const [rows] = await db.query(

            "SELECT * FROM companies WHERE id=?",

            [companyId]

        );

        res.render("company/settings",{

            company:req.session.company,

            details:rows[0]

        });

    } catch(err){

        console.log(err);

        res.send("Database Error");

    }

};
const updateSettings = async (req,res)=>{

    try{

        const companyId=req.session.company.id;

        const{

            company_name,

            owner_name,

            email

        }=req.body;

        await db.query(

            `
            UPDATE companies
            SET
            company_name=?,
            owner_name=?,
            email=?
            WHERE id=?
            `,

            [

                company_name,

                owner_name,

                email,

                companyId

            ]

        );

        req.session.company.company_name=company_name;

        req.flash("success","Profile Updated Successfully.");

        res.redirect("/company/settings");

    }catch(err){

        console.log(err);

        res.send("Database Error");

    }

};
const deleteCompany = async (req, res) => {

    try {

        const companyId = req.session.company.id;

        await db.query(
            "DELETE FROM companies WHERE id = ?",
            [companyId]
        );

        req.session.destroy(() => {

            res.redirect("/");

        });

    } catch (err) {

        console.log(err);

        res.send("Database Error");

    }

};
const logoutCompany = (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.send("Unable to logout");
        }

        res.redirect("/company/login");

    });

};

const addComment = async (req, res) => {

    try {

        const taskId = req.params.id;

        const companyId = req.session.company.id;

        const { comment } = req.body;

        if (!comment || comment.trim() === "") {

            req.flash("error", "Comment cannot be empty.");

            return res.redirect("/company/tasks");

        }

        await db.query(

            `
            INSERT INTO task_comments
            (task_id, company_id, comment)
            VALUES (?, ?, ?)
            `,

            [

                taskId,

                companyId,

                comment

            ]

        );

        req.flash("success", "Comment Added Successfully.");

        res.redirect("/company/tasks");

    } catch (err) {

        console.log(err);

        res.send("Database Error");

    }

};

const taskDetailsPage = async (req, res) => {

    try {

        const companyId = req.session.company.id;
        const taskId = req.params.id;

        // Task Details
        const [taskRows] = await db.query(
            `
            SELECT t.*, e.full_name
            FROM tasks t
            LEFT JOIN employees e
                ON t.employee_id = e.id
            WHERE t.id = ?
            AND t.company_id = ?
            `,
            [taskId, companyId]
        );

        if (taskRows.length === 0) {
            return res.send("Task Not Found");
        }

        // Comments
        const [comments] = await db.query(
            `
            SELECT
                tc.*,
                e.full_name,
                c.company_name
            FROM task_comments tc

            LEFT JOIN employees e
                ON tc.employee_id = e.id

            LEFT JOIN companies c
                ON tc.company_id = c.id

            WHERE tc.task_id = ?

            ORDER BY tc.created_at ASC
            `,
            [taskId]
        );

        res.render("company/taskDetails", {

            company: req.session.company,

            task: taskRows[0],

            comments

        });

    } catch (err) {

        console.log(err);

        res.send("Database Error");

    }

};
module.exports = {
  registerPage,
  registerCompany,
  loginPage,
  loginCompany,
  dashboardPage,
  joinRequestsPage,
  approveEmployee,
  rejectEmployee,
  createTaskPage,
  createTask,
  tasksPage,
  editTaskPage,
  updateTask,
  deleteTask,
  employeesPage,
  editEmployeePage,
  updateEmployee,
  deleteEmployee,
  reportsPage,
  notificationsPage,
  settingsPage,
updateSettings,
    deleteCompany,
    logoutCompany,
    addComment,
    taskDetailsPage


};
