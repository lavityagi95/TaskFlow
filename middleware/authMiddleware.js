const isLoggedIn = (req, res, next) => {

    if (!req.session.company) {
        return res.redirect("/company/login");
    }

    next();
};

const isEmployeeLoggedIn = (req, res, next) => {

    if (!req.session.employee) {
        return res.redirect("/employee/login");
    }

    next();
};

module.exports = {
    isLoggedIn,
    isEmployeeLoggedIn
};