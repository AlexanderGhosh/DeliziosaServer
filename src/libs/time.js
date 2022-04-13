function ukDateToDate(date) {
    let tmp = date[0] + date[1];
    date = editString(date, 0, date[3]);
    date = editString(date, 1, date[4]);

    date = editString(date, 3, tmp[0]);
    date = editString(date, 4, tmp[1]);

    return new Date(date);
}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

function calcSecconds(start, end) {
    let tmp = start[0] + start[1];


    start = editString(start, 0, start[3]);
    start = editString(start, 1, start[4]);

    start = editString(start, 3, tmp[0]);
    start = editString(start, 4, tmp[1]);


    tmp = end[0] + end[1];
    end = editString(end, 0, end[3]);
    end = editString(end, 1, end[4]);

    end = editString(end, 3, tmp[0]);
    end = editString(end, 4, tmp[1]);

    const st = new Date(start);
    const et = new Date(end);

    return parseInt((et - st)/1000);
}

function calcDuration(start, end){
    return seccondsToTime(calcSecconds(start, end));
}

function seccondsToTime(seccons){
    let mins = round5(Math.floor(seccons / 60));
    let hours = Math.floor(mins / 60);
    mins -= hours * 60;

    return `${hours < 10 ? "0" + hours.toString() : hours}:${mins < 10 ? "0" + mins.toString() : mins}`
}

function floor5(x)
{
    return Math.floor(x/5)*5;
}

function editString(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + replacement.length);
}

function dateToString(date) {
    let day = date.getDate().toString();
    if(day.length < 2) {
        day = '0' + day;
    }
    let month = (date.getMonth() + 1).toString();
    if(month.length < 2) {
        month = '0' + month;
    }
    let year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
}

function timeToString(time) {
    let hours = time.getHours().toString();
    let mins = time.getMinutes().toString();
    if(hours.length < 2) {
        hours = '0' + hours;
    }
    if(mins.length < 2) {
        mins = '0' + mins;
    }
    return `${hours}:${mins}`;
}

function addDays(date, days){
    const copy = new Date(Number(date))
    copy.setDate(date.getDate() + days)
    return copy
}

function durationOutOfRange(start, end) {
    console.log(start);
    console.log(end);
    if (!start || !end){
        return true;
    }
    const secconds = calcSecconds(start, end);
    let mins = Math.floor(secconds / 60);
    const hours = Math.floor(mins / 60);
    mins -= hours * 60;
    mins = floor5(mins);

    const endDate = ukDateToDate(end);    
    const endingHour = endDate.getHours();
    return {
        invalid: hours > 11 || endingHour > 1 && endingHour < 7,
        value: `${hours < 10 ? '0' + hours: hours}:${mins < 10 ? '0' + mins: mins}`
    };
}

module.exports = {
    ukDateToDate,
    calcDuration,
    getMonday,
    dateToString,
    addDays,
    durationOutOfRange,
    calcDuration,
    timeToString
};