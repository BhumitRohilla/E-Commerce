require('dotenv').config();
const express = require('express');
const app = express();
const crypto = require('crypto');
const session = require('express-session');
const fs = require('fs');
const userAuth = require('./middleware/userAuth')
const homeAuth = require('./middleware/homeAuth');
const sendVerificationMail = require('./func/sendVerificationMail');
const sendMail = require('./func/sendMail');
const adminAuth = require('./middleware/adminAuth');
const multer = require('multer');
const upload = multer({'dest':'public/image/product/'});

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(session({
    secret: "bhumit rohilla",
    saveUninitialized: true,
    resave: false 
}))



const {MongoClient} = require('mongodb');
const client = new MongoClient(process.env.MONGO);
const databaseName = 'e-comm';
let db =null;

client.connect()
.then(function(){
    db = client.db(databaseName);
    console.log("connected");
})
.catch(function(err){
    console.log(err);
})

app.get('/',(req,res)=>{
    if(req.session.user)
        res.render('root',{'user': req.session.user && req.session.user.userName});
    else{
        res.render('root',{'user': undefined});
    }
});

app.get('/home',homeAuth,(req,res)=>{
    res.redirect('product');
});

app.route('/login')
.get(userAuth,(req,res)=>{
    res.render('login',{'user':req.session.is_logged_in});
})
.post((req,res)=>{
    let userName = req.body.userValue;
    let password = req.body.pass;
    getUser({userName,password})
    .then(function(data){
        if(data == null){
            res.statusCode = 401;
            res.end();
            return ;
        }
        req.session.is_logged_in=true;
        req.session.user = data;
        res.statusCode = 200;
        res.setHeader('Content-Type','plain/text')
        res.end();
    })
    .catch(function(err){
        res.statusCode = 401;
        res.setHeader('Content-Type','plain/text')
        res.end();
    })
})




app.route('/signup')
.get(userAuth,(req,res)=>{
    res.render('signup',{'user':req.session.userName});
})
.post( (req,res)=>{
    let {name,userName,password,email} = req.body;
    let user={
        name,userName,password,email,isVarified: false,key: crypto.randomBytes(5).toString('hex'),passwordChange: null
    }
    insertUser(user)
    .then(function(data){
        if(data == 200){
            sendVerificationMail(user,function(){
                res.statusCode = 200;
                res.setHeader('Content-Type','plain/text')
                res.end();
            });
        }
    })
    .catch(function(err){
        res.statusCode = err;
        res.send();
    })
})


async function checkUser(user){
    return db.collection('users').find(user).toArray()
    .then(function(data){
        return data;
    })
    .catch(function(err){
        throw err;
    })
}

app.get('/verify/:key',(req,res)=>{
    let filter = {'key':req.params.key};
    updateUser(filter,{"isVarified":true})
    .then(()=>{
        res.redirect('/login');
    })
    .catch((err)=>{
        console.log(err);
    })
})

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})

app.route('/product')
.get(homeAuth,async (req,res)=>{
    // readFileStream('./product.json',function(data){
    //     res.render('product',({user:req.session.userName,"data":data}));
    // },req);
    req.session.index = 0;
    let data = await getProducts(0,5);
    req.session.index = data.length;
    
    res.render('product',{'user': req.session.user && req.session.user.userName,"data":data});
    // res.render('product',{user:req.session.userName,"data":data});
})

async function getProducts(starting,number){
    return  await db.collection('product').find().skip(starting).limit(5).toArray()
}

app.get('/showMore',async (req,res)=>{
    let skip = req.session.index;
    
    let data = await getProducts( skip , 5);
    if( data == 0){
        res.statusCode = 403;
        res.send();
        return ;
    }
    req.session.index = skip + data.length;
    res.render('partials/productMore',{user:req.session.userName,"data":data});

    // let data = getProducts(parseInt(req.session.index),5);
    // req.session.index += data.length;
    // res.send(data);
    // if(req.session.index && req.session.index == -1){
    //     res.statusCode=404;
    //     res.end();
    //     return ;
    // }
    // readFileStream('./product.json',function(data){
    //    res.setHeader('Content-Type','application/JSON');
    //    res.send(data);
    // },req);
})


app.route('/changePassword')
.get(homeAuth,(req,res)=>{
    res.render('changePassword',{user:req.session.user.userName});
})
.post((req,res)=>{
    let {password} = req.body;
    let user = req.session.user;

 //TODO: Make a function for this
    db.collection('users').updateOne({"userName":user.userName,"email":user.email},{$set:{password}})
    .then(function(data){
        sendMail(user,"Password Change","Info Board","<h1>Password Change</h1><p>Your password has been changed</p>",function(){
            res.statusCode = 200;
            req.session.destroy();
            res.setHeader('Content-Type','application/JSON');
            res.send();
        })
    })
    .catch(function(err){
        console.log(err);
    })
    // readFile('./userData.json',function(err,data){
    //     if(!err){
    //         data = JSON.parse(data);
    //         let user ;
    //         data.forEach((element)=>{
    //             if(element.userName == userName){
    //                 user = element;
    //                 element.password = password;
    //             }
    //         })
    //         writeFile('./userData.json',JSON.stringify(data),function(err){
    //             if(!err){
    //                 sendMail(user,"Password Change","Info Board","<h1>Password Change</h1><p>Your password has been changed</p>",function(){
    //                     res.statusCode = 200;
    //                     req.session.destroy();
    //                     res.setHeader('Content-Type','application/JSON');
    //                     res.send();
    //                 })   
    //             }
    //         })
    //     }
    // })
})

