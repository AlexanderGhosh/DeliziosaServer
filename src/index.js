require('dotenv').config();
const email = require('./libs/email');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send(process.env.TEXT_EG);
});

app.post('/email', async (req, res) => {
  const data = req.body;
  console.log(data);
  let success = email.SendEmail(data.subject, data.body, data.recipient, (e, response) => {
    if(e){
      console.log('error');
      res.status(500).send("Error");
    }
    else{
      console.log('succ');
      res.status(201).send("Success");
    }
  });
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`)
});
