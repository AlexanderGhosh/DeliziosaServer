const time = require('./time');
const { WorkBook } = require('./excel');

const ORIGINAL_DATE = new Date(2021, 6, 28);

// returns the pay period the date resides in
function period(date) {
    date = time.ukDateToDate(date);
    date = time.getMonday(date);
    let days = date - ORIGINAL_DATE;
    days /= 1000 * 3600 * 24;
    days = Math.floor(days);
    let weeks = days / 7;
    let fortnights = Math.floor(weeks) % 2;

    if (fortnights == 0) {
        return time.dateToString(time.addDays(date, -7));
    }
    return time.dateToString(date);
}

function prevPeriod(date) {
    date = period(date);
    date = time.ukDateToDate(date);
    date = time.addDays(date, -14);
    return time.dateToString(date);
}

// working in that it adds the the correct person and the correct pay period
async function clockIn(name, start, client) {
    client.activate('WorkedHours', 'Info');
    const currentPeriod = period(start);
    await client.findOne({ currentPeriod: currentPeriod },
        async (_, res) => {
            // the current pay period is behind
            if (!res) {
                await client.update({}, { $set: { currentPeriod: currentPeriod } }, cIn);
                // create and send excell document
                compileExcell(prevPeriod(start));
            }
            // is not behind so add clock in as normal
            else {
                await cIn();
            }
        })

    async function cIn(_, _) {
        client.activate('WorkedHours', name);
        await client.findOne({ period: currentPeriod }, async (_, res) => {
            if (!res) {
                await client.insert({
                    period: currentPeriod,
                    times: [
                        {
                            startTime: start,
                            endTime: ''
                        }
                    ]
                });
            }
            else {
                await client.update({ period: currentPeriod }, {
                    $push: {
                        times: {
                            startTime: start,
                            endTime: ''
                        }
                    }
                });
            }
        });
    };
}

// working such that add the the correct pay period or the prev is not found
// does duration checking
async function clockOut(name, end, client, callback) {
    client.activate('WorkedHours', name);
    const currentPeriod = period(end);

    // will find and entry in the current periood that doesnt have an end time
    await client.findOne({ period: currentPeriod, }, async (_, res) => {
        // if period doesnt exist
        if (!res) {
            // then look in prev period
            const prevPeriod_ = prevPeriod(end);
            findStart(prevPeriod_, async (start) => {
                // once start found check if out of range
                // if out of range then send status code 400
                const duration = time.durationOutOfRange(start, end);
                if (duration.invalid) {
                    await callback(false, start);
                    return;
                }
                // if not then update
                await client.update({ "period": prevPeriod_, "times.endTime": '' }, {
                    $set: {
                        "times.$.endTime": end,
                        "times.$.duration": duration.value
                    }
                }, async (e, _) => {
                    await callback(true, start);
                });
            });
        }
        // if period exists
        else {
            findStart(currentPeriod, async (start) => {
                const duration = time.durationOutOfRange(start, end);
                if (duration.invalid) {
                    await callback(false, start);
                    return;
                }
                await client.update({ "period": currentPeriod, "times.endTime": '' }, {
                    $set: {
                        "times.$.endTime": end,
                        "times.$.duration": duration.value
                    }
                }, async (e, _) => {
                    await callback(true, start);
                });
            });
        }

        async function findStart(period, cb) {
            await client.findOne({
                period: period,
                times: {
                    $elemMatch: {
                        endTime: ''
                    }
                }
            },
                async (_, res) => {
                    console.log(res);
                    if (!res) {
                        await cb(undefined);
                    }
                    else {
                        for (var i in res.times) {
                            var time_ = res.times[i];
                            console.log(`fd:${time_}`);
                            if (time_.endTime == '') {
                                await cb(time_.startTime);
                                return;
                            }
                        }
                        await cb(undefined);
                    }
                });
        }
    });
}

// working
async function addPerson(name, client) {
    client.activate('WorkedHours', 'Info');
    await client.update({}, { $push: { names: name } });
}

// working
async function renamePerson(orig, nxt, client) {
    client.activate('WorkedHours', 'Info');
    client.update({ names: orig }, { $set: { "names.$": nxt } });
    client.activate('WorkedHours', orig);
    client.activeCollection.rename(nxt);
}

// working
async function removePerson(name, client) {
    client.activate('WorkedHours', 'Info');
    client.update({ names: name }, { $pull: { "names": name } });
}

// working
async function getPeople(client) {
    client.activate('WorkedHours', 'Info');
    return (await client.findAll())[0].names;
}

// working
async function hasClockedIn(name, today, client, callback) {
    client.activate('WorkedHours', name);
    const currentPeriod = period(today);
    client.findOne({ period: currentPeriod, "times.endTime": '' },
        async (e, res) => {
            // no entry found 
            // the check prev period
            if (e || !res) {
                await client.findOne({ period: prevPeriod(today), "times.endTime": '' },
                    async (e, res) => {
                        callback(!e && res);
                    });
            }
            // found it
            else {
                callback(true);
            }
        }
    );
}

async function addComment(name, start, comment, client) {
    client.activate('WorkedHours', name);
    await client.update({ "times.startTime": start },
        { $set: { "times.$.comment": comment } });
}

/**let wb = new WorkBook();
  wb.sheet('main test 1');
  wb.sheet('sheet 2');
  wb.active('main test 1');
  wb.cell(1, 1).string('hello alex');
  wb.cell(2, 2).number(1001);
  wb.active('sheet 2');
  wb.cell(3, 3).date(new Date());

  wb.save('test 1');

  _ = email.SendAttachment([{ filename: 'test 1.xlsx', path: './test 1.xlsx' }], 'server test excel', 'ghoshalexander@gmail.com', (e, response) => {
    if (e) {
      console.log('error');
      res.status(500).send("Error");
    }
    else {
      console.log('succ');
      res.status(201).send("Success");
    }
  }); */

function sheetTitle(wb) {
    wb.cell(1, 1).string('Date');
    wb.cell(1, 3).string('Start Time');
    wb.cell(1, 4).string('End Time');
    wb.cell(1, 6).string('Duration');
    wb.cell(1, 8).string('Comment');
}

async function compileExcell(period, client) {
    let wb = new WorkBook();
    let totals = {};
    await getPeople(client).then((people) => {
        console.log(people);
        people.forEach(async name => {
            wb.sheet(name);
            totals[name] = {
                hours: 0,
                mins: 0
            };
            client.activate('WorkedHours', name);
            await client.findOne({ period: period }, async (_, res) => {
                if (!res) {
                    return;
                }
                let row = 2;
                for(let i in res.times){
                    let t = res.times[i];
                    console.log(t);
                    totals[name].hours += parseInt(t.duration.substring(0, 2));
                    totals[name].mins += parseInt(t.duration.substring(2));
                    let start = new Date(t.startTime);
                    let end = new Date(t.endTime);
                    sheetTitle(wb);
                    wb.cell(row, 1).string(time.dateToString(start));
                    wb.cell(row, 3).string(time.timeToString(start));
                    wb.cell(row, 4).string(time.timeToString(end));
                    wb.cell(row, 6).string(t.duration);
                    wb.cell(row, 8).string(t.comment || '');
                    row += 1;
                    wb.save('test1');
                }
            });
        });
    });
    
}

module.exports = {
    clockIn,
    clockOut,
    addPerson,
    getPeople,
    renamePerson,
    removePerson,
    hasClockedIn,
    addComment,
    compileExcell
};