const time = require('./time');

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
    client.activate('WorkedHours', name);
    const currentPeriod = period(start);
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
                if(duration.invalid) {
                    await callback(false);
                    return;
                }
                // if not then update
                await client.update({ "period": prevPeriod_, "times.endTime": '' }, {
                    $set: {
                        "times.$.endTime": end,
                        "times.$.duration": duration.value
                    }
                }, async (e, _) => {
                    await callback(true);
                });
            });
        }
        // if period exists
        else {
            findStart(currentPeriod, async (start) => {
                const duration = time.durationOutOfRange(start, end);
                if(duration.invalid) {
                    await callback(false);
                    return;
                }
                await client.update({ "period": currentPeriod, "times.endTime": '' }, {
                    $set: {
                        "times.$.endTime": end,
                        "times.$.duration": duration.value
                    }
                }, async (e, _) => {
                    await callback(true);
                });
            });
        }

        async function findStart(period, cb) {
            await client.findOne({ period: period, "times.endTime": '' },
                async (e, res) => {
                    if (!res) {
                        await cb(undefined);
                    }
                    else {
                        await cb(res.times[0].startTime);
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

module.exports = {
    clockIn,
    clockOut,
    addPerson,
    getPeople,
    renamePerson,
    removePerson
};