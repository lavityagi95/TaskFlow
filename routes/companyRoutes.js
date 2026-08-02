const express =  require("express")

const router = express.Router();

const companyController  = require("../controllers/companyController")

router.get("/register", companyController.registerPage)
router.post("/register", companyController.registerCompany);

module.exports = router;