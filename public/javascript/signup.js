import {requestServer} from '/javascript/general.js'
const submitBtn = document.getElementById('submit-btn-signup');
const emailInput = document.getElementById('email');
const nameInput = document.getElementById('name');
const userNameInput = document.getElementById('userName');
const password1Input = document.getElementById('password1');
const password2Input = document.getElementById('password2');
const tosCheck = document.getElementById('tos-checkbox');
const errMsg = document.getElementById('err-msg');
const tosCheckDiv = document.getElementById('tos-container');
let timeOut = null;

let formArray = [
    emailInput,nameInput,userNameInput,password1Input,password2Input
]

submitBtn.addEventListener('click',function(){
    let email = emailInput.value.trim();
    let name = nameInput.value.trim();
    let userName = userNameInput.value.trim();
    let password1 = password1Input.value.trim();
    let password2 = password2Input.value.trim();
    console.log(email,name,userName,password1,password2);
    if(email == "" || name == "" || userName == "" || password1 == ""|| password2 == ""){
        errThrough("Please enter all the fields",1);
    }
    else if(password1 != password2){
        errThrough("password are not matching",2);
    }else if(!(tosCheck.checked)){
        errThrough("Please accept term of conditions.",3);
    }else{
        let data = {
            name,
            userName,
            password: password1,
            email
        }
        
        requestServer('POST','/signup',data,function(request){
            if(timeOut!=null){
                clearTimeout(timeOut);
                clearError();
            }
            submitBtn.classList.remove('submitted');
            submitBtn.classList.add('submit');
            submitBtn.innerHTML = `Submit`;
            submitBtn.removeAttribute("disabled");
            console.log(request.status);
            switch(request.status){
                case 200:{
                    errThrough("Account Create Please Varify your email. Redirecting to login page",0);
                    break;
                }
                case 401:{
                    errThrough("UserName already Taken",4);
                    break;
                }
                case 303:{
                    errThrough("Email cant be sent",5);
                }
            }
        })
        submitBtn.setAttribute("disabled","true");
        submitBtn.classList.remove('submit');
        submitBtn.classList.add('submitted');
        submitBtn.innerHTML = `<div class="circle-animation dim-circle"></div>`
    }
})

function errThrough(error,cond){
    errMsg.style.visibility='visible';
    switch(cond){
        case 0:{
            errMsg.innerText = error;
            submitBtn.classList.remove('submit');
            submitBtn.classList.add('submitted');
            submitBtn.innerHTML = `<div class="circle-animation dim-circle"></div>`
            submitBtn.setAttribute("disabled",'true');
            setTimeout(function(){
                window.location.href = '/login';
            },3000);
            break;
        }
        case 1:{
            errMsg.innerText = error;
            formArray.forEach((element)=>{
                element.classList.add("err-msg-container");
            })
            break;
        }
        case 2:{
            errMsg.innerText = error;
            password1Input.classList.add('err-msg-container');
            password2Input.classList.add('err-msg-container');
            break;
        }
        case 3:{
            errMsg.innerText = error;
            tosCheckDiv.classList.add('err-msg-container');
        }
        case 4:{
            errMsg.innerText = error;
            break;
        }
        case 5:{
            errMsg.innerText = error;
            break;
        }
    }

    timeOut= setTimeout(clearError,6000);
}

function clearError(){
    formArray.forEach((element)=>{
        element.classList.remove('err-msg-container');
    })
    errMsg.style.visibility = 'hidden';
    tosCheckDiv.classList.remove('err-msg-container');
}