app.route('/forgetPassword')
.get((req,res)=>{
    res.render('forget');
})
.post(async (req,res)=>{
    let {email} = req.body;
    try{
        let data = await getUser({email});
        if(data === null){
            res.statusCode = 403;
            res.end();
            return ;
        }
        let changePasswordToken = crypto.randomBytes(6).toString('hex');
        data.passwordChange = changePasswordToken;
        updateUser({email},{"passwordChange":changePasswordToken})
        .then(()=>{
            data.passwordChange = changePasswordToken;
            sendMail(data,"Password Reset","Change Password",`<h1>Reset Password</h1><p>Use <a href="http://${process.env.HOSTNAME}:${process.env.PORT}/forgetPassword/change/${data.passwordChange}">THIS</a> link to reset password </p>`,function(){    
                res.statusCode = 200;
                res.send();
            });
        })
    }
    catch(err){
        res.statusCode = 404;
        res.end();
        console.log(err);
    }

    
    // let {email} = req.body;
    // readFile('./userData.json',function(err,data){
    //     if(!err){
    //         data = JSON.parse(data);
    //         let user = null;
    //         data.forEach((element)=>{
    //             if(element.email == email){
    //                 match = true;
    //                 user = element;
    //             }
    //         })
    //         if(user == null){
    //             res.statusCode = 401;
    //             res.send();
    //             return ;
    //         }else{
    //             user.changePasswordToken = crypto.randomBytes(6).toString('hex');
    //             writeFile('./userData.json',JSON.stringify(data),function(){
    //                 sendMail(user,"Password Reset","Change Password",`<h1>Reset Password</h1><p>Use <a href="http://127.0.0.1:3000/forgetPassword/change/${user.changePasswordToken}">THIS</a> link to reset password </p>`,function(){
                        
    //                     res.statusCode = 200;
    //                     res.send();
    //                 });
    //             })
    //         }
    //     }
    // })
})

app.get('/getProductValue/:id',(req,res)=>{
    // res.send(req.params);
    let {id} = req.params;
    getQuantity(id,req.session.user.userName,function(data){
        res.statusCode = 200 ;
        res.setHeader('Content-Type','plain/text');
        res.send(data.toString());
    });
})

async function updateUser(filter,output){
    return db.collection('users').updateOne(filter,{$set:output})
    .then(function(data){
        return data;
    })
    .catch(function(err){
        console.log(err)
    })
}

app.get('/buyProduct/:pid',async (req,res)=>{
    let {pid} = req.params;
    let stockLeft = await getProductStock(pid);
    if(stockLeft > 0){
        res.statusCode = 201;
        addToCart(pid,req.session.user.userName);
    }else{
        res.statusCode = 204;
    }
    res.send();
})

app.get('/removeProduct/:pid',async (req,res)=>{
    let {pid} = req.params;
    let quantity = await quantityElement(req.session.user.userName,pid);
    console.log(quantity);
    if(quantity > 0){
        res.statusCode = 201;
        removeFromCart(pid,req.session.user.userName);
    }else{
        res.statusCode = 204;
    }
    res.send();
})

app.route('/myCart')
.get(homeAuth,async (req,res)=>{
    let cart = await getUserCart(req.session.user.userName);
    let cartItem = await getUserCartItem(cart); 
    res.render('cart',({"userName":req.session.user.userName,"items":cartItem}));
})

app.get("/forgetPassword/change/:key",async (req,res)=>{
    let {key} = req.params;
    let user = await getUser({'passwordChange':key});

    if(user != null){
        req.session.is_logged_in = true;
        req.session.user = user;
        
    }
    res.redirect("/changePassword");
    // readFile('./userData.json',function(err,data){
    //     if(!err){
    //         data = JSON.parse(data);
    //         let user ;
    //         data.forEach((element)=>{
    //             if(element.changePasswordToken == key){
    //                 user = element;
    //             }
    //         })
    //         if(user!=null){
    //             req.session.userName = user.userName;
    //             req.session.is_logged_in = true;
    //             req.session.isVarified = true;
    //             res.redirect('/changePassword');
    //         }
    //     }
    // })
})

app.route('/adminDashboard')
.get(adminAuth,(req,res)=>{
    let err = req.session.err;
    if(err!=undefined){
        delete req.session.err;
    }
    res.render('adminDashboard',{"userName":req.session.user.userName,"err":err});  
})

