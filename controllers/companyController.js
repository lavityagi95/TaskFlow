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

    const [rows] = await db.query(
      "SELECT * FROM companies WHERE email = ?",
      [email]
    );

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
            [companyId]
        );

        // Pending Tasks
        const [pending] = await db.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'Pending'`,
            [companyId]
        );

        // In Progress Tasks
        const [progress] = await db.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'In Progress'`,
            [companyId]
        );

        // Completed Tasks
        const [completed] = await db.query(
            `SELECT COUNT(*) AS total
             FROM tasks
             WHERE company_id = ?
             AND status = 'Completed'`,
            [companyId]
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
            [companyId]
        );

        res.render("company/dashboard", {

            company: req.session.company,

            totalEmployees: employees[0].total,

            pendingTasks: pending[0].total,

            progressTasks: progress[0].total,

            completedTasks: completed[0].total,

            tasks

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
            [companyId]
        );

        res.render("company/joinRequests", {
            company: req.session.company,
            requests
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
            [requestId]
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
                request.designation
            ]
        );

        // Update join request status
        await db.query(
            "UPDATE join_requests SET status = 'Approved' WHERE id = ?",
            [requestId]
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
            [requestId]
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
            [companyId]
        );

        res.render("company/createTask", {
            company: req.session.company,
            employees
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

        const {
            employee_id,
            title,
            description,
            priority,
            due_date
        } = req.body;

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
            [
                companyId,
                employee_id,
                title,
                description,
                priority,
                due_date
            ]
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

        const companyId = req.session.company.id;

        const search = req.query.search || "";
        const status = req.query.status || "";

        let sql = `
            SELECT
                tasks.id,
                tasks.title,
                tasks.priority,
                tasks.status,
                tasks.due_date,
                employees.full_name
            FROM tasks
            JOIN employees
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

        sql += " ORDER BY tasks.created_at DESC";

        const [tasks] = await db.query(sql, values);

        res.render("company/tasks", {

            company: req.session.company,

            tasks,

            search,

            status

        });

    } catch (err) {

        console.error(err);

        res.status(500).send("Database Error");

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
            [taskId, companyId]
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
            [companyId]
        );

        res.render("company/editTask", {
            task: tasks[0],
            employees
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

        const {
            title,
            description,
            employee_id,
            priority,
            due_date
        } = req.body;

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
            [
                title,
                description,
                employee_id,
                priority,
                due_date,
                taskId,
                companyId
            ]
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
            [
                taskId,
                companyId
            ]
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
    deleteTask
};