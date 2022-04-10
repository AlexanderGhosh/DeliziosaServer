require('dotenv').config();
const email = require('./libs/email');
const mongo = require('./libs/mongo');
const { WorkBook } = require('./libs/excel');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT;
let client = new mongo.MongoConection();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send("This isnt a real page");
});

app.post('/wake-up', (req, res) => {
  res.status(201).send("woken up");
}); 

app.post('/email', (req, res) => {
  const data = req.body;
  console.log(data);
  let success = email.SendEmail(data.subject, data.body, data.recipient, (e, response) => {
    if (e) {
      console.log('error');
      res.status(500).send("Error");
    }
    else {
      console.log('succ');
      res.status(201).send("Success");
    }
  });
});

app.get('/c_c/meat', async (_, res) => {
  client.collection('Meat');
  res.status(201).json(await client.findAll())
});
app.get('/c_c/cheese', async (_, res) => {
  client.collection('Cheese');
  res.status(201).json(await client.findAll())
});

app.get('/test', (_, res) => {
  let wb = new WorkBook();
  wb.sheet('main test 1');
  wb.sheet('sheet 2');
  wb.active('main test 1');
  wb.cell(1, 1).string('hello alex');
  wb.cell(2, 2).number(1001);
  wb.active('sheet 2');
  wb.cell(3, 3).date(new Date());

  wb.save('test 1');

  _ = email.SendAttachment([{filename:'test 1.xlsx', path: './test 1.xlsx'}], 'server test excel', 'ghoshalexander@gmail.com', (e, response) => {
    if (e) {
      console.log('error');
      res.status(500).send("Error");
    }
    else {
      console.log('succ');
      res.status(201).send("Success");
    }
  });

});

app.listen(port, () => {
  client.database('ClickAndCollect');
  console.log(`API listening on Port:${port}`);
});

function exitHandler(options, exitCode) {
  if (options.cleanup && client) {
    client.close();
  }

  if (exitCode) {
    console.log(exitCode);
  }
  process.exit();
}


//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));