require('dotenv').config();
const email = require('./libs/email')
const express = require('express')
const app = express();
const port = process.env.PORT;

app.use(express.json());

app.get('/', (req, res) => {
  res.send(process.env.TEXT_EG);
});

app.post('/email', (req, res) => {
  const data = req.body;
  const success = email.SendEmail(data.subject, data.body, data.recipient);
  if(success){
    res.status(201).send("Success");
  }
  else{
    res.status(500).send("Error");
  }
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`)
});
