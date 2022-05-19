const time = require('./time');
const { WorkBook } = require('./excel');
const email = require('./email');

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
                await compileExcell(prevPeriod(start), client);
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
async function clockOut(name, end, comment, client, callback) {
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
                        "times.$.duration": duration.value,
                        "times.$.comment": comment
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
                        "times.$.duration": duration.value,
                        "times.$.comment": comment
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

function sheetTitle(wb) {
    wb.cell(1, 1).string('Date');
    wb.cell(3, 1).string('Start Time');
    wb.cell(4, 1).string('End Time');
    wb.cell(6, 1).string('Duration');
    wb.cell(8, 1).string('Comment');
}

function writeOverview(wb, totals) {
    wb.active('Overview');
    wb.cell(1, 1).string('Name');
    wb.cell(2, 1).string('Total Time');
    let row = 2;
    for (const [key, value] of Object.entries(totals)) {
        const hours = value.hours;
        const mins = value.mins;
        wb.cell(1, row).string(key);
        wb.cell(2, row).string(
            `${hours < 10 ? '0' + hours : hours}:${mins < 10 ? '0' + mins : mins}`);

        row += 1;
    }
}

async function compileExcell(period, client) {
    let period_name = period.replace('/', ',').replace('/', ',');
    return await getPeople(client).then((people) => {
        let wb = new WorkBook();
        wb.sheet('Overview');
        let totals = {};
        people.forEach(name => {
            client.activate('WorkedHours', name);
            client.findOne({ period: period }, (_, res) => {
                if (!res) {
                    return;
                }
                let row = 2;
                for (let i in res.times) {
                    let t = res.times[i];
                    if (t.endTime == '') {
                        continue;
                    }
                    if (row == 2) {
                        wb.sheet(name);
                        totals[name] = {
                            hours: 0,
                            mins: 0
                        };
                    }
                    totals[name].hours += parseInt(t.duration.substring(0, 2));
                    totals[name].mins += parseInt(t.duration.substring(3));
                    const mins = totals[name].mins;
                    totals[name].hours += Math.floor(mins / 60);
                    totals[name].mins = Math.floor(mins % 60);
                    let start = time.ukDateToDate(t.startTime);
                    let end = time.ukDateToDate(t.endTime);
                    sheetTitle(wb);
                    let r = time.dateToString(start);
                    wb.cell(1, row).string(r);
                    wb.cell(3, row).string(time.timeToString(start));
                    wb.cell(4, row).string(time.timeToString(end));
                    wb.cell(6, row).string(t.duration);
                    wb.cell(8, row).string(t.comment || '');
                    row += 1;
                }
                writeOverview(wb, totals);
                wb.save(`${period_name} Deli Doc`);
            });
        });

        /*let success = email.SendAttachment([{
            filename: `${period_name} Deli Doc`,
            path: `${period_name} Deli Doc.xlsx`
        }],
            `Deli Work times ${period_name}`, 'philippa@straightforwardyorkshire.co.uk', (e, _) => {
                if (e) {
                    console.log('error');
                    res.status(500).send("Error");
                }
                else {
                    console.log('succ');
                    res.status(201).send("Success");
                }
            });*/
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
    compileExcell,
    prevPeriod
};