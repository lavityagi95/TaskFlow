const db = require("../config/db");
const bcrypt = require("bcrypt");

// Show Company Registration Page

const registerPage = (req, res) => {
    res.render("company/register");
};

// Register Company

const registerCompany = async (req, res) => {

    try {

        const {
            company_name,
            owner_name,
            email,
            password
        } = req.body;

        // Validation
        if (!company_name || !owner_name || !email || !password) {
            return res.send("All fields are required.");
        }

        // Check if email already exists
        const [rows] = await db.query(
            "SELECT id FROM companies WHERE email = ?",
            [email]
        );

        if (rows.length > 0) {
            return res.send("Email already registered.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert company
        const [result] = await db.query(
            `INSERT INTO companies
            (company_name, owner_name, email, password)
            VALUES (?, ?, ?, ?)`,
            [company_name, owner_name, email, hashedPassword]
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

    res.send("Login Route Working");

};


module.exports = {
    registerPage,
    registerCompany,
    loginPage,
    loginCompany
};