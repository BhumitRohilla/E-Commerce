import {requestServerNoDelay} from '/javascript/general.js'
let button = document.getElementById("submit");
let email = document.getElementById("email");


button.addEventListener("click",function(){
    let emailVal = email.value.trim();
    if(emailVal == ''){
        alert("Enter Email First");
    }
    requestServerNoDelay("POST","/forgetPassword",{"email":emailVal},function(){
        alert("Check Your mail");
    })
})