require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

/*oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const accessToken = oauth2Client.getAccessToken()*/

const smtpTransport = nodemailer.createTransport({
  service: "gmail",

    auth: {
      user: process.env.EMAIL_USERNAME, // generated ethereal user
      pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  /*auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USERNAME,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN
  },*/
  tls: {
    rejectUnauthorized: false
  }
});

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
  SendEmail
};
