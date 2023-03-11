async function checkUser(user,db){
    return db.collection('users').find(user).toArray()
    .then(function(data){
        return data;
    })
    .catch(function(err){
        throw err;
    })
}

async function getUser(user,db){
    return db.collection('users').findOne(user)
   .then(function(data){
        return data;
   })
   .catch(function(err){
        throw err;
   })
}

async function insertUser(user,db){
    let userName = user.userName;
    let email = user.email;
    let oldUser = {userName,email}
    
    oldUser = await getUser(oldUser,db);
    if(oldUser != null){
        throw 401;
    }

    return db.collection('users').insertOne(user)
    .then(function(){
        return 200;
    })
    .catch(function(){
        return 404;
    })
}


async function updateUser(filter,output,db){
    return db.collection('users').updateOne(filter,{$set:output})
    .then(function(data){
        return data;
    })
    .catch(function(err){
        console.log(err)
    })
}

module.exports = {checkUser,getUser,insertUser,updateUser};