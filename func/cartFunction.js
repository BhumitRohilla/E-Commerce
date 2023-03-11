let {findOne, insertOne, updateOne} = require('./dbFunction');

let collection = 'cart';


async function getQuantity(pid,userName,db){
    let data ;
    try{
        data = await findOne(db,collection,{userName});
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
        userCart = await findOne(db,collection,{userName});
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



module.exports = {getQuantity,addToCart};