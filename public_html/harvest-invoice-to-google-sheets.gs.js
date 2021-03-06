
function invoiceHours() {

    //OPEN google spreadsheet template : tools-> script editor -paste in. 
    //add a trigger, on first of month. 
    //update the config below
  
    config = getConfig();
  
    Number.prototype.pad = function (size) {
      var s = String(this);
      while (s.length < (size || 2)) { s = "0" + s; }
      return s;
    }
  
    /**
     * get english month name
     * @param {*} i 
     */
    function getMonthName(i) {
      return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i];
    }
  
    /**
     *   // 0 = jan -> 01 = jan
  
     * @param {*} zeroBasedMonth 
     */
    function zeroBasedMonthToPaddedMonth(zeroBasedMonth) {
      var addedMonth = zeroBasedMonth + 1;
      return addedMonth.pad(2);
    }
    /**
     *  //update from harvest using their api, get total hours for the last month,
     *  //https://help.getharvest.com/api-v2/authentication-api/authentication/authentication/
     * @param {*} dateLastMonth 
     */
    function getHoursFromHarvest(dateLastMonth) {
  
      var from = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth(dateLastMonth.getMonth()) + '-01';
  
      var lastDayOfLastMonth = new Date(dateLastMonth.getFullYear(), dateLastMonth.getMonth() + 1, 0).getDate().pad(2);
  
      var to = dateLastMonth.getYear() + '-' + zeroBasedMonthToPaddedMonth(dateLastMonth.getMonth()) + '-' + lastDayOfLastMonth;
  
      var url = 'https://api.harvestapp.com/api/v2/time_entries?from=' + from + '&to=' + to;
  
      var headers = {
        "User-Agent": "Google Apps Script Harvest API Invoice",
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
  
    /**
     * parse out the json, push into totalled summed object like { 'projectA': {hours: 33}, 'projectB': {hours: 55}} 
     * @param {*} timeEntries response from harvest RAW
     */
    function getHoursProjectsFromResponse(timeEntries) {
      var jsonTimeEntriesObj = JSON.parse(timeEntries);
  
      var projects = {};
      for (var i = 0; i < jsonTimeEntriesObj['time_entries'].length; i++) {
  
        var thisTime = jsonTimeEntriesObj['time_entries'][i];
        var projectName = thisTime['project']['name'];
        if (!projects[projectName]) {
          projects[projectName] = { hours: thisTime['hours'] };
        } else {
          projects[projectName].hours += thisTime['hours']
        }
  
        Logger.log('thisTime', thisTime['hours']);
      }
  
      Logger.log('HOURS projects', projects);
      return projects;
    }
  
    /**
     * loop thru the totals rows from C17 and add them from the projects object
     * @param {*} ssClone spreadsheet coy
     * @param {*} hoursProjectsWorked object w/ hours and projects names
     * @param {*} monthName last month name,
     * @param {*} dateLastMonth date object last month.
     */
    function setTotalRows(ssClone, hoursProjectsWorked, monthName, dateLastMonth) {
  
      var row = 17;
      for (var p in hoursProjectsWorked) {
        var project = p;
        var hours = Math.ceil(hoursProjectsWorked[p].hours);
  
        Logger.log('project', project, 'hours', hours);
  
        //set description in cell C17, may get from data? todo.
        var descriptionWorked = project + ' ' + monthName + ' ' + dateLastMonth.getYear();
        ssClone.getRange('C' + row).setValue(descriptionWorked);
        ssClone.getRange('G' + row).setValue(hours);
  
        row++;
      }
  
    }
    
    /**
     * Michael Hazzard Invoice -- Template Script  -> to like ->  Michael Hazzard Invoice for November 2018  timestamp
     * @param {string} fileNameOrig original spreadsheet ss
     * @param {string} monthName  month name last month
     * @param {*} dateLastMonth date object last month
     */
    function getFileName(fileNameOrig, monthName, dateLastMonth){
      return fileNameOrig.split('--')[0] + ' for ' + monthName + ' ' + dateLastMonth.getYear() + ' ' + dateLastMonth.toLocaleTimeString();
    }
  
    /**
     * run the thing
     * @param {date} monthsBack 
     */
    function init(monthsBack) {
  
      //increment invoice num before cloning dock.
      var ssOrig = SpreadsheetApp.getActiveSpreadsheet();
      var fileNameOrig = ssOrig.getName();
      Logger.log('filename orig77777777777777', fileNameOrig);
  
      var lastInvoice = ssOrig.getRange('B2').getValue();
      ssOrig.getRange('B2').setValue(lastInvoice + 1);
     
      SpreadsheetApp.flush(); //save the sheet
  
      //clone the doc at the beginning of the month
      var dateLastMonth = new Date();
      dateLastMonth.setMonth(dateLastMonth.getMonth() - monthsBack);
  
      var monthName = getMonthName(dateLastMonth.getMonth())
  
      var file = DriveApp.getFileById(config.drive.template); //'Michael Hazzard Invoice -- Template'
      //put your template invoice in a folder in drive/ click on it and get the id from the url
      var folder = DriveApp.getFolderById(config.drive.folder); // 'invoices'
      
      var fileNameClone = getFileName(fileNameOrig, monthName, dateLastMonth);
      var newFile = file.makeCopy(fileNameClone, folder);
  
      var ssClone = SpreadsheetApp.openById(newFile.getId());
      SpreadsheetApp.setActiveSpreadsheet(ssClone);
  
      //set hours put in cell G17, which is calced auto
      var hoursProjectsWorked = getHoursFromHarvest(dateLastMonth);
  
      setTotalRows(ssClone, hoursProjectsWorked, monthName, dateLastMonth);
  
  
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
  