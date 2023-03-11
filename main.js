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
const path = require('path');
const {MongoClient} = require('mongodb');
const {checkUser,getUser,insertUser,updateUser} = require('./func/userFunc')


app.set('view engine','ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(session({
    secret: "bhumit rohilla",
    saveUninitialized: true,
    resave: false 
}))


//TODO: What to do?
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
    //TODO: Home Page
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
    getUser({userName,password},db)
    .then(function(data){
        if(data == null){
            res.statusCode = 401;
            res.end();
            return ;
        }
        req.session.is_logged_in=true;
        req.session.user = data;
        res.statusCode = 200;
        res.setHeader('Content-Type','text/plain')
        res.end();
    })
    .catch(function(err){
        res.statusCode = 401;
        res.setHeader('Content-Type','text/plain')
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
    insertUser(user,db)
    .then(function(data){
        if(data == 200){
            sendVerificationMail(user,function(err){
                if(!err){
                    res.statusCode = 200;
                    res.setHeader('Content-Type','text/plain')
                    res.end();
                }else{
                    res.statusCode = 303;
                    res.setHeader('Content-Type','text/plain');
                    res.end();
                }
            });
        }
    })
    .catch(function(err){
        res.statusCode = err;
        res.send();
    })
})




app.get('/verify/:key',(req,res)=>{
    let filter = {'key':req.params.key};
    updateUser(filter,{"isVarified":true},db)
    .then(()=>{
        res.redirect('/login');
    })
    .catch((err)=>{
        res.send("Error Occur");
    })
})

