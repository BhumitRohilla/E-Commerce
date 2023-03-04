const mailAPI = require('./mailAPI');
//email,subject,text,html,callback
function sendVerificationMail(user,callback){
    console.log(user);
    const subject = 'Verification'
    const text = 'This is text'
    const html = `<h1>Welcome</h1> <p>Please Varify your mail <a href="http://127.0.0.1:3000/verify/${user.key}">click hear</a></p>`;
    mailAPI(user.email,subject,text,html,callback);
    
}

module.exports = sendVerificationMail;