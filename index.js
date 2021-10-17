require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express')
const app = express();
const port = process.env.PORT;

app.use(express.json());

async function sendEmail(req, res){
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
     user: process.env.EMAIL_USERNAME, // generated ethereal user
     pass: process.env.EMAIL_PASSWORD, // generated ethereal password
    },
  });

   // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '<ghoshalexander@gmail.com>', // sender address
    to: "ghoshalexander@gmail.com", // list of receivers
    subject: "sheesh", // Subject line
    text: "Soy boy", // plain text body
    html: `<b>${JSON.stringify(req.body)}</b>`, // html body
  });
  res.send('sent');
};

app.get('/', (req, res) => {
  res.send(process.env.TEXT_EG);
});

app.post('/email', sendEmail);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
