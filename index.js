var types = [];
var parseTime = d3.timeParse('%Y-%m-%d %H:%M:%S %Z');
var u = new Utils();
var t;

/*
 * Events listeners
 */
window.addEventListener('load', handleWindowLoad);

/*
 * Subscriptions
 */
Events.on('data/load/done', handleDataLoadDone);
Events.on('data/map/done', handleDataMapDone);
Events.on('data/load/sleepcycle/done', handleSleepDataLoad);

/*
 * Handles window load event
 */
function handleWindowLoad() {
  loadData();
  t = new TimeFilter('timeFilter');
}

function handleDataLoadDone(data) {

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

  Events.emit('data/map/done', {
    data: data
  });
}

function handleDataMapDone(data) {
  var sleepAnalysisData = getSleepAnalysisData(data.data);

  /*
   * Sleep analysis
   */
  var sleepAnalysisDataTransformed = u.createSleepCyclePerDay(sleepAnalysisData, [21, 3], [5, 11]);
  var maxDate = u.getMaxDate(sleepAnalysisDataTransformed);
  var defaultRange = u.getDefaultRange(maxDate, 'month')
  var sleepAnalysisDataFiltered = u.filterDataOnDate(defaultRange.startDate, defaultRange.endDate, sleepAnalysisDataTransformed);
  var SleepAnalysisSleepCycle = new SleepCycle({
    data: sleepAnalysisDataFiltered,
    selector: '#sleepCycle',
    type: 'sleepCycle',
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    minTime: u.getMinTime(sleepAnalysisDataFiltered, 3),
    maxTime: u.getMaxTime(sleepAnalysisDataFiltered),
    yLabel: 'Hours'
  });

  Events.emit('data/load/sleepcycle/done', {
    minDate: defaultRange.startDate,
    maxDate: defaultRange.endDate,
    data: data.data
  });
}

/*
* Handles sleep data load event
*
* - Loads step count data.
* - Draws step count barchart.
* - Loads walking running distance data.
* - Draws walking running distance barchart.
* - Loads flights climbed data.
* - Draws flights climbed barchart.
*/
function handleSleepDataLoad(data) {
  var stepCountData = getStepCountData(data.data);
  var distanceWalkingRunningData = getDistanceWalkingRunningData(data.data);
  var flightsClimbedData = getFlightsClimbedData(data.data);

  /*
   * Step count
   */
  var stepCountDataTransformed = u.mergeDataPerDay(stepCountData, 'stepCount');
  var stepCountDataFiltered = u.filterDataOnDate(data.minDate, data.maxDate, stepCountDataTransformed);
  var StepCountBarChart = new BarChart({
    data: stepCountDataFiltered,
    selector: '#stepCount',
    type: 'stepCount',
    startDate: data.minDate,
    endDate: data.maxDate,
    maxValue: u.getMaxValue(stepCountDataFiltered),
    yLabel: 'Steps',
    gradientStartColor: '#3DE8F8',
    gradientStopColor: '#00233A'
  });

  /*
   * Walking distance
   */
  var distanceWalkingRunningDataTransformed = u.mergeDataPerDay(distanceWalkingRunningData, 'walkingRunningDistance');
  var distanceWalkingRunningDataFiltered = u.filterDataOnDate(data.minDate, data.maxDate, distanceWalkingRunningDataTransformed);
  var DistanceWalkingRunningBarChart = new BarChart({
    data: distanceWalkingRunningDataFiltered,
    selector: '#distanceWalkingRunning',
    type: 'walkingRunningDistance',
    startDate: data.minDate,
    endDate: data.maxDate,
    maxValue: u.getMaxValue(distanceWalkingRunningDataFiltered),
    yLabel: 'Distance Walking or Running',
    gradientStartColor: '#73F551',
    gradientStopColor: '#023C00'
  });

  /*
   * Flights climbed
   */
  var flightsClimbedDataTransformed= u.mergeDataPerDay(flightsClimbedData, 'flightsClimbed');
  var flightsClimbedDataFiltered = u.filterDataOnDate(data.minDate, data.maxDate, flightsClimbedDataTransformed);
  var FlightsClimbedBarChart = new BarChart({
    data: flightsClimbedDataFiltered,
    selector: '#flightsClimbed',
    type: 'flightsClimbed',
    startDate: data.minDate,
    endDate: data.maxDate,
    maxValue: u.getMaxValue(flightsClimbedDataFiltered),
    yLabel: 'Flights climbed',
    gradientStartColor: '#C962F7',
    gradientStopColor: '#180038'
  });

  Events.emit('data/load/done');
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
