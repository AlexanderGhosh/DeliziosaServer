require('dotenv').config();
const nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USERNAME,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  },
  tls: {
    rejectUnauthorized: false
  }
});

/*var smtpTransport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});*/

function SendAttachment(attachments, subject, recipient, callBack) {
  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: recipient,
    subject: subject,
    attachments: attachments    
  };
  let hasError = false;


  smtpTransport.sendMail(mailOptions, (error, response) => {
    callBack(error, response);
    error ? console.log(error) : console.log(response);
    smtpTransport.close();
  });
  return !hasError;
}

function SendEmail(subject, body, recipient, callBack){
  let mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: recipient,
    subject: subject,
    generateTextFromHTML: true,
    html: `<b>${body}</b>`
  };
  let hasError = false;


  smtpTransport.sendMail(mailOptions, (error, response) => {
    callBack(error, response);
    error ? console.log(error) : console.log(response);
    smtpTransport.close();
  });
  return !hasError;
}

module.exports = {
  SendEmail,
  SendAttachment
};
