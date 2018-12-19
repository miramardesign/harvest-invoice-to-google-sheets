
function invoiceHours() {

  //OPEN google spreadsheet template : tools-> script editor -paste in. 
  //add a trigger, on first of month. 
  //update the config below
  var config = {
    user: {
      name: 'Michael Hazzard'
    },
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
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i];
  }

  // 0 = jan -> 01 = jan
  function zeroBasedMonthToPaddedMonth(zeroBasedMonth) {
    var addedMonth = zeroBasedMonth + 1;
    return addedMonth.pad(2);
  }

  //update from harvest using their api, get total hours for the last month,
  //https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
  function getHoursFromHarvest(dateLastMonth) {

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

    var hoursHarvest = getHoursProjectsFromResponse(response.getContentText());
    return hoursHarvest;
  }

  function getHoursProjectsFromResponse(jsonTimeEntries) {
    var jsonTimeEntriesObj = JSON.parse(timeEntries);
    Logger.log('=====4=========jsonTimeEntriesObj[\'time_entries\']' + jsonTimeEntriesObj['time_entries']);

    var projects = {};
    var hours = 0;
    for (var i = 0; i < jsonTimeEntriesObj['time_entries'].length; i++) {
      
      var thisTime = jsonTimeEntriesObj['time_entries'][i];
      var projectName = thisTime['project']['name'];
      if(projects[projectName]){
        projects[projectName].hours += thisTime['hours'];
      }else{
        projects[projectName].hours = thisTime['hours']
      }


      Logger.log('thisTime', thisTime['hours']);
      hours += thisTime['hours'];
    }

    Logger.log('HOURS added  RAWWWW' + hours, projects);
     //  return Math.ceil(hours);
     return projects;
  }

  function init(monthsBack) {

    //increment invoice num before cloning dock.
    var ssOrig = SpreadsheetApp.getActiveSpreadsheet();

    var lastInvoice = ssOrig.getRange('B2').getValue();
    ssOrig.getRange('B2').setValue(lastInvoice + 1);
    SpreadsheetApp.flush(); //save the sheet

    //clone the doc at the beginning of the month
    var dateLastMonth = new Date();
    dateLastMonth.setMonth(dateLastMonth.getMonth() - monthsBack);

    var monthName = getMonthName(dateLastMonth.getMonth())
    var fileName = config.user.name + ' for ' + monthName + ' ' + dateLastMonth.getYear() + ' ' + dateLastMonth.toLocaleTimeString();

    var file = DriveApp.getFileById(config.drive.template); //'Michael Hazzard Invoice -- Template'
    file
    //put your template invoice in a folder in drive/ click on it and get the id from the url
    var folder = DriveApp.getFolderById(config.drive.folder); // 'invoices'

    var newFile = file.makeCopy(fileName, folder);

    var ssClone = SpreadsheetApp.openById(newFile.getId());
    SpreadsheetApp.setActiveSpreadsheet(ssClone);

    //set hours put in cell G17, which is calced auto
    var hoursProjectsWorked = getHoursFromHarvest(dateLastMonth);

    for( var p in hoursProjectsWorked){
      var row = 17; 
      var project = p;
      var hours = hoursProjectsWorked[p];

      
      //set description in cell C17, may get from data? todo.
      var descriptionWorked = project + monthName + ' ' + dateLastMonth.getYear();
      ssClone.getRange('C' + row).setValue(descriptionWorked);
      ssClone.getRange('G' + row).setValue(hours);

      row++;
    }

  
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
