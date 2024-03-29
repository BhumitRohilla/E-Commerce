let {findAllWithSkip,findOne,updateOne,findAll, insertOne,deleteOne} = require('./dbFunction');

let collection = 'product';


function getProducts(starting,number,db){
    return findAllWithSkip(db,collection,starting,number,{});
}


function getSingleProduct(pid,db){
    return findOne(db,collection,{"id":pid});
    // let element = await db.collection('product').findOne({"id":pid});
    // let stock = element.stock;
    // if(stock == 0){
    //     return 0;
    // }else{
    //     try{
    //         await db.collection('product').updateOne({"id":pid},{$set:{"stock":(stock-1)}});
    //     }
    //     catch(err){
    //         console.log(err);
    //     }
    //     return stock;
    // }
}


async function increaseOneStock(pid,db){
    let product;
    let stock;
    try{
        // * db.collection('product').findOne({"id":pid});
        product = await findOne(db,collection,{"id":pid});
        stock = product.stock;
        stock++;
        await updateOne(db,collection,{"id":pid},{"stock":stock});
    }
    catch(err){
        throw err;
    }
}

async function decreaseOneStock(pid,db){
    let product;
    let stock;
    try{
        product = await getSingleProduct(pid,db);
        stock = product.stock;
    }
    catch(err){
        throw err;
    }
    try{
        await updateOne(db,collection,{"id":pid},{"stock": stock -1 });
    }
    catch(err){
        throw err;
    }
}

async function getAllProduct(db){
    let data;
    try{
        data = await findAll(db,collection,{});
    }
    catch(err){
        throw err;
    }
    // * let data = await db.collection('product').find().toArray();
    let obj ={};
    data =  data.forEach((element)=>{
        obj[element.id] = element;
    })
    return obj;
}


async function addProduct(obj,db){
    //TODO: Remove This Dependency;
    let finalObj = {}
    finalObj.id = obj.id
    finalObj.title = obj.title;
    let tagArray = obj.tags.split(' ');
    finalObj.date = obj.date;
    finalObj.tag = tagArray;
    finalObj.status = obj.status;
    finalObj.userReviews = obj.userReviews;
    finalObj.img = obj.imgSrc;
    finalObj.stock = obj.stock;
    finalObj['about-game'] = obj.about;
    return insertOne(db,collection,finalObj);
    // * return await db.collection('product').insertOne(finalObj);
}

function updateProduct(pid,data,db){
    // db.collection().
    return updateOne(db,collection,{"id":pid},data);
}

function deleteSingleProduct(pid,db){
    return deleteOne(db,collection,{"id":pid});
}

module.exports = {getProducts,getSingleProduct,decreaseOneStock,increaseOneStock,getAllProduct,addProduct,updateProduct,deleteSingleProduct};