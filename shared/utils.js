var Utils = function() {
  var self = this;
  self.originalData = {};

  self.getMinDate = function(data) {
    return d3.min(data, function(entry) {
      return self.getDateObjectFromString(entry.key);
    });
  };

  self.getMaxDate = function(data) {
    return d3.max(data, function(entry) {
      return self.getDateObjectFromString(entry.key);
    });
  };

  self.getDateObjectFromString = function(string) {
    var dateArray = string.split('-');
    var year = Number(dateArray[2]);
    var month = Number(dateArray[1]) - 1; // Month indexes from 0
    var day = Number(dateArray[0]);
    return new Date(year, month, day);
  };

  self.getMaxValue = function(data) {
    return d3.max(data, function(entry) {
      return entry.value;
    });
  };

  self.mergeDataPerDay = function(data, type) {
    var dataPerDay = d3.nest()
      .key(function(data) {
        return data.startDate.toLocaleDateString();
      })
      .rollup(function(data) {
        return d3.sum(data, function(group) {
          return group.value;
        });
      })
      .entries(data);
      save(dataPerDay, type);
      return dataPerDay;
  };

  self.filterDataOnDate = function(startDate, endDate, data) {
    return data.filter(function(entry) {
      var currentDate = self.getDateObjectFromString(entry.key);
      if (currentDate >= startDate && currentDate <= endDate) {
        return entry;
      }
    });
  };

  self.createSleepCyclePerDay = function(data, minThreshold, maxThreshold) {
    var minSpread = getMinHourSpread(minThreshold);
    var maxSpread = getMaxHourSpread(maxThreshold);
    var sleepCyclePerDay = d3.nest()
      .key(function(data) {
        return data.startDate.toLocaleDateString();
      })
      .rollup(function(data) {
        return data.map(function(entry) {
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
        }).filter(function(entry) {
          return entry !== undefined;
        });
      })
      .entries(data).filter(function(entry) {
        return entry.value.length > 0;
      });
      save(sleepCyclePerDay, 'sleepCycle');
      return sleepCyclePerDay;
  };

  self.getMinTime = function(data, maxThreshold) {
    return d3.min(data, function(entry) {
      var minDateTime = d3.min(entry.value, function(value) {
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

  self.getMaxTime = function(data) {
    return d3.max(data, function(entry) {
      var maxDateTime = d3.max(entry.value, function(value) {
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

  self.getDefaultRange = function(date, rangeType) {
    var endDate = moment(date);
    var startDate = endDate.clone().subtract(1, rangeType);
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

  function getMinHourSpread(spread) {
    var clock = getClock();
    var startSpread = clock.slice(clock.indexOf(spread[0]), clock.length);
    var endSpread = clock.slice(0, clock.indexOf(spread[1] + 1));
    return startSpread.concat(endSpread);
  }

  function getMaxHourSpread(spread) {
    var clock = getClock();
    return clock.slice(clock.indexOf(spread[0]), clock.indexOf(spread[1] + 1));
  }

  function getClock() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  }

  function save(data, type) {
    self.originalData[type] = data;
  }
}
