const mailAPI = require('./mailAPI');
//email,subject,text,html,callback
function sendMail(user,subject,text,html,callback){
    console.log(user);
    mailAPI(user.email,subject,text,html,callback);
    
}

module.exports = sendMail;