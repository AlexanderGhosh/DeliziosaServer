require('dotenv').config();
//const https = require('https');
const express = require('express')
const app = express();
const port = process.env.PORT;

app.get('/', (req, res) => {
  res.send(process.env.TEXT_EG);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
