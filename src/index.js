require('dotenv').config();
const email = require('./libs/email');
const mongo = require('./libs/mongo');
const time = require('./libs/time');
const clocking = require('./libs/clocking');
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
  _ = email.SendEmail(data.subject, data.body, data.recipient, (e, response) => {
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
  client.activate('ClickAndCollect', 'Meat');
  res.status(201).json(await client.findAll())
});
app.get('/c_c/cheese', async (_, res) => {
  client.activate('ClickAndCollect', 'Cheese');
  res.status(201).json(await client.findAll())
});

app.post('/clockIn', async (req, res) => {
  const data = req.body;
  await clocking.clockIn(data.name, data.startTime, client);
  res.status(201).send('Clocked in');
});

app.post('/clockOut', async (req, res) => {
  const data = req.body;

  await clocking.clockOut(data.name, data.endTime, data.comment, client,
    async (success, start) => {
      if (success) {
        res.status(201).send('Success');
      }
      else {
        res.status(400).send(`End Time Out of Range,${start}`);
      }
    }
  );
});

app.post('/addComment', async (req, res) => {
  const data = req.body;
  await clocking.addComment(data.name, data.startTime, data.comment, client);
  res.status(201).send('Success');
});

app.get('/getNames', async (_, res) => {
  res.status(201).send(await clocking.getPeople(client));
});

app.post('/addName', async (req, res) => {
  const data = req.body;
  await clocking.addPerson(data.name, client);
  res.status(201).send('Added name');
});

app.post('/removeName', async (req, res) => {
  const data = req.body;
  await clocking.removePerson(data.name, client);
  res.status(201).send('Deleted name');
});

app.post('/renameName', async (req, res) => {
  const data = req.body;
  await clocking.renamePerson(data.oldName, data.newName, client);
  res.status(201).send('Renamed');
});

app.post('/clockedIn', async (req, res) => {
  const data = req.body;
  console.log(data);
  await clocking.hasClockedIn(data.name, data.today, client,
    async (succes) => {
      if (succes) {
        res.status(201).send(true);
      }
      else {
        res.status(404).send(false);
      }
    });
});

app.post('/peakTimes', async (req, res) => {
  const data = req.body;
  let pp = clocking.prevPeriod(data.today);

  client.activate('WorkedHours', 'Info');
  await client.findOne({ currentPeriod: { $ne: '' } }, async (_, r) => {
    await clocking.compileExcell(pp, client).then((a, b) => {
      res.status(201).send("Good");
    });
  });
});

app.post('/sendDoc', async (req, res) => {
  const data = req.body;
  let pp = clocking.prevPeriod(data.today);
  let period_name = pp.replace('/', ',').replace('/', ',');

  email.SendAttachment([{
    filename: `${period_name} Deli Doc.xlsx`,
    path: `${period_name} Deli Doc.xlsx`
  }],//ghoshalexander@gmail.com - ptghosh@aol.com
    `Deli Work times ${period_name}`, 'philippa@straightforwardyorkshire.co.uk', (e, _) => {
      if (e) {
        console.log('error');
        res.status(500).send(e);
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