/* global MailApp, Logger, SpreadsheetApp */
/**
 * edit url: https://script.google.com/a/7lfreight.com/macros/d/1uu5EQR_qk5V2z5HE4Y6i4CNIQTgoAzLq3R8FQylXeclJ0xydjs5sWyQp/edit?uiv=2&mid=ACjPJvFiZx666szJ1MBS-foW6jD4SolDguSaE1PRBFC6vzS95T2MgcYuIuwxwoczjwEbBg4Nln_O6X9VZ7YGVXlvIdOZ4rsnjI3JqYihf2LeC1sCNVeCO_vjKlbfokVGM1ynegQ2nA-hN1o&splash=yes
 * spreadsheet url: https://docs.google.com/spreadsheets/d/1qpMUC3n1g0Dh4rSofSAgQ9u6w06eo0vs3Kzt6GmW_L8/edit#gid=109888299
 * @type type
 */

//IDENTIFIER HAS TO BE A SUBSTRING OF THE USERS NAME.
var users = {
    //really should look up the row.
    'Hazzard': {email: 'michael@7lfreight.com', daily: true, weekly: true},
    'hazzard': {email: 'miramardesign@gmail.com', daily: true, weekly: true}, //send to phone :)
    'abaroa': {email: 'jabaroa@shipprimus.com', daily: true, weekly: true},
    'Laura': {email: 'laura@7lfreight.com',  daily: true, weekly: true},
    'alfonso': {email: 'alfonso@7lfreight.com', daily: true, weekly: true}
};

//wrap console into logger for testing, to see: view->logs

