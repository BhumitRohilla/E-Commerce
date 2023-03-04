require('dotenv').config();
console.log(process.env);
const express = require('express');
const app = express();
const crypto = require('crypto');
const session = require('express-session');
const fs = require('fs');
const userAuth = require('./middleware/userAuth')
const homeAuth = require('./middleware/homeAuth');
const sendVerificationMail = require('./func/sendVerificationMail');
const sendMail = require('./func/sendMail');

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: "bhumit rohilla",
    saveUninitialized: true,
    resave: false 
}))

app.get('/',(req,res)=>{
    console.log(req.session);
    res.render('root',{'user':req.session.user});
})

app.get('/home',homeAuth,(req,res)=>{
    res.send("display");
});

app.route('/login')
.get(userAuth,(req,res)=>{
    res.render('login',{'user':req.session.userName});
})
.post((req,res)=>{
    let userName = req.body.userValue;
    let password = req.body.pass;
    readFile('./userData.json',function(err,data){
        if(!err){
            // console.log(typeof data);
            let users = [];
            if(data.length > 1 && data[0]=='[' && data[data.length-1]==']'){
                users = JSON.parse(data);
            }
            for(let i = 0 ;i <users.length;++i){
                if(users[i].userName == userName && users[i].password == password){
                    req.session.is_logged_in=true;
                    req.session.userName = users[i].userName;
                    req.session.isVarified = users[i].isVarified;
                    req.session.index = 0;
                    res.statusCode = 200;
                    res.setHeader('Content-Type','plain/text')
                    res.end();
                    return ;
                }
            }
            res.statusCode = 401;
            res.setHeader('Content-Type','plain/text')
            res.end();
        }else{
            res.render('login',{err:"Server TimeOut"});
        }
    })
})


app.route('/signup')
.get(userAuth,(req,res)=>{
    res.render('signup',{'user':req.session.userName});
})
.post((req,res)=>{
    let {name,userName,password,email} = req.body;
    let user={
        name,userName,password,email,isVarified: false,key: crypto.randomBytes(5).toString('hex')
    }
    readFile('./userData.json',function(err,data){
        if(!err){
            let users = [];
            if( data.length > 1 && data[0]=='[' && data[data.length-1]==']'){
                users = JSON.parse(data);
            }
            for(let i = 0 ;i <users.length;++i){
                if(users[i].userName == userName){
                    res.statusCode = 401;
                    res.setHeader('Content-Type','plain/text')
                    res.end();
                    return ;
                }
            }
            users.push(user);
            writeFile('./userData.json',JSON.stringify(users),function(err){
                if(!err){

                    sendVerificationMail(user,function(){
                        res.statusCode = 200;
                        res.setHeader('Content-Type','plain/text')
                        res.end();
                    });
                    return ;
                }
            })
        }else{
            res.statusCode = 404;
            res.setHeader('Content-Type','plain/text')
            res.end();
        }
    })
})

app.get('/verify/:key',(req,res)=>{
    let {key} = req.params;
    readFile('./userData.json',function(err,data){
        if(!err){
            data = JSON.parse(data);
            data.forEach((element)=>{
                if(element.key == key){
                    element.isVarified = true;
                    writeFile('./userData.json',JSON.stringify(data),function(err){
                        if(err){
                            res.statusCode = 404;
                            return ;
                        }else{
                        }
                    });
                }
            });
        }
    })
    res.redirect('/home');
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})

app.route('/product')
.get((req,res)=>{
    console.log(req.session);
    req.session.index = 0;
    readFileStream('./product.json',function(data){
        res.render('product',({user:req.session.userName,"data":data}));
    },req);
    
})

app.get('/showMore',(req,res)=>{
    if(req.session.index && req.session.index == -1){
        res.statusCode=404;
        res.end();
        return ;
    }
    readFileStream('./product.json',function(data){
       res.setHeader('Content-Type','application/JSON');
       res.send(data);
    },req);
})


