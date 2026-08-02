const db = require("../config/db");
const bcrypt = require("bcrypt");


const registerPage = async (req, res) => {
    res.render("company/register");
};

const registerCompany = (req, res) => {

    // Get form data
    const { company_name, owner_name, email, password } = req.body;

    // Validate form
    if (!company_name || !owner_name || !email || !password) {
        return res.send("All fields are required.");
    }

    // Check if email already exists
    const checkEmailSql = `
        SELECT id
        FROM companies
        WHERE email = ?
    `;

    db.query(checkEmailSql, [email], (err, result) => {

        if (err) {
            console.error(err);
            return res.send("Database Error");
        }

        // Email already registered
        if (result.length > 0) {
            return res.send("Email already registered.");
        }

        // Insert new company
        const insertSql = `
            INSERT INTO companies
            (company_name, owner_name, email, password)
            VALUES (?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [company_name, owner_name, email, password],
            (err, result) => {

                if (err) {
                    console.error(err);
                    return res.send("Database Error");
                }

                console.log("Company Registered Successfully");
                console.log("Company ID:", result.insertId);

                res.send("Company Registered Successfully");

            }
        );

    });

};

module.exports = {
    registerPage,
    registerCompany
};