if (!console) {
    var console = {
        log: function (msg) {
            Logger.log(msg);
        },
        dir: function (obj) {
            console.log(JSON.stringify(obj));
        },
        /**
         * a nifty line separator for the  console.
         * @param {type} char
         * @returns {undefined}
         */
        line: function (char) {
            var line = '====================================================';
            if (char) {
                var re = new RegExp(char, "g");
                line = line.replace(re, "regex");
            }
            console.log(line);
        }
    };
}
var today = new Date();
var utils = {
    /**
     * gets data like in sheet dd/mm 
     * @param {type} today
     * @returns {String}
     */
    getTodaysDateDdMM: function (today) {

        var dd = today.getDate().toString();
        if (dd.length < 2) {
            dd = '0' + dd;
        }
        //is zero based. 
        var mm = (today.getMonth() + 1).toString();
        if (mm.length < 2) {
            mm = '0' + mm;
        }
        var ddmm = dd + '/' + mm;
        console.log('ddmm' + ddmm);
        return ddmm;
    },
    //https://developers.google.com/apps-script/reference/spreadsheet/sheet#getrangerow-column
    //getRange(row, column) 
    //getRange(row, column, numRows, numColumns) 


    /**
     * gets the sheet and the colNum of todays date
     * @param {type} dateRow
     * @param {type} today
     * @returns {utils.getTodaysColNum.dateCol}
     */
    getTodaysSheetColNum: function (dateRow, today) {
        var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

        var todaysDate = utils.getTodaysDateDdMM(today);
        var startRow = dateRow;
        var numRows = 2;   // Number of rows to process

        var startCol = 3; //monday here
        var numCols = 5; //until thursday, now friday for comparing w todays date?

        for (var i = 0; i < sheets.length; i++) {
            var sheet = sheets[i];
            console.log('sheeet name ' + sheet.getName());

            var dataRange = sheet.getRange(startRow, startCol, numRows, numCols);

            var data = dataRange.getValues();
            for (var n in data[0]) {

                var date = data[0][n];  // First row in each column
                console.log('date' + date + '~ todaysDate' + todaysDate + '~');
                if (date === todaysDate) {
                    var dateCol = parseInt(n) + parseInt(startCol);
                    console.log(date + 'date of today, col ' + dateCol);
                    return {
                        sheet: sheet,
                        dateCol: dateCol

                    };

                }

            }


        }

        throw 'couldnt find sheets date' + todaysDate;
    },
    /**
     * todo: when they dont choose V,G or T, the everyday choices at bottom
     * @param {type} curLet
     * @param {object} sheet object
     * @returns {String}
     */
    getEveryDayPlateName: function (curLet, sheet) {

        return curLet + 'commented this call and called inline.';

        // return utils.getPlateName(curLet, dayOfWeek, sheet);
    },
    /**
     * loop down platename columns and look up the plates name by looking at the plate
     * name corresponding to the letter AFTER the day of week.
     * @param {type} curLet
     * @param {type} dayOfWeek
     * @param {object} sheet
     * @returns {string} name of plate in spanish, in the cell
     */
    getPlateName: function (curLet, dayOfWeek, sheet) {

        //TODO first go thrue the always letters and return early, no need to futz w/ day of week
        //add to n
        var letAdd = ['V', 'G', 'T'];

        var plateGuideStartRow = 1;  //find Lunes
        var plateGuideStartCol = 10;
        var numRows = 34;

        var isEveryDayPlate = letAdd.indexOf(curLet) < 0;
        if (isEveryDayPlate) {
            console.log('menuse basicos');
            plateGuideStartRow = 26;
            letAdd = ['PM', 'PC', 'C', 'E', 'S'];
            //return utils.getEveryDayPlateName(curLet, sheet);
            dayOfWeek = 'Menús Básicos Diarios:';

        }

        var guideRange = sheet.getRange(plateGuideStartRow, plateGuideStartCol, numRows);

        var guideRangeValues = guideRange.getValues();

        var rowMatchNum = utils.getRowNumWithValue(guideRangeValues, dayOfWeek, plateGuideStartRow);
        var rowNumPlusLet = parseInt(rowMatchNum) + (letAdd.indexOf(curLet) );

        console.line();
        console.log('rowMatchNum: ' + rowMatchNum + ' rowNumPlusLet: ' + rowNumPlusLet);
        console.dir({guideRangeValues: guideRangeValues});
        console.line();

        return guideRangeValues[rowNumPlusLet][0];
    },
    /**
     * translate today to day of week for matching. dont for get accents!: Miércoles
     * @param {type} today
     * @returns {String}
     */
    getDayOfWeekEs: function (today) {
        var dayI = today.getDay();
        var daysOfWeekEs = [
            'Domingo',
            'Lunes',
            'Martes',
            'Miércoles',
            'Jueves',
            'Viernes',
            'Sábado'
        ];
        return daysOfWeekEs[dayI];
    },
    /**
     * row where dates are
     * @type Number
     */
    dateRow: 4,
    /**
     * sends the actual email after getting their lunch info.
     * @param {type} myRow
     * @param {type} email
     * @returns {undefined}
     */
    sendDailyEmailForUserAtRow: function (myRow, email) {

        var dateRow = utils.dateRow;
        console.log('today' + today);

        //var todaysDateColNum = utils.getTodaysColNum(dateRow, today);
        var sheetColObj = utils.getTodaysSheetColNum(dateRow, today);

        var todaysDateColNum = sheetColObj.dateCol;
        var sheet = sheetColObj.sheet;

        console.log('myRow' + myRow + ' todaysDateColNum:' + todaysDateColNum);
        var myChoiceRange = sheet.getRange(myRow, todaysDateColNum);

        var myChoiceValues = myChoiceRange.getValues();

        var curLet = myChoiceValues[0][0];

        console.log('curLet: ' + curLet);

        var dayOfWeek = utils.getDayOfWeekEs(today);

        var myPlateName = utils.getPlateName(curLet, dayOfWeek, sheet);

        var subject = ' Today I choose to eat ' + myPlateName;
        var message = subject + '<br>Regards,<br>Your lunch buddy. :)';
        MailApp.sendEmail(email, subject, message);
    },
    /**
     * search thru rows and cols for a value and return its row num.
     * @param {type} rangeValues the range passed in.
     * @param {string} needle the thing to search for
     * @param {number} rowStart the starting index to add so you get an absolute count
     * @param {string} searchType either 'contains' or defaults to 'equal' OPTIONAL
     * if contains returns the first row num containing the needle
     * @returns {unresolved}
     */
    getRowNumWithValue: function (rangeValues, needle, rowStart, searchType) {
        console.log('getRowwithValue called with needle: ' + needle);
        for (var row in rangeValues) {
            for (var col in rangeValues[row]) {
                var val = rangeValues[row][col];
                console.log('val: ' + val + ' needle:' + needle);

                if (searchType === 'contains') {
                    var containsNeedle = val.toLowerCase().indexOf(needle.toLowerCase()) > -1;
                    if (containsNeedle) {
                        console.log('CONTAINS FOUND---------------val: ' + val + ' needle:' + needle);
                        return parseInt(row) + rowStart;
                    }
                } else {
                    if (val === needle) {
                        console.log('equals FOUND---------------val: ' + val + ' needle:' + needle);
                        return parseInt(row) + rowStart;
                    }
                }
            }
        }

        throw 'couldnt find row num with needle: ' + needle + ' search type ' + searchType;
    },
    /**
     * pass in the name and get the rownum.
     * @param {type} name
     * @returns {number} the row number corresponding to the  name passed in.
     */
    getUserRowNum: function (name) {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheets()[0];

        var nameRowStart = 5;
        var nameColStart = 2;
        var numRows = 12;

        var nameRange = sheet.getRange(nameRowStart, nameColStart, numRows);
        var nameRangeValues = nameRange.getValues();
        console.dir({nameRangeValues: nameRangeValues});
        var userRowNum = utils.getRowNumWithValue(nameRangeValues, name, nameRowStart, 'contains');
        return userRowNum;
    },
    /**
     * loops thru the sheets looking for todays date and returning the next 
     * or first if loop around
     * @param {type} today s date object
     * @param {type} sheets list of sheets
     * @returns {object} the sheet object
     *
     */
    getNextSheet: function (today, sheets) {
        for (var i = 0; i < sheets.length; i++) {
            var sheet = sheets[i];

            console.log('sheet name' + sheet.getName());
            var todaysCol = utils.getTodaysColNum(sheet, utils.dateRow, today);
            if (todaysCol !== null) {
                if (i === sheets.length) {
                    return sheets[ 0 ];
                }
                var sheetI = parseInt(i) + 1;
                console.log('i +1 ' + sheetI);
                return sheet[ sheetI ];
            }

            console.log('todaysCol' + todaysCol);

        }

    },
    /**
     * in PROGRESS, lookup if they haven't filled out next week and remind email them.
     * @param {type} userObj
     * @returns {undefined}
     */
    remindEmptyNextWeek: function (userObj) {
        var sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();

        var nextSheet = utils.getNextSheet(today, sheets);
        var nextSheetName = nextSheet.getName();
        console.log('nextSheetName' + nextSheetName);
    }
};


function sendDailyMeal() {

    //console.log(sheet.getName()); //todo loop thru sheets

    //triggers:
    //todo 1)  if not filled in, weekly send reminder

    //2) send email w/ daily lookup at 11 am

    //3) go to date row 4 , find todays date cols c-g,

    //get all the letters indicating the selections in that column
    //first start with my row: 10,
    //later get the names array. 

    //make current, loop thru all users.
    for (var user in users) {
        var userObj = users[user];

        //getting row.
        if (!userObj.row) {
            userObj.row = utils.getUserRowNum(user);
            console.log('row returned! ' + userObj.row);

        }

        if (userObj.daily) {
            utils.sendDailyEmailForUserAtRow(userObj.row, userObj.email);
        }
    }

}

//todo for joaquin
function sendWeeklyFillMealReminder() {

    for (var user in users) {
        var userObj = users[user];
        if (userObj.weekly) {
            utils.remindEmptyNextWeek(userObj);

        }
    }

}

