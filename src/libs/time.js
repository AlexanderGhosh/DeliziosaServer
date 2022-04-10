function calcDuration(start, end) {
    console.log(start);
    let tmp = start[0] + start[1];

    console.log(tmp);

    start = editString(start, 0, start[3]);
    start = editString(start, 1, start[4]);

    start = editString(start, 3, tmp[0]);
    start = editString(start, 4, tmp[1]);

    console.log(start);

    tmp = end[0] + end[1];
    end = editString(end, 0, end[3]);
    end = editString(end, 1, end[4]);

    end = editString(end, 3, tmp[0]);
    end = editString(end, 4, tmp[1]);

    const st = new Date(start);
    const et = new Date(end);

    return seccondsToTime(parseInt((et - st)/1000));
}

function seccondsToTime(seccons){
    let mins = round5(Math.floor(seccons / 60));
    let hours = Math.floor(mins / 60);
    mins -= hours * 60;

    return `${hours < 10 ? "0" + hours.toString() : hours}:${mins < 10 ? "0" + mins.toString() : mins}`
}

function round5(x)
{
    return Math.round(x/5)*5;
}

function editString(str, index, replacement) {
    return str.substring(0, index) + replacement + str.substring(index + replacement.length);
}

module.exports = {
    calcDuration
};