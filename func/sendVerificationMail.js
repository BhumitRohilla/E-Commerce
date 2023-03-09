require('dotenv').config();
const mailAPI = require('./mailAPI');
//email,subject,text,html,callback
function sendVerificationMail(user,callback){
    console.log(user);
    const subject = 'Verification'
    const text = 'This is text'
    const html = `<h1>Welcome</h1> <p>Please Varify your mail <a href="http://${process.env.HOSTNAME}:${process.env.PORT}/verify/${user.key}">http://${process.env.HOSTNAME}:${process.env.PORT}/verify/${user.key}</a></p>`;
    mailAPI(user.email,subject,text,html,callback);
    
}

module.exports = sendVerificationMail;