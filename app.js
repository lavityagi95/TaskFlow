const express = require("express")
const companyRoutes = require("./routes/companyRoutes")

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use("/company", companyRoutes);

const PORT = 3000;


app.get("/",(req,res)=>{
        res.render("home")
})




app.listen(PORT, ()=>{
    console.log(`server is running on : ${PORT}`)
})