app.route('/changePassword')
.get(homeAuth,(req,res)=>{
    res.render('changePassword');
})
.post((req,res)=>{
    let {password} = req.body;
    let userName = req.session.userName;
    console.log(userName);
    readFile('./userData.json',function(err,data){
        if(!err){
            data = JSON.parse(data);
            let user ;
            data.forEach((element)=>{
                if(element.userName == userName){
                    user = element;
                    element.password = password;
                }
            })
            writeFile('./userData.json',JSON.stringify(data),function(err){
                if(!err){
                    sendMail(user,"Password Change","Info Board","<h1>Password Change</h1><p>Your password has been changed</p>",function(){
                        res.statusCode = 200;
                        req.session.destroy();
                        res.setHeader('Content-Type','application/JSON');
                        res.send();
                    })   
                }
            })
        }
    })
})

app.route('/forgetPassword')
.get((req,res)=>{
    res.render('forget');
})
.post((req,res)=>{
    let {email} = req.body;
    readFile('./userData.json',function(err,data){
        if(!err){
            data = JSON.parse(data);
            let user = null;
            data.forEach((element)=>{
                if(element.email == email){
                    match = true;
                    user = element;
                }
            })
            if(user == null){
                res.statusCode = 401;
                res.send();
                return ;
            }else{
                user.changePasswordToken = crypto.randomBytes(6).toString('hex');
                writeFile('./userData.json',JSON.stringify(data),function(){
                    sendMail(user,"Password Reset","Change Password",`<h1>Reset Password</h1><p>Use <a href="http://127.0.0.1:3000/forgetPassword/change/${user.changePasswordToken}">THIS</a> link to reset password </p>`,function(){
                        
                        res.statusCode = 200;
                        res.send();
                    });
                })
            }
        }
    })
})

app.get("/forgetPassword/change/:key",(req,res)=>{
    let {key} = req.params;
    readFile('./userData.json',function(err,data){
        if(!err){
            data = JSON.parse(data);
            let user ;
            data.forEach((element)=>{
                if(element.changePasswordToken == key){
                    user = element;
                }
            })
            if(user!=null){
                console.log(user.userName);
                req.session.userName = user.userName;
                req.session.is_logged_in = true;
                req.session.isVarified = true;
                res.redirect('/changePassword');
            }
        }
    })
})

app.get('*',(req,res)=>{
    res.sendStatus(404);
})



function readFile(path,callback){
    fs.readFile(path,'utf8',function(err,data){
        callback(err,data)
    })
}

function writeFile(path,string,callback){
    fs.writeFile(path,string,'utf8',function(err){
        callback(err);
    })
}

function readFileStream(path,callback,req){
    let index = req.session.index;
    let readStream = fs.createReadStream(path,{encoding:"ascii",highWaterMark:1,start:index});
    let array = [];
    let count = 5;
    let data ="";
    readStream.on('data',function(ele){
        if(ele=='{'){
            array.push('{');
            data+=ele;
        }
        else if(ele == '}'){
            data+=ele;
            array.pop();
            if(array.length == 0){
                count--;
            }
            if(count == 0){
                readStream.close(function(){
                   req.session.index += data.length+1;
                //    console.log(req.session.index);
                   display(data,callback);
                });
                
            }
        }else{
            data+=ele;
            // console.log(data.length);
        }
    });
    readStream.on('end',function(){
        if(count!=0){
            req.session.index = -1;
            display(data,callback);
        }
    })
}



function display(data,callback){
    if(data[0]!='['){
        data = '['+data;
    }
    if(data[data.length-1]!=']'){
        data+=']';
    }
    // console.log(data);
    data = JSON.parse(data);
    // console.log(data);
    callback(data);
}

console.log(process.env,__dirname);

app.listen(process.env.PORT,process.env.HOSTNAME,function(){
    console.log(process.env.PORT,process.env.HOSTNAME);
});