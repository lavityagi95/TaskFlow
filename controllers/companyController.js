const db = require("../config/db");

const registerPage = (req, res) => {
    res.render("company/register");
};

const registerCompany = (req, res) => {

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

    const sql = `
        INSERT INTO companies
        (company_name, owner_name, email, password)
        VALUES (?, ?, ?, ?)
    `;

    const checkEmailSql = `
    SELECT * FROM companies
    WHERE email = ?
`;

db.query(checkEmailSql, [email], (err, result) => {

    if (err) {
        console.error(err);
        return res.send("Database Error");
    }

    console.log(result);

});

    db.query(sql, [company_name, owner_name, email, password], (err, result) => {

        if (err) {

            console.error(err);

            return res.send("Database Error");

        }

        res.send("Company Registered Successfully");

    });

};
module.exports = {
    registerPage,
    registerCompany,
};