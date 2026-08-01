const express = require("express")

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const PORT = 3000;


app.get("/",(req,res)=>{
        res.render("home")
})




app.listen(PORT, ()=>{
    console.log(`server is running on : ${PORT}`)
})