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
const {checkUser,getUser,insertUser,updateUser} = require('./func/userFunc');
const {getProducts,getSingleProduct,decreaseOneStock,getAllProduct,addProduct,updateProduct,deleteSingleProduct} = require('./func/productFunc');
const {getQuantity,addToCart,removeFromCart,getUserCart,getUserCartItem,deleteFromCart} = require('./func/cartFunction');

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
    //TODO: Home Page UI
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





app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})




app.route('/changePassword')
.get(homeAuth,(req,res)=>{
    res.render('changePassword',{user:req.session.user.userName});
})
.post((req,res)=>{
    let {password} = req.body;
    let user = req.session.user;

    // db.collection('users').updateOne({"userName":user.userName,"email":user.email},{$set:{}})
    updateUser({"userName":user.userName,"email":user.email},{password},db)
    .then(function(data){
        //TODO: Lower priority move it into it's own function
        sendMail(user,"Password Change","Info Board","<h1>Password Change</h1><p>Your password has been changed</p>",function(){
            res.statusCode = 200;
            req.session.destroy();
            res.setHeader('Content-Type','text/plain');
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



app.get("/forgetPassword/change/:key",async (req,res)=>{
    let {key} = req.params;
    let user;
    try{
        user = await getUser({'passwordChange':key},db);
    }
    catch(err){
        console.log(err);
        res.statusCode = 404;
        res.send();
        return;
    }
    if(user != null){
        req.session.is_logged_in = true;
        req.session.user = user;
        updateUser({"userName":user.userName},{passwordChange:null},db);
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




app.route('/product')
.get(homeAuth,async (req,res)=>{
    // readFileStream('./product.json',function(data){
    //     res.render('product',({user:req.session.userName,"data":data}));
    // },req);
    req.session.index = 0;
    let data = await getProducts(0,5,db);
    req.session.index = data.length;
    
    res.render('product',{'user': req.session.user && req.session.user.userName,"data":data});
    // res.render('product',{user:req.session.userName,"data":data});
})





app.get('/showMore',async (req,res)=>{
    let skip = req.session.index;
    
    let data = await getProducts( skip , 5 , db);
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








app.get('/getProductValue/:id',async (req,res)=>{
    // res.send(req.params);
    let {id} = req.params;
    // getQuantity(id,req.session.user.userName,function(data){
    //     res.statusCode = 200 ;
    //     res.setHeader('Content-Type','text/plain');
    //     res.send(data.toString());
    // });
    let quantity;
    try{
        quantity = await getQuantity(id,req.session.user.userName,db);
    }
    catch(err){
        console.log(err);
        res.statusCode = 404;
        res.setHeader("Content-Type",'text/plain');
        res.send();
        return ;
    }
    res.statusCode = 200;
    res.setHeader("Content-Type",'text/plain');
    res.send(quantity.toString());
})






app.get('/buyProduct/:pid',async (req,res)=>{
    let {pid} = req.params;
    let stock
    try{
        let product = await getSingleProduct(pid,db);
        stock = product.stock;
    }
    catch(err){
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.send();
        return ;
    }
    if(stock > 0){
        res.statusCode = 201;
        try{
            addToCart(pid,req.session.user.userName,db);
        }
        catch(err){
            console.log(err);
            res.statusCode = 404;
            res.send();
            return ;
        }
        try{
            decreaseOneStock(pid,db);
        }
        catch(err){
            removeFromCart(pid,req.session.user.userName,db);
            console.log(err);
            res.statusCode = 404;
            res.send();
        }
    }else{
        res.statusCode = 204;
    }
    res.send();
})





app.get('/removeProduct/:pid',async (req,res)=>{
    let {pid} = req.params;
    let quantity;
    try{
        quantity = await getQuantity(pid,req.session.user.userName,db);
    }
    catch(err){
        console.log(err);
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.send();
    }
    // console.log(quantity);
    if(quantity > 1){
        res.statusCode = 201;
        try{
            removeFromCart(pid,req.session.user.userName,db);
        }
        catch(err){
            console.log(err);
            res.statusCode = 404;
            res.send();
            return ;
        }
    }else{
        res.statusCode = 204;
    }
    res.send();
})



app.get('/deleteProduct/:pid',async (req,res)=>{
    let {pid} = req.params;
    
    deleteFromCart(pid,req.session.user.userName,db)
    .then(function(){
        res.statusCode = 201;
        res.setHeader('Content-Type','text/plain');
        res.send();
    })
    .catch((err)=>{
        console.log(err);
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.send();
    })
})


app.route('/myCart')
.get(homeAuth,async (req,res)=>{
    try{
        let cart = await getUserCart(req.session.user.userName,db);
        let cartItem = await getUserCartItem(cart,db); 
        res.render('cart',({"userName":req.session.user.userName,"items":cartItem}));
    }
    catch(err){
        console.log(err);
        res.statusCode = 404;
        res.send("Error Occure");
    }
})




app.route('/adminDashboard')
.get(adminAuth,async (req,res)=>{
    let err = req.session.err;
    if(err!=undefined){
        delete req.session.err;
    }
    // TODO: Error Handling to be added;
    let allProduct;
    try{
        allProduct = await getAllProduct(db);
    }
    catch(err){
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.send();
        return ;
    }
    res.render('adminDashboard',{"userName":req.session.user.userName,"err":err,"product":allProduct});  
})




app.route('/adminDashboard/addNewProduct')
.get(adminAuth,(req,res)=>{
    res.render('newProductPage');
})
.post(adminAuth,upload.single("product-img")  ,async (req,res)=>{
    // console.log(req.body);
    let obj = {};
    
    if(req.file.size > 256000){
        console.log("File is large");
        res.statusCode = 402;
    }
    else{
        let {title,tags,date,status,userReviews,stock,about} = req.body;
        obj = {title,tags,date,status,userReviews,stock,about};
        obj.imgSrc = req.file.filename;
        // TODO: Implement check here checkInput(obj);
        let isValid = checkProductValues(obj);
        if(!isValid){
            res.statusCode = 404;
        }
        // console.log(req.file);
        else{
            try{
                obj.id = crypto.randomBytes(7).toString('hex');
                await addProduct(obj,db);
                res.statusCode = 200;
            }
            catch(err){
                console.log(err);
                res.statusCode = 404;
            }
        }
    }
    res.setHeader('Content-Type','text/plain');
    res.send();

})







app.route('/adminDashboard/updateProduct/:pid')
.get(adminAuth,async (req,res)=>{
    let {pid} = req.params;
    let item;
    try{
        item = await getSingleProduct(pid,db);
    }
    catch(err){
        res.statusCode = 404;
        res.send("Unable to find the product");
        return ;
    }
    // let item = await db.collection('product').findOne({id});
    res.render('updateProductPage',({item}));
})
.post(adminAuth,upload.single('product-img'),async (req,res)=>{
    let {title,tags,date,status,userReviews,stock,about} = req.body;
    let {pid} = req.params;
    let item;
    //TODO:
    try{
        item = await getSingleProduct(pid,db);
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
        if(userReviews != '' && userReviews > 0){
            item.userReviews = userReviews;
            updated = true;
        }
        if(stock != '' && stock > 0){
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
            // TODO: Low Priority Move It into function;
            fs.unlink(path.join(__dirname,'/public/image/product',olderFile),function(){
                
            });
        }

        if(updated){
            // db.collection('product').updateOne({"id":item.id},{$set:item})
            updateProduct(pid,item,db)
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
    }
    catch(err){
        console.log(err);
        res.statusCode = 404;
        res.setHeader('Content-Type','text/plain');
        res.send();
    }
    // let item = await db.collection('product').findOne({id});
});





app.post('/deleteProduct',(req,res)=>{
    req.data = '';
    req.on('data',function(chunk){
        req.data+=chunk;
    })
    req.on('end',function(){
        // console.log(req.data);
        // deletElement(req.data)
        deleteSingleProduct(req.data,db)
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

app.listen(process.env.PORT,process.env.HOSTNAME,function(){
    console.log(`server running at http://${process.env.HOSTNAME}:${process.env.PORT}`);
});


// * Done upto Hear

// function deletElement(id){
// //     return db.collection('product').deleteOne({id});
// // }

// function readFile(path,callback){
//     fs.readFile(path,'utf8',function(err,data){
//         callback(err,data)
//     })
// }

// function writeFile(path,string,callback){
//     fs.writeFile(path,string,'utf8',function(err){
//         callback(err);
//     })
// }

// function readFileStream(path,callback,req){
//     let index = req.session.index;
//     let readStream = fs.createReadStream(path,{encoding:"ascii",highWaterMark:1,start:index});
//     let array = [];
//     let count = 5;
//     let data ="";
//     readStream.on('data',function(ele){
//         if(ele=='{'){
//             array.push('{');
//             data+=ele;
//         }
//         else if(ele == '}'){
//             data+=ele;
//             array.pop();
//             if(array.length == 0){
//                 count--;
//             }
//             if(count == 0){
//                 readStream.close(function(){
//                    req.session.index += data.length+1;
//                 //    console.log(req.session.index);
//                    display(data,callback);
//                 });
                
//             }
//         }else{
//             data+=ele;
//             // console.log(data.length);
//         }
//     });
//     readStream.on('end',function(){
//         if(count!=0){
//             req.session.index = -1;
//             display(data,callback);
//         }
//     })
// }



// function display(data,callback){
//     if(data[0]!='['){
//         data = '['+data;
//     }
//     if(data[data.length-1]!=']'){
//         data+=']';
//     }
//     data = JSON.parse(data);
//     callback(data);
// }











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








// async function quantityElement(userName,pid){
//     let cart = await db.collection('cart').findOne({'userName':userName});
//     return cart.product[pid].quantity;
// }



function checkProductValues(obj){
    if(obj.title == "" || obj.tag == "" || obj.date == "" || obj.statusProduct == "" || obj.userReviews == "" /*|| price == ""*/ || obj.stock == ""  || obj.about == "" || obj.img == ""){
        return false;
    }else if(obj.userReviews < 0 || obj.stock  < 0){
        alert("Please Enter none negative values");
        return false;
    }else{
        return true;
    }
}