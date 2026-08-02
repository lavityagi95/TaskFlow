const menuBtn = document.getElementById("menuBtn");

const navLinks = document.querySelector(".nav-links");

menuBtn.addEventListener("click", ()=>{

    navLinks.classList.toggle("active");

    if(menuBtn.innerHTML==="☰"){

        menuBtn.innerHTML="✖";

    }

    else{

        menuBtn.innerHTML="☰";

    }

});