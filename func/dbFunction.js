function findAll(db,collection,filter){
    return db.collection(collection).find(filter).toArray();
}

function findOne(db,collection,filter){
    return db.collection(collection).findOne(filter);
}

function insertOne(db,collection,data){
    return db.collection(collection).insertOne(data);
}

function updateOne(db,collection,filter,data){
    return db.collection(collection).updateOne(filter,{$set: data });
}

function findAllWithSkip(db,collection,starting,length,filter){
    return db.collection(collection).find(filter).skip(starting).limit(length).toArray();
}

module.exports = {findAll,findOne,insertOne,updateOne,findAllWithSkip};