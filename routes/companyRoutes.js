const express =  require("express")

const router = express.Router();

const companyController  = require("../controllers/companyController")

router.get("/register", companyController.registerPage)
router.post("/register", companyController.registerCompany);
router.get("/login", companyController.loginPage);
router.post("/login", companyController.loginCompany);

module.exports = router;