let {findAllWithSkip} = require('./dbFunction');

let collection = 'product';

function getProducts(starting,number,db){
    return findAllWithSkip(db,collection,starting,number,{});
}

module.exports = {getProducts};