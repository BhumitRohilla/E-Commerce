require('dotenv').config();
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = function(email,subject,text,html,callback){
    const msg = {
        to: email, // Change to your recipient
        from: 'bhumit73rohilla@gmail.com', // Change to your verified sender
        subject: subject,
        text: text,
        html: html,
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log(msg)
          callback();
        })
        .catch((error) => {
          console.error(error)
        })
}
