/*
 * Bar chart resource: https://bl.ocks.org/mbostock/3885304
 */
var BarChart = function (params) {
  var self = this;
  self.defaultParams = {
    data: [],
    startDate: '',
    endDate: '',
    selector: '',
    maxValue: 0,
    xTicks: 7,
    yTicks: 5,
    yLabel: '',
    gradientStopColor: '#f00',
    gradientStartColor: '#ff0'
  };

  /*
   * Merge parameters (default and given by developer)
   */
  self.params = mergeParams();

  /*
   * Log error if no selector is given
   */
  if (!self.params.selector) {
    console.error('No selector was given to BarChart');
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
   * Set x and y scale based on the width and height of the SVG width and height attributes
   */
  self.x = d3.scaleTime()
    .range([10, self.width - self.margin.right]);
  self.y = d3.scaleLinear()
    .rangeRound([self.height, 0]);

  /*
   * Subscriptions
   */
  Events.on('bar/on/mouseover', markBar);
  Events.on('bar/on/mouseleave', unmarkBar);
  Events.on('data/load/done', handleDataLoadDone);
  Events.on('barchart/domain/set', handleDomainSet);
  Events.on('timefilter/select', handleTimeFilterSelect);
  Events.on('timefilter/nav', handleTimeFilterSelect);
  Events.on('barchart/filter/time/done', handleDataLoadDone);

  /*
   * Create group position
   */
  self.group = self.svg.append('g')
    .attr('transform', 'translate(' + self.margin.left + ', ' + self.margin.top + ')');

  /*
   * Set domain for x and y scale based on given statdate and enddate parameter
   */
  function setDomain() {
    // Set domain for x based on time in data
    self.x.domain([self.params.startDate, self.params.endDate]);
    // Set domain for y based on step count in data
    self.y.domain([0, self.params.maxValue]);
    // Emit event
    Events.emit('barchart/domain/set');
  }

  /*
   * Draw barchart
   * - draws X axis
   * - draws Y axis
   * - draws bar groups
   * - draws single bars
   * - draws mean line
   * - appends mean line text
   */
  function draw() {

    // Join data using a single instance of the data using []
    var xAxis = self.group.selectAll('.axis--x')
      .data([self.params.data]);

    // Update, set ticks to a tick per day using d3.timeDay
    xAxis.transition()
      .duration(500)
      .call(d3.axisBottom(self.x)
        .ticks(d3.timeDay)
        .tickFormat(''));

    // Enter, set ticks to a tick per day using d3.timeDay
    xAxis.enter()
      .append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(' + self.margin.left + ', ' + self.height + ')')
      .call(d3.axisBottom(self.x)
        .ticks(d3.timeDay)
        .tickFormat(''));

    // Join data using a single instance of the data using []
    var yAxis = self.group.selectAll('.axis--y')
      .data([self.params.data]);

    // Update, set ticks to a tick per given tick in the parameters
    yAxis.transition()
      .duration(500)
      .call(d3.axisLeft(self.y)
        .ticks(self.params.yTicks));

    // Enter, set ticks to a tick per given tick in the parameters
    yAxis.enter()
      .append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(' + self.margin.left + ', 0)')
      .call(d3.axisLeft(self.y)
        .ticks(self.params.yTicks))
      .append('text')
      .attr('x', 5)
      .attr('y', 5)
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text(self.params.yLabel);

    // Join the data using the full given data in the parameters
    var bar = self.group.selectAll('.bar')
      .data(self.params.data);

    // Remove bars of which data point do not longer exists
    bar.exit()
      .attr('x', xCurrentPosition)
      .attr('y', yCurrentPosition)
      .attr('height', currentHeightBar)
      .transition()
      .duration(500)
      .attr('x', xBarPosition)
      .attr('y', self.height)
      .attr('height', 0)
      .remove();

    // Update bars
    bar.attr('x', xCurrentPosition)
      .attr('y', yCurrentPosition)
      .attr('width', currentWidthBar)
      .attr('data-date', dataDate)
      .transition()
      .duration(500)
      .attr('x', xBarPosition)
      .attr('y', yBarPosition)
      .attr('width', widthBar)
      .attr('height', heightBar);

    // Enter, set fill to defined gradient within the parameters and set by setGradient()
    bar.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', xBarPosition)
      .attr('y', self.height)
      .attr('width', widthBar)
      .attr('height', 0)
      .attr('data-date', dataDate)
      .on('mouseover', handleBarMouseOver)
      .on('mouseleave', handleBarMouseLeave)
      .transition()
      .duration(valueDuration)
      .attr('height', heightBar)
      .attr('y', yBarPosition)
      .attr('fill', 'url(#' + getGradientId() + ')');

    // Join data using a single instance of the data using []
    var line = self.group.selectAll('.line')
      .data([self.params.data]);

    // Remove the line if no data is present
    line.exit()
      .transition()
      .duration(1000)
      .remove();

    // Update line with new mean value
    line.transition()
      .duration(1000)
      .attr('y1', getMeanY())
      .attr('y2', getMeanY());

    // Enter line with mean values and draw over the whole width of chart
    line.enter()
      .append('line')
      .attr('class', 'line')
      .attr('x1', getMeanLineStart())
      .attr('x2', getMeanLineEnd())
      .attr('y1', getMeanY())
      .attr('y2', getMeanY())
      .attr('stroke', '#aaa')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', 3)
      .attr('fill', 'transparent');

    // Join data using a single instance of the data using []
    var meanText = self.group.selectAll('.mean-text')
      .data([self.params.data]);

    // Remove mean text if no data is present
    meanText.exit()
      .remove();

    // Update x and y position of mean text
    meanText.attr('x', xMeanTextPosition)
      .attr('y', yMeanTextPosition)
      .text(textMean);

    // Enter x and y position of mean text
    meanText.enter()
      .append('text')
      .attr('class', 'mean-text')
      .attr('x', xMeanTextPosition)
      .attr('y', yMeanTextPosition)
      .attr('text-anchor', 'start')
      .text(textMean);
  }

  /*
   * Calculates duration based on the value of the bar (corresponds to height)
   * Divide it by the max value
   * Times a 1000(ms) to create fluent duration for each value
   */
  function valueDuration(data) {
    return 1000 * data.value / self.params.maxValue;
  }

  /*
   * Create gradient
   * Resource: http://jsfiddle.net/ZCwrx/
   */
  function setGradient() {

    // Join data using a single instance of the data using []
    var gradient = self.svg.selectAll('.gradient')
      .data([self.params.data]);

    // Remove gradient if no data is present
    gradient.exit()
      .remove();

    // Enter gradient set y values to min and max value of the y scale
    // Create unique id per gradient
    var gradientEnter = gradient.enter()
      .append('linearGradient')
      .attr('y1', minY)
      .attr('y2', maxY)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('id', getGradientId)
      .attr('class', 'gradient')
      .attr('gradientUnits', 'userSpaceOnUse');

    // Add start of gradient
    gradientEnter.append('stop')
      .attr('offset', '0')
      .attr('stop-color', self.params.gradientStartColor);

    // Add end of gradient
    gradientEnter.append('stop')
      .attr('offset', '0.5')
      .attr('stop-color', self.params.gradientStopColor);
  }

  /*
   * Get width of bar
   */
  function widthBar(data) {
    return 7;
  }

  /*
   * Get x bar position
   */
  function xBarPosition(data) {
    return (self.x(u.getDateObjectFromString(data.key)) + self.margin.left) - widthBar(data) / 2;
  }

  /*
   * Get bar y position
   */
  function yBarPosition(data) {
    return self.y(data.value);
  }

  /*
   * Get height of bar
   */
  function heightBar(data, index) {
    return self.height - self.y(data.value);
  }

  /*
   * Get min y position for gradient
   */
  function minY() {
    return self.height;
  }

  /*
   * Get max y position for gradient
   */
  function maxY() {
    return 0;
  }

  /*
   * Merge parameter object with defaults
   */
  function mergeParams() {
    return Object.assign(self.defaultParams, params);
  }

  /*
   * Get current x position based on element's x attribute
   */
  function xCurrentPosition() {
    return d3.select(this)
      .attr('x');
  }

  /*
   * Get current y position based on element's y attribute
   */
  function yCurrentPosition() {
    return d3.select(this)
      .attr('y');
  }

  /*
   * Get current width position based on element's width attribute
   */
  function currentWidthBar() {
    return d3.select(this)
      .attr('width');
  }

  /*
   * Get current height position based on element's height attribute
   */
  function currentHeightBar() {
    return d3.select(this)
      .attr('height');
  }

  /*
   * Emits event when mouse is over .bar element
   */
  function handleBarMouseOver(data) {
    Events.emit('bar/on/mouseover', {
      point: data
    });
  }

  /*
   * Emits event when mouse is leaving .bar element
   */
  function handleBarMouseLeave(data) {
    Events.emit('bar/on/mouseleave');
  }

  /*
   * Gets gradient ID
   */
  function getGradientId() {
    return 'gradient-' + self.params.selector.replace('#', '');
  }

  /*
   * Filters data based on start and enddate given by the parameters
   */
  function handleDataLoadDone() {
    self.params.data = u.filterDataOnDate(self.params.startDate, self.params.endDate, self.params.data);
    setDomain();
  }

  /*
   * Handles when domain is set event and sets gradient and after that draws the chart
   */
  function handleDomainSet() {
    setGradient();
    draw();
  }

  /*
   * Marks .bar element when is hovered over
   * Also marks bar when a corresponding bar in another chart is hovered over.
   * Adds text label above the bar
   */
  function markBar(data) {
    var bar = self.svg.select('[data-date="' + data.point.key + '"]')
      .classed('active', true);
    self.svg.append('text')
      .attr('x', xTextPosition.bind(data.point))
      .attr('y', yTextPosition.bind(data.point))
      .attr('text-anchor', 'middle')
      .attr('class', 'bar-label')
      .text(getTextLabel.bind(data.point));
  }

  /*
   * Removes marked state from all bars found with this state based on the classname 'active'
   */
  function unmarkBar() {
    var bars = self.svg.selectAll('.bar.active')
      .classed('active', false);
    var barLabels = self.svg.selectAll('.bar-label')
      .remove();
  }

  /*
   * Returns x position for text label
   */
  function xTextPosition() {
    return xBarPosition(this) + widthBar(this) / 2 + self.margin.left;
  }

  /*
   * Returns y position for text label
   * Uses queryDataByKey() to ensure it gets y value of this instance
   */
  function yTextPosition() {
    var data = queryDataByKey(this.key);
    if (!data) {
      return;
    }
    return yBarPosition(data) + 10;
  }

  /*
   * Returns text label content
   * Uses queryDataByKey() to ensure it gets the value of this instance
   */
  function getTextLabel() {
    var data = queryDataByKey(this.key);
    if (!data) {
      return;
    }
    var value = u.round(data.value, 2);
    var mean = u.round(getMean(), 2);
    var diff = u.round((value / mean) * 100 - 100, 0);
    var text = '+' + diff + '%' + ' (' + value + ')';
    if (diff < 0) {
      text = diff + '%' + ' (' + value + ')';
    }
    return text;
  }

  /*
   * Returns key value of data
   */
  function dataDate(data) {
    return data.key;
  }

  /*
   * Returns data based on given key in the parameter
   */
  function queryDataByKey(key) {
    // For this we need the value of the data appended to this instance
    return self.params.data.find(function (entry) {
      return key === entry.key;
    });
  }

  /*
   * Returns x position for mean text label
   */
  function xMeanTextPosition(data) {
    return getMeanLineEnd() + 3;
  }

  /*
   * Returns y position for mean text label
   */
  function yMeanTextPosition(data) {
    return getMeanY() + 3;
  }

  /*
   * Get y position based on mean value
   */
  function getMeanY() {
    return self.y(getMean());
  }

  /*
   * Gets mean value based on current data
   */
  function getMean() {
    return d3.mean(self.params.data.map(function (row) {
      return row.value;
    }));
  }

  /*
   * Get start x position for mean line
   */
  function getMeanLineStart() {
    return self.margin.left;
  }

  /*
   * Get end x position for mean line
   */
  function getMeanLineEnd() {
    return self.width - self.margin.left - 10;
  }

  /*
   * Get mean text content
   */
  function textMean(data) {
    return u.round(getMean(), 2);
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
   * Sets max value of filtered data
   * Emits filter done event when everything is set
   */
  function handleTimeFilterSelect(data) {
    var endDate = t.getEndDate();
    var newStartDate = t.getStartDate();
    var originalData = u.originalData[self.params.type];
    var filteredData = u.filterDataOnDate(newStartDate, endDate, originalData);
    self.params.data = filteredData;
    self.params.startDate = newStartDate;
    self.params.endDate = endDate;
    self.params.maxValue = u.getMaxValue(filteredData);
    Events.emit('barchart/filter/time/done');
  }
}
