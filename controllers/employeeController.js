const db = require("../config/db");
const bcrypt = require("bcrypt");

// ===============================
// Show Registration Page
// ===============================
const searchCompanyPage = async (req, res) => {

    try {

        const [companies] = await db.query(
            "SELECT id, company_name FROM companies ORDER BY company_name"
        );

        res.render("employee/register", {
            companies
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Database Error");

    }

};

// ===============================
// Send Join Request
// ===============================
const sendJoinRequest = async (req, res) => {

    try {

        const {
            company_id,
            employee_name,
            email,
            password,
            designation
        } = req.body;

        // Validation
        if (
            !company_id ||
            !employee_name ||
            !email ||
            !password ||
            !designation
        ) {
            return res.send("All fields are required.");
        }

        // Check if employee already exists
        const [employees] = await db.query(
            "SELECT id FROM employees WHERE email = ?",
            [email]
        );

        if (employees.length > 0) {
            return res.send("Employee already registered.");
        }

        // Check if request already exists
        const [requests] = await db.query(
            "SELECT id FROM join_requests WHERE email = ? AND status = 'Pending'",
            [email]
        );

        if (requests.length > 0) {
            return res.send("Your join request is already pending.");
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Save request
        await db.query(
            `INSERT INTO join_requests
            (company_id, employee_name, email, password, designation, status)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                company_id,
                employee_name,
                email,
                hashedPassword,
                designation,
                "Pending"
            ]
        );

        res.send("Join Request Sent Successfully.");

    } catch (err) {

        console.error(err);
       res.send(err.message);

    }

};
const loginPage = (req, res) => {
    res.render("employee/login");
};

const loginEmployee = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.send("All fields are required.");
        }

        const [employees] = await db.query(
            "SELECT * FROM employees WHERE email = ?",
            [email]
        );

        if (employees.length === 0) {
            req.flash("error", "Invalid Email");

return res.redirect("/employee/login");
        }

        const employee = employees[0];

        const isMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isMatch) {
           req.flash("error", "Invalid Password");

return res.redirect("/employee/login");
        }

        req.session.employee = {
            id: employee.id,
            company_id: employee.company_id,
            full_name: employee.full_name,
            email: employee.email
        };

        req.flash("success", "Welcome back!");

res.redirect("/employee/dashboard");

    } catch (err) {

        console.error(err);
        res.status(500).send("Database Error");

    }

};

const dashboardPage = async (req, res) => {

    try {

        const employeeId = req.session.employee.id;

        const [tasks] = await db.query(
            `SELECT *
             FROM tasks
             WHERE employee_id = ?
             ORDER BY created_at DESC`,
            [employeeId]
        );

        res.render("employee/dashboard", {
            employee: req.session.employee,
            tasks
        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Database Error");

    }

};
const updateTaskStatus = async (req, res) => {

    try {

        const taskId = req.params.id;
        const employeeId = req.session.employee.id;
        const { status } = req.body;

        // Only update tasks assigned to the logged-in employee
        await db.query(
            `UPDATE tasks
             SET status = ?
             WHERE id = ?
             AND employee_id = ?`,
            [
                status,
                taskId,
                employeeId
            ]
        );

        res.redirect("/employee/dashboard");

    } catch (err) {

        console.error(err);
        res.status(500).send("Database Error");

    }

};

module.exports = {
    searchCompanyPage,
    sendJoinRequest,
    loginPage,
    loginEmployee,
    dashboardPage,
    updateTaskStatus
};