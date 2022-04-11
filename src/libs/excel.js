const xl = require('excel4node');

class WorkBook {
    constructor() {
        this.book = new xl.Workbook();
        this.sheets = {};
        this.style = {
            dateFormat: 'd/m/yy'
        };
        this.activeSheet = '';
    }
    sheet(name) {
        this.activeSheet = name;
        this.sheets[name] = this.book.addWorksheet(name);
    } 
    cell(letter, number) {
        return this.sheets[this.activeSheet].cell(number, letter).
            style(this.style);
    }
    active(name) {
        this.activeSheet = name;
    }
    save(name) {
        this.book.write(`${name}.xlsx`)
        console.log('saving');
    }
}

module.exports = {
    WorkBook
};