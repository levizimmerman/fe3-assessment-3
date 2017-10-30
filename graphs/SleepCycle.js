/*
 * Bar chart resource: https://bl.ocks.org/mbostock/3885304
 */
var SleepCycle = function (params) {
  var self = this;
  self.defaultParams = {
    data: [],
    startDate: '',
    endDate: '',
    yLabel: '',
    selector: '',
    minTime: '',
    maxTime: '',
    yTicks: 3
  };

  /*
   * Merge parameters (default and given by developer)
   */
  self.params = mergeParams();

  /*
   * Log error if no selector is given
   */
  if (!self.params.selector) {
    console.error('No selector was given to SleepCycle');
  }
  self.svg = d3.select(self.params.selector)
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight / 5);
  self.margin = {
    top: 20,
    right: 60,
    bottom: 20,
    left: 20
  };
  self.width = self.svg.attr('width') - self.margin.left - self.margin.right;
  self.height = self.svg.attr('height') - self.margin.top - self.margin.bottom;

  /*
   * Subscriptions
   */
  Events.on('data/load/done', handleDataLoadDone);
  Events.on('sleepcycle/domain/set', handleDomainSet);
  Events.on('sleepcycle/axis/drawn', handleAxisDrawn);
  Events.on('timefilter/select', handleTimeFilterSelect);
  Events.on('timefilter/nav', handleTimeFilterNav);
  Events.on('sleepcycle/filter/time/done', handleDataLoadDone);
  Events.on('sleepcycle/filter/time/nav', handleDataLoadDone);
  Events.on('sleepcycle/bars/drawn', handleBarsDrawn);
  Events.on('bar/on/mouseover', showDataOnBar);
  Events.on('bar/on/mouseleave', hideDataOnBar);

  /*
   * Set x and y scale based on the width and height of the SVG width and height attributes
   */
  self.x = d3.scaleTime()
    .range([10, self.width - self.margin.right]);
  self.y = d3.scaleTime()
    .range([self.height, 0]);

  /*
   * Create group position
   */
  self.group = self.svg.append('g')
    .attr('transform', 'translate(' + self.margin.left + ', ' + self.margin.top + ')');

  /*
   * Sets domain when data load is done
   */
  function handleDataLoadDone() {
    setDomain();
  }

  /*
   * Sets domain
   * x domain is based on start and end data given as parameter
   * y domain is set based on mintime and maxtime of sleeping hours
   */
  function setDomain() {
    self.x.domain([self.params.startDate, self.params.endDate]);
    self.y.domain([self.params.maxTime, self.params.minTime])
      .nice();
    Events.emit('sleepcycle/domain/set');
  }

  /*
   * Draws axis when domain is set
   */
  function handleDomainSet() {
    drawAxis();
  }

  /*
   * Draws x and y axis
   */
  function drawAxis() {

    // Join data using a single instance of the data using []
    var xAxis = self.group.selectAll('.axis--x')
      .data([self.params.data]);

    // Update, set ticks to a tick per day using d3.timeDay
    xAxis.transition()
      .duration(500)
      .call(d3.axisBottom(self.x)
        .ticks(d3.timeDay)
        .tickFormat(d3.timeFormat('%d/%m')));

    // Enter, set ticks to a tick per day using d3.timeDay
    xAxis.enter()
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(' + self.margin.left + ', ' + self.height + ')')
      .call(d3.axisBottom(self.x)
        .ticks(d3.timeDay)
        .tickFormat(d3.timeFormat('%d/%m')));

    // Join data using a single instance of the data using []
    var yAxis = self.group.selectAll('.axis--y')
      .data([self.params.data]);

    // Update, set ticks to a tick per hour with a interval of 2 hours
    yAxis.transition()
      .duration(500)
      .call(d3.axisLeft(self.y)
        .ticks(d3.timeHour, 2)
        .tickFormat(d3.timeFormat('%H:%M')));

    // Enter, set ticks to a tick per hour with a interval of 2 hours
    yAxis.enter()
      .append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(' + self.margin.left + ', 0)')
      .call(d3.axisLeft(self.y)
        .ticks(d3.timeHour, 2)
        .tickFormat(d3.timeFormat('%H:%M')))
      .append('text')
      .attr('x', 5)
      .attr('y', 5)
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text(self.params.yLabel);

    // Emit event when done drawing the axis
    Events.emit('sleepcycle/axis/drawn');
  }

  /*
   * Handles axis drawn event
   * - Draws bar groups
   * - Draws single bars within bar groups
   */
  function handleAxisDrawn() {

    // Join data
    var barGroup = self.group.selectAll('.bar-group')
      .data(self.params.data);

    // Save enter instance in group variable
    var barGroupEnter = barGroup.enter()
      .append('g')
      .attr('class', 'bar-group');

    // Enter, set x position of group using index of data
    barGroupEnter.attr('transform', xBarGroupPositionIncremented)
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .attr('opacity', 1)
      .attr('transform', xBarGroupPosition)

    // Update, barGroup x position
    barGroup.attr('transform', currentTransform)
      .transition()
      .duration(500)
      .attr('transform', xBarGroupPosition);

    // Join data into a bar instance
    var bar = barGroup.selectAll('.bar')
      .data(getValuesOfDay, function (data) {
        return data.value;
      });

    // Enter, store instance in barEnter and append data again when group enters
    var barEnter = barGroupEnter.selectAll('.bar')
      .data(getValuesOfDay, function (data) {
        return data.value;
      });

    // Update, set bar position and width
    bar.attr('rx', barRadius)
      .attr('ry', barRadius)
      .attr('x', 0)
      .attr('width', currentWidthBar)
      .attr('y', currentyBarPosition)
      .attr('height', currentBarHeight)
      .attr('data-date', dataDate)
      .transition()
      .duration(500)
      .attr('width', barWidth)
      .attr('y', yBarPosition)
      .attr('height', barHeight);

    // Enter, set bar position and width
    barEnter.enter()
      .append('rect')
      .attr('class', 'bar bar--sleep')
      .attr('x', 0)
      .attr('y', yBarPosition)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('rx', currentBarRadius)
      .attr('ry', currentBarRadius)
      .attr('data-date', dataDate)
      .on('mouseover', handleBarMouseOver)
      .on('mouseleave', handleBarMouseLeave)
      .transition()
      .duration(500)
      .attr('rx', barRadius)
      .attr('ry', barRadius);

    // Exit, remove bar when data is not present
    bar.exit()
      .remove();

    // Exit, after bars are exited, exit the bargroup
    barGroup.exit()
      .attr('transform', currentTransform)
      .attr('opacity', 1)
      .transition()
      .duration(500)
      .attr('transform', xBarGroupPositionIncremented)
      .attr('opacity', 0)
      .remove();

    // Emit event when all bars drawn
    Events.emit('sleepcycle/bars/drawn');
  }

  /*
   * Draw mean when bars are drawn
   */
  function handleBarsDrawn() {

    // Store empty array if no data is found, prevent array within array
    var data = self.params.data.length > 0 ? [self.params.data] : [];

    // Join data by passing single value using []
    var meanStartSleep = self.group.selectAll('.mean-line.mean-line--start')
      .data(data);

    // Ezit, remove mean if no data
    meanStartSleep.exit()
      .remove();

    // Update, set start mean y position
    meanStartSleep.transition()
      .attr('y1', startMeanY)
      .attr('y2', startMeanY);

    // Enter, set start nean y position and x position
    meanStartSleep.enter()
      .append('line')
      .attr('class', 'mean-line mean-line--start')
      .attr('x1', startMeanX)
      .attr('x2', endMeanX)
      .attr('y1', startMeanY)
      .attr('y2', startMeanY)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', 3)
      .attr('fill', 'transparent');

    // Join data by passing single value using []
    var startMeanText = self.group.selectAll('.mean-text.mean-text--start')
      .data(data);

    // Exit, remove start mean text when no data is present
    startMeanText.exit()
      .remove();

    // Update, set mean text position and text content with the new mean value
    startMeanText.attr('x', xMeanTextPosition)
      .transition()
      .attr('y', yStartMeanTextPosition)
      .text(textStartMean);

    // Enter, set mean text position and text content with the new mean value
    startMeanText.enter()
      .append('text')
      .attr('class', 'mean-text mean-text--start')
      .attr('x', xMeanTextPosition)
      .attr('y', yStartMeanTextPosition)
      .attr('text-anchor', 'start')
      .text(textStartMean);

    // Join data by passing single value using []
    var meanEndSleep = self.group.selectAll('.mean-line.mean-line--end')
      .data(data);

    // Exit, remove end mean line when no data is present
    meanEndSleep.exit()
      .remove();

    // Update, set mean y position
    meanEndSleep.transition()
      .attr('y1', endMeanY)
      .attr('y2', endMeanY);

    // Enter, set position mean line
    meanEndSleep.enter()
      .append('line')
      .attr('class', 'mean-line mean-line--end')
      .attr('x1', startMeanX)
      .attr('x2', endMeanX)
      .attr('y1', endMeanY)
      .attr('y2', endMeanY)
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', 3)
      .attr('fill', 'transparent');

    // Join data by passing single value using []
    var endMeanText = self.group.selectAll('.mean-text.mean-text--end')
      .data(data);

    // Exit, remove mean text when no data is present
    endMeanText.exit()
      .remove();

    // Update, set mean text position
    endMeanText.attr('x', xMeanTextPosition)
      .transition()
      .attr('y', yEndMeanTextPosition)
      .text(textEndMean);

    // Enter, set mean text position and text content with the new mean value
    endMeanText.enter()
      .append('text')
      .attr('class', 'mean-text mean-text--end')
      .attr('x', xMeanTextPosition)
      .attr('y', yEndMeanTextPosition)
      .attr('text-anchor', 'start')
      .text(textEndMean);
  }

  /*
   * Returns mean text x position
   */
  function xMeanTextPosition() {
    return self.width - self.margin.left - 10;
  }

  /*
   * Returns y position of start mean text
   */
  function yStartMeanTextPosition() {
    return startMeanY() + 3;
  }

  /*
   * Returns y position of end mean text
   */
  function yEndMeanTextPosition() {
    return endMeanY() + 3;
  }

  /*
   * Returns text content for start mean
   */
  function textStartMean() {
    return moment(new Date(startMean()))
      .format('HH:mm');
  }

  /*
   * Returns text content for end mean
   */
  function textEndMean() {
    return moment(new Date(endMean()))
      .format('HH:mm');
  }

  /*
   * Returns x position for start mean
   */
  function startMeanX() {
    return self.margin.left;
  }

  /*
   * Returns x position for end mean
   */
  function endMeanX() {
    return self.width - self.margin.left - 10;
  }

  /*
   * Returns y position for start mean
   */
  function startMeanY() {
    return self.y(new Date(startMean()));
  }

  /*
   * Returns y position for end mean
   */
  function endMeanY() {
    return self.y(new Date(endMean()));
  }

  /*
   * Returns mean for start time of sleep
   */
  function startMean() {
    return d3.mean(self.params.data, function (entry) {
      return setToCurrentTime(entry.value[0].start);
    });
  }

  /*
   * Returns mean for time slept
   */
  function sleptMean() {
    return d3.mean(self.params.data, function (entry) {
      return d3.sum(entry.value, function (value) {
        return value.slept;
      });
    });
  }

  /*
   * Returns mean for end time of sleep
   */
  function endMean() {
    return d3.mean(self.params.data, function (entry) {
      return setToCurrentTime(entry.value[entry.value.length - 1].end);
    });
  }

  /*
   * Returns date which is set to the current date
   * - Overwrites hours of current date
   * - Overwrites minutes of current date
   */
  function setToCurrentTime(dataDate) {
    var hours = dataDate.getHours();
    var minutes = dataDate.getMinutes();
    var date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setDate(date.getDate() + 1);
    return date;
  }

  /*
   * Returns radius for bars
   */
  function barRadius() {
    return barWidth() / 2;
  }

  /*
   * Returns x position for bar group
   */
  function xBarGroupPosition(data) {
    return 'translate(' + xBarPosition(data) + ', 0)';
  }

  /*
   * Returns x position for bargroup based on width of instance
   */
  function xBarGroupPositionIncremented(data) {
    return 'translate(' + self.width + ', 0)';
  }

  /*
   * Returns x position of bar based on date data
   * Return of self.x (scale function) is centered and margin offset is added
   */
  function xBarPosition(data) {
    return self.x(u.getDateObjectFromString(data.key)) + self.margin.left - barWidth() / 2;
  }

  /*
   * Returns y position of bar
   * New date is created to match current date (on y scale)
   * Overwrite hours and minutes of date based on data
   */
  function yBarPosition(data) {
    if (!data.start) {
      return;
    }
    var date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(data.start.getHours());
    date.setMinutes(data.start.getMinutes());
    return self.y(date);
  }

  /*
   * Returns width of bar
   */
  function barWidth() {
    return 7;
  }

  /*
   * Returns height of bar based on end date on y scale and start date on y scale
   */
  function barHeight(data) {
    return self.y(data.end) - self.y(data.start);
  }

  /*
   * Returns values of data
   */
  function getValuesOfDay(data) {
    return data.value;
  }

  /*
   * Returns current radius attribute of selected element
   */
  function currentBarRadius() {
    return d3.select(this)
      .attr('rx');
  }

  /*
   * Returns current tranform attribute of selected element
   */
  function currentTransform() {
    return d3.select(this)
      .attr('transform');
  }

  /*
   * Returns current widt attribute of selected element
   */
  function currentWidthBar() {
    return d3.select(this)
      .attr('width');
  }

  /*
   * Returns current y attribute of selected element
   */
  function currentyBarPosition() {
    return d3.select(this)
      .attr('y');
  }

  /*
   * Returns current height attribute of selected element
   */
  function currentBarHeight() {
    return d3.select(this)
      .attr('height');
  }

  /*
   * Handles bar mouseover event
   * Emits event with data appended
   */
  function handleBarMouseOver(data) {
    data.key = data.start.toLocaleDateString();
    Events.emit('bar/on/mouseover', {
      point: data
    });
  }

  /*
   * Handles bar mouseleave event
   * Emits event
   */
  function handleBarMouseLeave() {
    Events.emit('bar/on/mouseleave');
  }

  /*
   * Returns locale date string from date object in data.start
   */
  function dataDate(data) {
    return data.start.toLocaleDateString();
  }

  /*
   * Merge parameter object with defaults
   */
  function mergeParams() {
    return Object.assign(self.defaultParams, params);
  }

  /*
   * Handles time filter select event
   * Gets start date
   * Gets end date
   * Gets originalData based on type of chart
   * Filters data based on new startdate, enddate and given originalData
   * Sets new data which is filtered
   * Sets new start date
   * Sets new end date
   * Emits filter done event when everything is set
   */
  function handleTimeFilterSelect(data) {
    var endDate = t.getEndDate();
    var newStartDate = t.getStartDate();
    var originalData = u.originalData[self.params.type];
    self.params.data = u.filterDataOnDate(newStartDate, endDate, originalData);
    self.params.startDate = newStartDate;
    self.params.endDate = endDate;
    Events.emit('sleepcycle/filter/time/done');
  }

  /*
   * Handles time filter nav event
   * Gets start date
   * Gets end date
   * Gets originalData based on type of chart
   * Filters data based on new startdate, enddate and given originalData
   * Sets new data which is filtered
   * Sets new start date
   * Sets new end date
   * Emits filter done event when everything is set
   */
  function handleTimeFilterNav() {
    var newEndDate = t.getEndDate();
    var newStartDate = t.getStartDate();
    var originalData = u.originalData[self.params.type];
    self.params.data = u.filterDataOnDate(newStartDate, newEndDate, originalData);
    self.params.startDate = newStartDate;
    self.params.endDate = newEndDate;
    Events.emit('sleepcycle/filter/time/nav');
  }

  /*
   * Adds text element above bar element display detailed information
   */
  function showDataOnBar(data) {
    // console.log(data.point.key);
    var bar = self.svg.select('[data-date="' + data.point.key + '"]')
      .classed('active', true);
    console.log(bar);
    self.svg.append('text')
      .attr('x', xTextPosition.bind(data.point))
      .attr('y', yTextPosition.bind(data.point))
      .attr('text-anchor', 'middle')
      .attr('class', 'bar-label')
      .text(getTextLabel.bind(data.point));
  }

  /*
   * Returns x position of text based on bar position
   */
  function xTextPosition() {
    return xBarPosition(this) + barWidth(this) / 2 + self.margin.left;
  }

  /*
   * Returns y position of text based on y bar position
   */
  function yTextPosition() {
    var data = queryDataByKey(this.key);
    if (!data) {
      return;
    }
    return yBarPosition(data.value[0]) + 10;
  }

  /*
   * Returns text content
   * - Gets mean of time slept
   * - Creates percent differnce of mean value
   * - if is positive percent return '+' + text otherwise default number which is negative
   */
  function getTextLabel() {
    var data = queryDataByKey(this.key);
    if (!data) {
      return;
    }
    var mean = sleptMean();
    var percent = u.round((data.value[0].slept / mean) * 100 - 100, 1);
    var text = '+' + percent + '% (' + data.value[0].slept + ')';
    if (percent < 0) {
      text = percent + '% (' + data.value[0].slept + ')';
    }
    return text;
  }

  /*
   * Returns data based on key value
   */
  function queryDataByKey(key) {
    // For this we need the value of the data appended to this instance
    return self.params.data.find(function (entry) {
      return key === entry.key;
    });
  }

  /*
   * Removes all 'active' classnames from bar elements
   * Removes all bar labels if present
   */
  function hideDataOnBar() {
    var bars = self.svg.selectAll('.bar.active')
      .classed('active', false);
    var barLabels = self.svg.selectAll('.bar-label')
      .remove();
  }
}
