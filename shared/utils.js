/*
 * Utils, used for general data mutations and calculations
 */
var Utils = function () {
  var self = this;

  // Create placeholder to store a copy of initial data load
  self.originalData = {};

  /*
   * Returns minimal date found in data
   */
  self.getMinDate = function (data) {
    return d3.min(data, function (entry) {
      return self.getDateObjectFromString(entry.key);
    });
  };

  /*
   * Returns maximal date found in data
   */
  self.getMaxDate = function (data) {
    return d3.max(data, function (entry) {
      return self.getDateObjectFromString(entry.key);
    });
  };

  /*
   * Returns creates date object from locale data string
   */
  self.getDateObjectFromString = function (string) {
    var dateArray = string.split('-');
    var year = Number(dateArray[2]);
    var month = Number(dateArray[1]) - 1; // Month indexes from 0
    var day = Number(dateArray[0]);
    return new Date(year, month, day);
  };

  /*
   * Returns max value found in data
   */
  self.getMaxValue = function (data) {
    return d3.max(data, function (entry) {
      return entry.value;
    });
  };

  /*
   * Returns data merged, where all entries are merged to a day and stored as array element
   */
  self.mergeDataPerDay = function (data, type) {
    var dataPerDay = d3.nest()
      .key(function (data) {
        return data.startDate.toLocaleDateString();
      })
      .rollup(function (data) {
        return d3.sum(data, function (group) {
          return group.value;
        });
      })
      .entries(data);
    save(dataPerDay, type);
    return dataPerDay;
  };

  /*
   * Returns filters data of start and end date
   */
  self.filterDataOnDate = function (startDate, endDate, data) {
    return data.filter(function (entry) {
      var currentDate = self.getDateObjectFromString(entry.key);
      if (currentDate >= startDate && currentDate <= endDate) {
        return entry;
      }
    });
  };

  /*
   * Returns sleep cycle data merged per day
   * - Gets spread of hours accepted as minimal hours
   * - Gets spread of hours accepted as maximal hours
   * - Creates locale date string as key for each entry
   * - Merges all entries to object {start: Date, end: Date, slept: number}
   * - Checks if starting hours and waking hours of sleep are found within accepted spread of hours
   * - Filters all undefined data out of data
   * - Returns all entries with found values
   * - Save sleepCyclePerDay to originalData
   */
  self.createSleepCyclePerDay = function (data, minThreshold, maxThreshold) {
    var minSpread = getMinHourSpread(minThreshold);
    var maxSpread = getMaxHourSpread(maxThreshold);
    var sleepCyclePerDay = d3.nest()
      .key(function (data) {
        return data.startDate.toLocaleDateString();
      })
      .rollup(function (data) {
        return data.map(function (entry) {
            var startTime = entry.startDate.getTime();
            var endTime = entry.endDate.getTime();
            var diffTime = endTime - startTime;
            var startHours = entry.startDate.getHours();
            var endHours = entry.endDate.getHours();
            if (minSpread.indexOf(startHours) !== -1 && maxSpread.indexOf(endHours) !== -1) {
              return {
                start: entry.startDate,
                end: entry.endDate,
                slept: Math.round(diffTime / 36000) / 100 // 2 Decimal rounding: https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
              };
            }
          })
          .filter(function (entry) {
            return entry !== undefined;
          });
      })
      .entries(data)
      .filter(function (entry) {
        return entry.value.length > 0;
      });
    save(sleepCyclePerDay, 'sleepCycle');
    return sleepCyclePerDay;
  };

  /*
   * Returns minimal time found in data
   * - Gets minimal date in values array of data entry
   * - Get hours and minutes of minimal date
   * - Overwrite current date hours and minutes with data from min date
   * - Add 1 day if hours are midnight, this is needed to output the same date
   */
  self.getMinTime = function (data, maxThreshold) {
    return d3.min(data, function (entry) {
      var minDateTime = d3.min(entry.value, function (value) {
        return value.start;
      });
      var hours = minDateTime.getHours();
      var minutes = minDateTime.getMinutes();
      var date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      if (hours <= maxThreshold) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    });
  };

  /*
   * Returns maixmal time found in data
   * - Gets maximal date in values array of data entry
   * - Get hours and minutes of maximal date
   * - Overwrite current date hours and minutes with data from min date
   */
  self.getMaxTime = function (data) {
    return d3.max(data, function (entry) {
      var maxDateTime = d3.max(entry.value, function (value) {
        return value.end;
      });
      var hours = maxDateTime.getHours();
      var minutes = maxDateTime.getMinutes();
      var date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setDate(date.getDate() + 1);
      return date;
    });
  };

  /*
   * Returns default date range consisting out of a start and end date
   */
  self.getDefaultRange = function (date, rangeType) {
    var endDate = moment(date);
    var startDate = endDate.clone()
      .subtract(1, rangeType);
    Events.emit('date/range/default', {
      startDate: startDate.toDate(),
      endDate: date,
      rangeType: rangeType
    });
    return {
      startDate: startDate.toDate(),
      endDate: date
    };
  };

  /*
   * Returns rounded value based on given decimals and value
   */
  self.round = function (value, decimals) {
    var divider = Math.pow(10, decimals);
    return Math.round(value * divider) / divider;
  };

  /*
   * Returns mininmal hour spread based on clock array (24h clock) and given spread (e.g. [21, 3])
   */
  function getMinHourSpread(spread) {
    var clock = getClock();
    var startSpread = clock.slice(clock.indexOf(spread[0]), clock.length);
    var endSpread = clock.slice(0, clock.indexOf(spread[1] + 1));
    return startSpread.concat(endSpread);
  }

  /*
   * Returns maximal hour spread based on clock array (24h clock) and given spread (e.g. [5, 11])
   */
  function getMaxHourSpread(spread) {
    var clock = getClock();
    return clock.slice(clock.indexOf(spread[0]), clock.indexOf(spread[1] + 1));
  }

  /*
   * Returns array of 24h clock
   */
  function getClock() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  }

  /*
   * Saves data to property based on type of originalData objec
   */
  function save(data, type) {
    self.originalData[type] = data;
  }
}
