const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { isLoggedIn } = require("../middleware/authMiddleware");

router.get("/dashboard", isLoggedIn, companyController.dashboardPage);

router.get("/register", companyController.registerPage);
router.post("/register", companyController.registerCompany);
router.get("/login", companyController.loginPage);
router.post("/login", companyController.loginCompany);
router.get("/join-requests", isLoggedIn, companyController.joinRequestsPage);

router.post("/approve/:id", isLoggedIn, companyController.approveEmployee);

router.post("/reject/:id", isLoggedIn, companyController.rejectEmployee);

router.get("/create-task", isLoggedIn, companyController.createTaskPage);

router.post("/create-task", isLoggedIn, companyController.createTask);

router.get("/tasks", isLoggedIn, companyController.tasksPage);

router.get("/task/edit/:id", isLoggedIn, companyController.editTaskPage);

router.post("/task/edit/:id", isLoggedIn, companyController.updateTask);

router.post("/task/delete/:id", isLoggedIn, companyController.deleteTask);

router.get("/employees", companyController.employeesPage);

router.get("/employee/edit/:id", companyController.editEmployeePage);

router.post("/employee/edit/:id", companyController.updateEmployee);

router.post("/employee/delete/:id", companyController.deleteEmployee);

router.get("/reports", companyController.reportsPage);

router.get("/notifications", isLoggedIn, companyController.notificationsPage);

router.get(
    "/settings",
    isLoggedIn,
    companyController.settingsPage
);

router.post(
    "/settings",
    isLoggedIn,
    companyController.updateSettings
);
router.post(
    "/delete",
    isLoggedIn,
    companyController.deleteCompany
);

router.get("/logout", companyController.logoutCompany);

router.post(
    "/task/comment/:id",
    companyController.addComment
);

router.get(
    "/task/:id",
    isLoggedIn,
    companyController.taskDetailsPage
);
module.exports = router;
