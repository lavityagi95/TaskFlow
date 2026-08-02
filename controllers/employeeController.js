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
            return res.send("Invalid Email");
        }

        const employee = employees[0];

        const isMatch = await bcrypt.compare(
            password,
            employee.password
        );

        if (!isMatch) {
            return res.send("Invalid Password");
        }

        req.session.employee = {
            id: employee.id,
            company_id: employee.company_id,
            full_name: employee.full_name,
            email: employee.email
        };

        res.redirect("/employee/dashboard");

    } catch (err) {

        console.error(err);
        res.status(500).send("Database Error");

    }

};

const dashboardPage = (req, res) => {

    res.render("employee/dashboard", {
        employee: req.session.employee
    });

};

module.exports = {
    searchCompanyPage,
    sendJoinRequest,
    loginPage,
    loginEmployee,
    dashboardPage
};