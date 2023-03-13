const dbFunc = require('./dbFunction');


const collection = 'users';

// ! Depricated:-
async function checkUser(user,db){
    return dbFunc.findAll(db,collection,user)
}


async function getUser(user,db){
    return dbFunc.findOne(db,collection,user)
}


async function insertUser(user,db){
    let userName = user.userName;
    let email = user.email;
    let oldUser = {userName,email}
    
    oldUser = await getUser(oldUser,db);
    if(oldUser != null){
        throw 401;
    }

    return dbFunc.insertOne(db,collection,user)
    .then(function(){
        return 200;
    })
    .catch(function(){
        return 404;
    })
}


function updateUser(filter,output,db){
    return dbFunc.updateOne(db,collection,filter,output)
}



module.exports = {checkUser,getUser,insertUser,updateUser};