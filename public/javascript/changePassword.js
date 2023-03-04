import {requestServerNoDelay} from '/javascript/general.js'
let submitBtn = document.getElementById('submit-btn');
let password1 = document.getElementById('password1');
let password2 = document.getElementById('password2');
submitBtn.addEventListener('click',function(){
    let p1 = password1.value.trim();
    let p2 = password2.value.trim();
    if(p1 == "" || p2 == ""){
        alert("password fields are emtpy");
    }else if(p1 != p2){
        alert("Password are not matching");
    }else{
        requestServerNoDelay('POST','/changePassword',{"password":p1},function(){
            alert("Password Changed check your mail");
            window.location.href='/login';
        })
    }
})