app.post('/addNewProduct', upload.single("product-img")  ,(req,res)=>{
    console.log(req.body);
    let obj = {};
    
    if(req.file.size > 25600){
        req.session.err = "File is larger then 250kb";
        console.log("File is large");
    }
    else{
        let {title,tags,date,status,userReviews,price,stock,about} = req.body;
        obj = {title,tags,date,status,userReviews,price,stock,about};
        obj.imgSrc = req.file.filename;
        console.log(req.file);
        addProduct(obj);
    }
    
    res.redirect('/adminDashboard');

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
    data = JSON.parse(data);
    callback(data);
}
app.listen(process.env.PORT,process.env.HOSTNAME,function(){
    console.log(`server running at http://${process.env.HOSTNAME}:${process.env.PORT}`);
});


async function getUser(user){
    return db.collection('users').findOne(user)
   .then(function(data){
        return data;
   })
   .catch(function(err){
        throw err;
   })
}


async function getUserCart(userName){
    // console.log(user);
    //TODO: Remove db dependency from here;
    return db.collection('cart').findOne({"userName":userName});
}

async function insertUser(user){
    let userName = user.userName;
    let email = user.email;
    let oldUser = {userName,email}
    
    oldUser = await checkUser(oldUser);
    if(oldUser.length != 0){
        throw 401;
    }

    return db.collection('users').insertOne(user)
    .then(function(){
        return 200;
    })
    .catch(function(){
        return 404;
    })
    // readFile('./userData.json',function(err,data){
    //     if(!err){
    //         let users = [];
    //         if( data.length > 1 && data[0]=='[' && data[data.length-1]==']'){
    //             users = JSON.parse(data);
    //         }
    //         for(let i = 0 ;i <users.length;++i){
    //             if(users[i].userName == userName){
    //                 res.statusCode = 401;
    //                 res.setHeader('Content-Type','plain/text')
    //                 res.end();
    //                 return ;
    //             }
    //         }
    //         users.push(user);
    //         writeFile('./userData.json',JSON.stringify(users),function(err){
    //             if(!err){

    //                 sendVerificationMail(user,function(){
    //                     res.statusCode = 200;
    //                     res.setHeader('Content-Type','plain/text')
    //                     res.end();
    //                 });
    //                 return ;
    //             }
    //         })
    //     }else{
    //         res.statusCode = 404;
    //         res.setHeader('Content-Type','plain/text')
    //         res.end();
    //     }
    // })
}

async function addToCart(pid, userName){
    //TODO: Move this into a function remove dependence on database; 
    let userCart = await db.collection('cart').findOne({"userName":userName});
    try{
        userCart.product[pid].quantity++;
    }
    catch(err){
        console.log(err);
        userCart.product[pid] = {};
        userCart.product[pid].quantity = 1;
    }
    db.collection('cart').updateOne({"userName":userName},{$set:{"product":userCart.product}});
}

function getQuantity(pid,userName,callback){
    fs.readFile('./cart.json',function(err,data){
        if(err){
            console.log(err);
        }else{
            data = JSON.parse(data);
            try{
                let quantity = data[userName][pid].quantity;
                if(quantity == undefined){
                    quantity = 0;
                }
                callback(quantity);
            }
            catch(err){
                console.log(err);
                callback(0);
            }
            

        }
    })
}

async function getProductStock(pid){
    //TODO: Add it In another function remove dependecy on function; 
    let element = await db.collection('product').findOne({"id":pid});
    let stock = element.stock;
    if(stock == 0){
        return 0;
    }else{
        try{
            await db.collection('product').updateOne({"id":pid},{$set:{"stock":(stock-1)}});
        }
        catch(err){
            console.log(err);
        }
        return stock;
    }
}

async function getUserCartItem(cart){
    let allItems = await getAllProduct();
    let obj = {};
    for(key in cart.product){
        obj[key] = allItems[key];
        obj[key].quantity = cart.product[key].quantity;
    }

    return obj;
}

async function getAllProduct(){
    //TODO: remote dependency;
    let data = await db.collection('product').find().toArray();
    let obj ={};
    data =  data.forEach((element)=>{
        obj[element.id] = element;
    })
    return obj;
}

async function removeFromCart(pid, userName){
    //TODO: Move this into a function remove dependence on database; 
    let userCart = await db.collection('cart').findOne({"userName":userName});
    try{
        if(userCart.product[pid].quantity > 0){
            userCart.product[pid].quantity--;
        }
    }
    catch(err){
        console.log(err);
        userCart.product[pid] = {};
        userCart.product[pid].quantity = 1;
    }
    db.collection('cart').updateOne({"userName":userName},{$set:{"product":userCart.product}});
    let data = await db.collection('product').findOne({'id':pid});
    data.stock++;
    db.collection('product').updateOne({'id':pid},{$set:{"stock":data.stock}});
}


async function quantityElement(userName,pid){
    //TODO: move it into function
    let cart = await db.collection('cart').findOne({'userName':userName});
    return cart.product[pid].quantity;
}