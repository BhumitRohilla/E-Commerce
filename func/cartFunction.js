let {findOne, insertOne, updateOne, removePropertyFromAll} = require('./dbFunction');

let {increaseOneStock,getAllProduct} = require('./productFunc');

let collection = 'cart';


async function getQuantity(pid,userName,db){
    let data ;
    try{
        // data = await findOne(db,collection,{userName});
        data = await getUserCart(userName,db);
        console.log(data);
    }
    catch(err){
        throw err;
    }
    let quantity;
    if(data == null){
        quantity = 0;
    }else{
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


async function addToCart(pid, userName,db){
    let userCart;
    try{
        userCart = await getUserCart(userName,db);
    }
    catch(err){
        throw err;
    }
    try{
        userCart.product[pid].quantity++;
    }
    catch(err){
        let userExist = true;
        if(userCart == null){
            userCart = {
                userName,
                product : {}
            }
            userExist = false;
        }
        userCart.product[pid] = {};
        userCart.product[pid].quantity = 1;
        if(!userExist){
            insertOne(db,collection,userCart);
            return ;
        }
    }
    updateOne(db,collection,{userName},{"product":userCart.product})
}


function getUserCart( userName, db ){
    return findOne(db,collection,{userName});
}


async function removeFromCart(pid, userName,db){
    let quantity ;
    try{
        quantity = await getQuantity(pid,userName,db);
        if(quantity > 0){
            quantity--;
            let productToUpdate = "product." + pid;
            updateOne(db,collection,{userName},{ [productToUpdate] : {"quantity":quantity}});
        }
        await increaseOneStock(pid,db);
    }
    catch(err){
        console.log(err);
        throw err;
    }

        // updateOne(db,collection,{userName},{"product":userCart.product});
        // let data = await getSingleProduct(pid,db);
        // // let data = await db.collection('product').findOne({'id':pid});
        // data.stock++;
        // updateOne(db,collection,{'id':pid},{"stock":data.stock});
        // // db.collection('product').updateOne({'id':pid},{$set:{"stock":data.stock}});
}

async function getUserCart(userName,db){
    return findOne(db,collection,{userName});
    // * return db.collection('cart').findOne({"userName":userName});
}

async function getUserCartItem(cart,db){
    //TODO: ERROR HANDLING
    let allItems
    try{
        allItems = await getAllProduct(db);
    }
    catch(err){
        throw err;
    }
    let obj = {};
    if(cart != null){
        for(key in cart.product){
            obj[key] = allItems[key];
            if(obj[key]==undefined){
                //TODO: Remove Dependency from this code
                try{
                    await deleteProductFromCartWhichAreDeletedByAdmin(db,key);
                    // db.collection('cart').updateMany({},{ $unset: {[propertyToDelete]:1}});
                }
                catch(err){
                    console.log(err);
                }
                delete obj[key];
            }else{
                obj[key].quantity = cart.product[key].quantity;
            }
        }
    }
    return obj;
}

function deleteProductFromCartWhichAreDeletedByAdmin(db,key){
    let propertyToDelete = "product."+key;
    removePropertyFromAll(db,collection,{},{[propertyToDelete]:1});
}

module.exports = {getQuantity,addToCart,removeFromCart,getUserCart,getUserCartItem};