import {requestServerNoDelay} from '/javascript/general.js'
let button = document.getElementById("submit");
let email = document.getElementById("email");


button.addEventListener("click",function(){
    let emailVal = email.value.trim();
    if(emailVal == ''){
        alert("Enter Email First");
    }
    requestServerNoDelay("POST","/forgetPassword",{"email":emailVal},function(request){
        if(request.status == 403){
            alert("Email does not exists");
        }else{
            alert("Check Your mail");
        }       
    })
})