// * Done upto Hear

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
        let data = await getUser({email},db);
        if(data === null){
            res.statusCode = 403;
            res.end();
            return ;
        }
        let changePasswordToken = crypto.randomBytes(6).toString('hex');
        data.passwordChange = changePasswordToken;
        updateUser({email},{"passwordChange":changePasswordToken},db)
        .then(()=>{
            data.passwordChange = changePasswordToken;
            sendMail(data,"Password Reset","Change Password",`<h1>Reset Password</h1><p>Use <a href="http://${process.env.HOSTNAME}:${process.env.PORT}/forgetPassword/change/${data.passwordChange}">THIS</a> link to reset password </p>`,function(){    
                res.statusCode = 200;
                res.send();
            });
        })
        .catch((err)=>{
            res.statusCode = 404;
            res.send();
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

app.get('/getProductValue/:id',async (req,res)=>{
    // res.send(req.params);
    let {id} = req.params;
    // getQuantity(id,req.session.user.userName,function(data){
    //     res.statusCode = 200 ;
    //     res.setHeader('Content-Type','text/plain');
    //     res.send(data.toString());
    // });
    //TODO: Error Handleing;
    let quantity = await getQuantity(id,req.session.user.userName);
    res.statusCode = 200;
    res.setHeader("Content-Type",'text/plain');
    res.send(quantity.toString());
})


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
    if(quantity > 1){
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
    let user = await getUser({'passwordChange':key},db);

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
.get(adminAuth,async (req,res)=>{
    let err = req.session.err;
    if(err!=undefined){
        delete req.session.err;
    }
    // TODO: Error Handling to be added;
    let allProduct = await getAllProduct();
    console.log(allProduct);
    res.render('adminDashboard',{"userName":req.session.user.userName,"err":err,"product":allProduct});  
})


app.route('/adminDashboard/addNewProduct')
.get(adminAuth,(req,res)=>{
    res.render('newProductPage');
})
.post(adminAuth,upload.single("product-img")  ,async (req,res)=>{
    console.log(req.body);
    let obj = {};
    
    if(req.file.size > 256000){
        console.log("File is large");
        res.statusCode = 402;
    }
    else{
        let {title,tags,date,status,userReviews,stock,about} = req.body;
        obj = {title,tags,date,status,userReviews,stock,about};
        obj.imgSrc = req.file.filename;
        console.log(req.file);
        try{
            await addProduct(obj);
            res.statusCode = 200;
        }
        catch(err){
            console.log(err);
            res.statusCode = 404;
        }
    }
    res.setHeader('Content-Type','text/plain');
    res.send();

})

app.route('/adminDashboard/updateProduct/:id')
.get(adminAuth,async (req,res)=>{
    let {id} = req.params;
    //TODO: Move This Into a function
    let item = await db.collection('product').findOne({id});
    res.render('updateProductPage',({item}));
})
.post(adminAuth,upload.single('product-img'),async (req,res)=>{
    //TODO: Move This Into a function
    let {title,tags,date,status,userReviews,stock,about} = req.body;
    let {id} = req.params;
    let item = await db.collection('product').findOne({id});
    let updated = false;
    if(title!=""){
        item.title = title;
        updated = true;
    }
    if(tags!=""){
        item.tag = tags.split(' ');
        updated = true;
    }
    if(date !=''){
        item.date = date;
        updated = true;
    }
    if(status != ''){
        item.status = status;
        updated = true;
    }
    if(userReviews != ''){
        item.userReviews = userReviews;
        updated = true;
    }
    if(item.stock != ''){
        item.stock = stock;
        updated = true;
    }
    if(item['about-game'] != '' ){
        item['about-game'] = about;
        updated = true;
    }
    let olderFile = item.img;
    if(req.file!=undefined){
        item.img = req.file.filename;
        updated = true;
        fs.unlink(path.join(__dirname,'/public/image/product',olderFile));
    }

    if(updated){
        //TODO: Move This into code;
        db.collection('product').updateOne({"id":item.id},{$set:item})
        .then(function(){
            res.statusCode = 200;
            res.setHeader('Content-Type','text/plain');
            res.send();
        })
        .catch((err)=>{
            console.log(err);
            res.statusCode = 404;
            res.setHeader('Content-Type','plain/text');
            res.send();
        })
    }

    console.log(item);
    console.log("updating the product");

});

app.post('/deleteProduct',(req,res)=>{
    req.data = '';
    req.on('data',function(chunk){
        req.data+=chunk;
    })
    req.on('end',function(){
        console.log(req.data);
        deletElement(req.data)
        .then(function(){
            res.setHeader('Content-Type','text/plain');
            res.statusCode = 200;
            res.send();
        })
        .catch((err)=>{
            console.log(err);
            res.setHeader('Content-Type','text/plain');
            res.statusCode = 404;
            res.send();
        })
    })
})

app.get('*',(req,res)=>{
    res.sendStatus(404);
})

function deletElement(id){
    //TODO: Move This into function
    return db.collection('product').deleteOne({id});
}

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



async function getUserCart(userName){
    // console.log(user);
    //TODO: Remove db dependency F;
    return db.collection('cart').findOne({"userName":userName});
}



async function addToCart(pid, userName){
    //TODO: Move this into a function remove dependence on database; 
    let userCart = await db.collection('cart').findOne({"userName":userName});
    try{
        userCart.product[pid].quantity++;
    }
    catch(err){
        console.log(userCart);
        let userExist = true;
        if(userCart == null){
            userCart = {
                userName,
                product : {}
            }
            userExist = false;
        }
        console.log(err);
        userCart.product[pid] = {};
        userCart.product[pid].quantity = 1;
        if(!userExist){
            db.collection('cart').insertOne(userCart);
            return ;
        }
    }
    db.collection('cart').updateOne({"userName":userName},{$set:{"product":userCart.product}});
}

async function getQuantity(pid,userName){
    // TODO: Remove This Dependency
    let data = await db.collection('cart').findOne({userName});
    let quantity;
    if(data == null){
        quantity = 0;
    }else{
        console.log(data);
        try{
            quantity = data.product[pid].quantity;
            console.log(quantity);
        }
        catch(err){
            console.log(err);
            quantity =  0;
        }
    }
    return quantity;
}

// function getQuantity(pid,userName,callback){
//     fs.readFile('./cart.json',function(err,data){
//         if(err){
//             console.log(err);
//         }else{
//             data = JSON.parse(data);
//             try{
//                 let quantity = data[userName][pid].quantity;
//                 if(quantity == undefined){
//                     quantity = 0;
//                 }
//                 callback(quantity);
//             }
//             catch(err){
//                 console.log(err);
//                 callback(0);
//             }
            

//         }
//     })
// }

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
    //TODO: ERROR HANDLING
    let allItems = await getAllProduct();
    let obj = {};
    if(cart != null){
        for(key in cart.product){
            obj[key] = allItems[key];
            if(obj[key]==undefined){
                //TODO: Remove Dependency from this code
                let propertyToDelete = "product"+key;
                db.collection('cart').updateMany({},{ $unset: {propertyToDelete}});
                delete obj[key];
            }else{
                obj[key].quantity = cart.product[key].quantity;
            }
        }
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


async function addProduct(obj){
    //TODO: Remove This Dependency;
    let finalObj = {}
    finalObj.id = crypto.randomBytes(7).toString('hex');
    finalObj.title = obj.title;
    let tagArray = obj.tags.split(' ');
    finalObj.date = obj.date;
    finalObj.tag = tagArray;
    finalObj.status = obj.status;
    finalObj.userReviews = obj.userReviews;
    finalObj.img = obj.imgSrc;
    finalObj.stock = obj.stock;
    finalObj['about-game'] = obj.about;
    console.log(finalObj);
    return await db.collection('product').insertOne(finalObj)
}

