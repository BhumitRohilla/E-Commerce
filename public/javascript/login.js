import {requestServer} from '/javascript/general.js'
let loginBtn = document.getElementById('submit-login');
let userName = document.getElementById('userName');
let password = document.getElementById('password');
let joinBtn = document.getElementById('join-btn');

loginBtn.addEventListener('click',function(){
    let userValue = userName.value.trim();
    let pass = password.value.trim();
    if(userValue=='' || pass==''){
        return ;
    }
    let obj ={userValue,pass};
    requestServer('POST','/login',obj,function(request){
        loginBtn.classList.remove('submitted');
        loginBtn.classList.add('submit');
        loginBtn.innerHTML = `Sign in`;
        loginBtn.removeAttribute("disabled");
        console.log(request.status);
        switch(request.status){
            case 200:{
                window.location.href = '/home';
                break;
            }
            case 401:{
                wrongUser();
            }
        }
    })
    loginBtn.setAttribute("disabled","true");
    loginBtn.classList.remove('submit');
    loginBtn.classList.add('submitted');
    loginBtn.innerHTML = `<div class="circle-animation dim-circle"></div>`
})



function wrongUser(){
    userName.style.outline='1px solid red';
    password.style.outline='1px solid red';
    document.getElementById('err-msg').style.visibility='visible';
}


joinBtn.addEventListener('click',function(){
    window.location.href = '/signup';
})