
function doHoursForLastMonth() {

    Number.prototype.pad = function(size) {
      var s = String(this);
      while (s.length < (size || 2)) {s = "0" + s;}
      return s;
    }
    
    function getMonthName(i) {
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return months[i];
    }
    
    
    // 0 = jan -> 01 = jan
    function zeroBasedMonthToPaddedMonth(zeroBasedMonth){
      var addedMonth = zeroBasedMonth + 1;
      return addedMonth.pad(2);
    }
  
    //update from harvest using their api, get total hours for the last month,
    //https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
    function getHoursFromHarvest(dateLastMonth) {
      
      //   curl -i \
      //  -H 'Harvest-Account-ID: 268051'\
      //  -H 'Authorization: Bearer 1605761.pt.WB2q82J9hKx4K9l6kjNP4RcDs5Q1mSsJ2Exh_uMvnQzqObet0KgUg_xowjiVRqn9sR6mtg9ewxmIvrH-LB8-tA'\
      //  -H 'User-Agent: Harvest API Example' \
      //  "https://api.harvestapp.com/api/v2/users/me.json"
  
      //var url = "https://api.harvestapp.com/v2/users/me";
      
      //var url = 'https://api.harvestapp.com/api/v2/time_entries?from=2018-12-01&to=2018-12-07';
      var from = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth( dateLastMonth.getMonth()) + '-01';
      
     // var lastDayOfLastMonth = getLstDayOfMonFnc(dateLastMonth);
      var lastDayOfLastMonth = new Date(dateLastMonth.getFullYear(), dateLastMonth.getMonth() + 1, 0).getDate().pad(2);
  
      var to = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth( dateLastMonth.getMonth()) + '-' + lastDayOfLastMonth;
  
      var url = 'https://api.harvestapp.com/api/v2/time_entries?from=' + from + '&to=' + to;
      var accessToken = "1605761.pt.WB2q82J9hKx4K9l6kjNP4RcDs5Q1mSsJ2Exh_uMvnQzqObet0KgUg_xowjiVRqn9sR6mtg9ewxmIvrH-LB8-tA";
      var accountID = "268051";
  
      var headers = {
        "User-Agent": "Google Apps Script Harvest API Sample",
        "Authorization": "Bearer " + accessToken,
        "Harvest-Account-ID": accountID
      };
  
      var options = {
        "method": "get",
        "headers": headers
      };
  
      var response = UrlFetchApp.fetch(url, options);
      //Logger.log('===1========' + response); 
  
      //Logger.log('==2=========' + JSON.parse(response.getContentText()));
  
      if (!response || !response.getContentText) {
        throw 'could not get hours from harvest';
      }
  
      var hoursHarvest = getHoursFromResponse(response.getContentText());
      return hoursHarvest;
    }
  
    
    function getHoursFromResponse(jsonTimeEntries) {
     Logger.log('type????????============2.5============= ', typeof(jsonTimeEntries));
      Logger.log('===3 =======jsondata RAWWWW' + jsonTimeEntries);
      var jsonTimeEntriesObj = JSON.parse(jsonTimeEntries);
      Logger.log('=====4=========jsonTimeEntriesObj[\'time_entries\']' + jsonTimeEntriesObj['time_entries']);
  
      var hours = 0;
      for (var i = 0; i < jsonTimeEntriesObj['time_entries'].length; i++) {
        var thisTime = jsonTimeEntriesObj['time_entries'][i];
        Logger.log('thisTime', thisTime['hours']);
        hours += thisTime['hours'];
      }
  
      Logger.log('HOURS added  RAWWWW' + hours);
      return Math.ceil( hours );
    }
    
    function init(){
    
      //clone the doc at the beginning of the month
      var dateLastMonth = new Date();
      dateLastMonth.setMonth(dateLastMonth.getMonth() - 1);
      
      var monthName = getMonthName(dateLastMonth.getMonth())
      var fileName = 'Michael Hazzard Invoice for ' + monthName + ' ' + dateLastMonth.getYear() + ' ' + dateLastMonth.toLocaleTimeString();
      
      var file = DriveApp.getFileById('1Nj6MIJwnGeLKKu3PsgMAgu9Lfq62i5v3NV8OWYrxYLo'); //'Michael Hazzard Invoice -- Template'
      
      var folder = DriveApp.getFolderById('15L8--zzIjdUP4h7Xwv_-QXWTePRLjq1B'); // 'invoices'
      
      var newFile = file.makeCopy(fileName, folder);
      
      var ss = SpreadsheetApp.openById(newFile.getId());
      SpreadsheetApp.setActiveSpreadsheet(ss);
      
      //set hours put in cell G17, which is calced auto
      var hoursWorked = getHoursFromHarvest(dateLastMonth);
      ss.getRange('G17').setValue(hoursWorked);
      
      //set description in cell C17
      var descriptionWorked = 'GCOM DEVELOPMENT ' + monthName + ' ' + dateLastMonth.getYear();
      ss.getRange('C17').setValue(descriptionWorked);
      
      newFile.addViewer('guillermina.avigliano@gmail.com');
      //if under 180hours pro rate at 27.8 per hour
      //if over 180 hours, round off to agreed rate of $5,000 per month
      //did this in the sheet with formula: 
      
      //email/share to gianmarco and myself
    }
  
    init();
  
  }
  