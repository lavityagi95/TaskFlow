const express = require("express");

const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { isEmployeeLoggedIn } = require("../middleware/authMiddleware");
// Search Company Page
router.get("/search-company", employeeController.searchCompanyPage);

// Send Join Request
router.post("/join-request", employeeController.sendJoinRequest);

router.get("/register", employeeController.searchCompanyPage);

router.post("/register", employeeController.sendJoinRequest);

router.get("/login", employeeController.loginPage);
router.post("/login", employeeController.loginEmployee);

router.get("/dashboard", isEmployeeLoggedIn, employeeController.dashboardPage);

router.post("/task/update/:id",isEmployeeLoggedIn,employeeController.updateTaskStatus,);

router.post(
    "/task/comment/:id",
    employeeController.addComment
);
router.get(
    "/task/:id",
    isEmployeeLoggedIn,
    employeeController.taskDetailsPage
);

router.post(
    "/task/comment/:id",
    isEmployeeLoggedIn,
    employeeController.addComment
);
module.exports = router;
