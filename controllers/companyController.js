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

    res.send("Company Registered Successfully");
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
      return res.send("Invalid Email");
    }

    const company = rows[0];

    const isMatch = await bcrypt.compare(password, company.password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.send("Invalid Password");
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

const dashboardPage = (req, res) => {

    res.render("company/dashboard", {
        company: req.session.company
    });

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

        res.redirect("/company/create-task");

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
    createTask
};