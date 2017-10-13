var types = [];
var parseTime = d3.timeParse('%Y-%m-%d %H:%M:%S %Z');

/*
* Events listeners
*/
window.addEventListener('load', handleWindowLoad);

/*
 * Handles window load event
 */
function handleWindowLoad() {
  loadData();
}

function loadData() {
  d3.xml('./index.xml', mapData);
}

/*
 * XML parsing source: https://bl.ocks.org/mbostock/ec585e034819c06f5c99
 */
function mapData(error, data) {
  if (error) {
    throw error;
  }

  data = [].map.call(data.querySelectorAll('Record'), function(record) {
    return {
      type: parseType(record.getAttribute('type')),
      value: parseValue(record.getAttribute('value')),
      startDate: parseTime(record.getAttribute('startDate')),
      endDate: parseTime(record.getAttribute('endDate')),
      creationDate: parseTime(record.getAttribute('creationDate'))
    }
  });
  var stepCountData = getStepCountData(data);
  var distanceWalkingRunningData = getDistanceWalkingRunningData(data);
  var flightsClimbedData = getFlightsClimbedData(data);
  var sleepAnalysisData = getSleepAnalysisData(data);
  var groupedData = [
    stepCountData,
    distanceWalkingRunningData,
    flightsClimbedData,
    sleepAnalysisData
  ];
  groupedData.forEach(function(data){
    createTable(data, 10);
  });
  var loader = document.querySelector('.loader');
  loader.classList.add('hide');
}

function createTable(data, maxRows) {
  var body = document.querySelector('body');
  var heading = document.createElement('h2');
  var table = document.createElement('table');
  var thead = document.createElement('thead');
  var theadTr = document.createElement('tr');
  var tbody = document.createElement('tbody');
  heading.textContent = data[0].type;
  for (var prop in data[0]) {
    var theadTd = document.createElement('td');
    theadTd.textContent = prop;
    theadTr.appendChild(theadTd);
  }
  thead.appendChild(theadTr);
  for (var i = 0; maxRows > i; i++) {
    var tbodyTr = document.createElement('tr');
    for (var prop in data[0]) {
      var tbodyTd = document.createElement('td');
      tbodyTd.textContent = data[i][prop];
      tbodyTr.appendChild(tbodyTd);
    }
    tbody.appendChild(tbodyTr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  body.appendChild(heading);
  body.appendChild(table);
}

function getStepCountData(data) {
  return data.filter(function(row) {
    return row.type === 'StepCount';
  });

}

function getDistanceWalkingRunningData(data) {
  return data.filter(function(row) {
    return row.type === 'DistanceWalkingRunning';
  });

}

function getFlightsClimbedData(data) {
  return data.filter(function(row) {
    return row.type === 'FlightsClimbed';
  });

}

function getSleepAnalysisData(data) {
  return data.filter(function(row) {
    return row.type === 'SleepAnalysis';
  });

}

function parseValue(value) {
  return isNaN(Number(value)) ? null : Number(value);
}

function parseType(type) {
  type = type.replace(/HKQuantityTypeIdentifier|HKCategoryTypeIdentifier/g, '');
  if (types.indexOf(type) === -1) {
    types.push(type)
  }
  return type;
}
