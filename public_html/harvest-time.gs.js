
function doHoursForLastMonth() {

  //OPEN google spreadsheet template : tools-> script editor -paste in. 
  //add a trigger, on first of month. 
  //update the config below
  var config = {
    user: {
      name: 'Michael Hazzard'
    },
    project: 'GCOM Development',
    drive: {
      // get these ids by opening the folder or doc in google drive, and its in the url 
      folder: '15L8--zzIjdUP4h7Xwv_-QXWTePRLjq1B',
      template: '1Nj6MIJwnGeLKKu3PsgMAgu9Lfq62i5v3NV8OWYrxYLo'
    },
    harvest: {
      //get these from harvest at: 
      // https://id.getharvest.com/oauth2/access_tokens/new
      accessToken: '1605761.pt.WB2q82J9hKx4K9l6kjNP4RcDs5Q1mSsJ2Exh_uMvnQzqObet0KgUg_xowjiVRqn9sR6mtg9ewxmIvrH-LB8-tA',
      accountID: '268051',
    },
    emails: [
      'gianmarco@rockstarcoders.com'
    ]

  };


  Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) { s = "0" + s; }
    return s;
  }

  function getMonthName(i) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[i];
  }

  // 0 = jan -> 01 = jan
  function zeroBasedMonthToPaddedMonth(zeroBasedMonth) {
    var addedMonth = zeroBasedMonth + 1;
    return addedMonth.pad(2);
  }

  //update from harvest using their api, get total hours for the last month,
  //https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
  function getHoursFromHarvest(dateLastMonth) {

    //   curl -i \
    //  -H 'Harvest-Account-ID: 268051'\
    //  -H 'Authorization: Bearer '\
    //  -H 'User-Agent: Harvest API Example' \
    //  "https://api.harvestapp.com/api/v2/users/me.json"

    //var url = 'https://api.harvestapp.com/api/v2/time_entries?from=2018-12-01&to=2018-12-07';
    var from = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth(dateLastMonth.getMonth()) + '-01';

    var lastDayOfLastMonth = new Date(dateLastMonth.getFullYear(), dateLastMonth.getMonth() + 1, 0).getDate().pad(2);

    var to = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth(dateLastMonth.getMonth()) + '-' + lastDayOfLastMonth;

    var url = 'https://api.harvestapp.com/api/v2/time_entries?from=' + from + '&to=' + to;

    var headers = {
      "User-Agent": "Google Apps Script Harvest API Sample",
      "Authorization": "Bearer " + config.harvest.accessToken,
      "Harvest-Account-ID": config.harvest.accountID
    };

    var options = {
      "method": "get",
      "headers": headers
    };

    var response = UrlFetchApp.fetch(url, options);
    if (!response || !response.getContentText) {
      throw 'could not get hours from harvest';
    }

    var hoursHarvest = getHoursFromResponse(response.getContentText());
    return hoursHarvest;
  }

  function getHoursFromResponse(jsonTimeEntries) {
    var jsonTimeEntriesObj = JSON.parse(jsonTimeEntries);
    Logger.log('=====4=========jsonTimeEntriesObj[\'time_entries\']' + jsonTimeEntriesObj['time_entries']);

    var hours = 0;
    for (var i = 0; i < jsonTimeEntriesObj['time_entries'].length; i++) {
      var thisTime = jsonTimeEntriesObj['time_entries'][i];
      Logger.log('thisTime', thisTime['hours']);
      hours += thisTime['hours'];
    }

    Logger.log('HOURS added  RAWWWW' + hours);
    return Math.ceil(hours);
  }

  function init(monthsBack) {

    //clone the doc at the beginning of the month
    var dateLastMonth = new Date();
    dateLastMonth.setMonth(dateLastMonth.getMonth() - monthsBack);

    var monthName = getMonthName(dateLastMonth.getMonth())
    var fileName = config.user.name + ' for ' + monthName + ' ' + dateLastMonth.getYear() + ' ' + dateLastMonth.toLocaleTimeString();

    var file = DriveApp.getFileById(config.drive.template); //'Michael Hazzard Invoice -- Template'
    //put your template invoice in a folder in drive/ click on it and get the id from the url
    var folder = DriveApp.getFolderById(config.drive.folder); // 'invoices'

    var newFile = file.makeCopy(fileName, folder);

    var ss = SpreadsheetApp.openById(newFile.getId());
    SpreadsheetApp.setActiveSpreadsheet(ss);

    //set hours put in cell G17, which is calced auto
    var hoursWorked = getHoursFromHarvest(dateLastMonth);
    ss.getRange('G17').setValue(hoursWorked);

    //just adding timestamp to invoice num rather than doing persistence. todo: make an increment?
    ss.getRange('B2').setValue(dateLastMonth.getTime() / 1000);

    //set description in cell C17, may get from data? todo.
    var descriptionWorked = config.project + monthName + ' ' + dateLastMonth.getYear();
    ss.getRange('C17').setValue(descriptionWorked);

    //share to emails list if 1st of month.,  otherwise testing and not spamming.
    if (dateLastMonth.getDate() === 1) {
      newFile.addViewer(config.emails[0]);
    }
  }

  //test 6 months to compare.
  //for(var i = 1; i < 7; i++){
  //  init(i);
  //}

  //last month 1 back.
  init(1);

}
