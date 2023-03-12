let {findAllWithSkip,findOne,updateOne} = require('./dbFunction');

let collection = 'product';


function getProducts(starting,number,db){
    return findAllWithSkip(db,collection,starting,number,{});
}


function getSingleProduct(pid,db){
    //TODO: Add it In another function remove dependecy on function; 
    console.log(pid);
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


module.exports = {getProducts,getSingleProduct,decreaseOneStock};