require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const express = require('express')
const app = express();
const port = process.env.PORT;


const oauth2Client = new OAuth2(
  '357736659089-cf9n4i06f0lc2v9aghi9v2s8655mvi1s.apps.googleusercontent.com',
  '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',
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: '1//04SR9Shq1NzgzCgYIARAAGAQSNwF-L9IrNVBFjPS7Djw9aLBbO77zyGDaemjmuk7t1kjtOlF0OT4JHOLURB4p4A9Ne3hPzwgHCks'
});
const accessToken = oauth2Client.getAccessToken()

const smtpTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "ghoshalexander@gmail.com",
    clientId: "357736659089-cf9n4i06f0lc2v9aghi9v2s8655mvi1s.apps.googleusercontent.com",
    clientSecret: "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",
    refreshToken: "1//04SR9Shq1NzgzCgYIARAAGAQSNwF-L9IrNVBFjPS7Djw9aLBbO77zyGDaemjmuk7t1kjtOlF0OT4JHOLURB4p4A9Ne3hPzwgHCks",
    accessToken: accessToken
  },
  tls: {
    rejectUnauthorized: false
  }
});
let mailOptions = {
  from: "ghoshalexander@gmail.com",
  to: "ptghosh@aol.com, agwdw@outlook.com",
  subject: "Node.js Email with Secure OAuth",
  generateTextFromHTML: true,
  html: "<b>test 2</b>"
};
let counter = 3;
/*smtpTransport.sendMail(mailOptions, (error, response) => {
  error ? console.log(error) : console.log(response);
  smtpTransport.close();
});*/

app.use(express.json());

async function sendEmail(req, res){
  /*let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
     user: 'ghoshalexander@gmail.com',
     pass: 'Backugan001!'
    },
  });

   // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '<ghoshalexander@gmail.com>', // sender address
    to: "ghoshalexander@gmail.com", // list of receivers
    subject: "killer dog", // Subject line
    text: "Soy boy", // plain text body
    html: `<b>${JSON.stringify(req.body)}</b>`, // html body
  });*/
  mailOptions.html = `<b>TEXT not email alex when you get this email please</b>`
  smtpTransport.sendMail(mailOptions, (error, response) => {
    error ? console.log(error) : console.log(response);
    smtpTransport.close();
  });
  res.status(201).send('sent');
};

app.get('/', (req, res) => {
  res.send(process.env.TEXT_EG);
});

app.post('/email', sendEmail);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
