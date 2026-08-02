const express = require("express")
const companyRoutes = require("./routes/companyRoutes")
const session = require("express-session");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: "taskflow_secret_key",
        resave: false,
        saveUninitialized: false,
    })
);

app.use("/company", companyRoutes);
app.use("/employee", employeeRoutes);

app.get("/test-session", (req, res) => {
    res.send(req.session);
});

const PORT = 3000;


app.get("/",(req,res)=>{
        res.render("home")
})




app.listen(PORT, ()=>{
    console.log(`server is running on : ${PORT}`)
})