/*
 * Bar chart resource: https://bl.ocks.org/mbostock/3885304
 */
var BarChart = function(params) {
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
  self.params = mergeParams();
  if (!self.params.selector) {
    console.error('No selector was given to BarChart');
  }
  self.svg = d3.select(self.params.selector)
  .on('mouseover', handleGroupMouseOver)
  .on('mouseleave', handleGroupMouseLeave);
  self.margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };
  self.width = self.svg.attr('width') - self.margin.left - self.margin.right;
  self.height = self.svg.attr('height') - self.margin.top - self.margin.bottom;
  self.indicator = self.svg.append('line')
  .attr('class', 'indicator')
  .attr('x1', self.margin.left + self.margin.right)
  .attr('x2', self.margin.left + self.margin.right)
  .attr('y1', self.margin.top)
  .attr('y2', self.height + self.margin.top);
  /*
   * Set x and y scale based on the width and height of the SVG width and height attributes
   */
  self.x = d3.scaleTime().
  range([0, self.width - self.margin.right]);
  self.y = d3.scaleLinear()
    .rangeRound([self.height, 0]);

  /*
   * Subscriptions
   */
  Events.on('bar/on/mouseover', showIndicator);
  Events.on('bar/on/mouseleave', hideIndicator);
  Events.on('data/load/done', handleDataLoadDone);
  Events.on('barchart/domain/set', handleDomainSet);
  Events.on('barchart/meanline/set', handleMeanLineSet);
  Events.on('timefilter/select', handleTimeFilterSelect);
  Events.on('timefilter/nav', handleTimeFilterSelect);
  Events.on('barchart/filter/time/done', handleDataLoadDone);

  /*
   * Create group position
   */
  self.group = self.svg.append('g')
    .attr('transform', 'translate(' + self.margin.left + ', ' + self.margin.top + ')');

  function setMeanLine() {
    var mean = d3.mean(self.params.data.map(function(row) {
      return self.y(row.value);
    }));
    self.meanLine = d3.line().x(xBarPosition).y(mean);
    Events.emit('barchart/meanline/set');
  }

  function setDomain() {
    // Set domain for x based on time in data
    self.x.domain([self.params.startDate, self.params.endDate]);
    // Set domain for y based on step count in data
    self.y.domain([0, self.params.maxValue]);
    Events.emit('barchart/domain/set');
  }

  function draw() {
    //Join data
    var xAxis = self.group.selectAll('.axis--x')
      .data([self.params.data]);

    // Update
    xAxis.transition()
      .duration(500)
      .call(d3.axisBottom(self.x).ticks(0));

    // Enter
    xAxis.enter().append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(' + self.margin.left + ', ' + self.height + ')')
      .call(d3.axisBottom(self.x).ticks(0));

    // Join data
    var yAxis = self.group.selectAll('.axis--y')
      .data([self.params.data]);

    // Update
    yAxis.transition()
      .duration(500)
      .call(d3.axisLeft(self.y).ticks(self.params.yTicks));

    // Enter
    yAxis.enter().append('g')
      .attr('class', 'axis axis--y')
      .attr('transform', 'translate(' + self.margin.left + ', 0)')
      .call(d3.axisLeft(self.y).ticks(self.params.yTicks))
      .append('text')
      .attr('x', 5)
      .attr('y', 5)
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text(self.params.yLabel);

    // Join
    var bar = self.group.selectAll('.bar')
      .data(self.params.data);

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

    bar.attr('x', xCurrentPosition)
      .attr('y', yCurrentPosition)
      .attr('width', currentWidthBar)
      .transition()
      .duration(500)
      .attr('x', xBarPosition)
      .attr('y', yBarPosition)
      .attr('width', widthBar)
      .attr('height', heightBar);

    bar.enter().append('rect')
      .attr('class', 'bar')
      .attr('x', xBarPosition)
      .attr('y', self.height)
      .attr('width', widthBar)
      .attr('height', 0)
      .transition()
      .duration(valueDuration)
      .attr('height', heightBar)
      .attr('y', yBarPosition)
      .attr('fill', 'url(#' + getGradientId() + ')');

    // Join
    var line = self.group.selectAll('.line')
      .data([self.params.data]);

    line.exit()
    .transition()
    .duration(1000)
    .remove();

    line.transition()
    .duration(1000)
    .attr('d', self.meanLine);

    line.enter().append('path')
      .attr('class', 'line')
      .attr('d', self.meanLine)
      .attr('stroke', 'red')
      .attr('fill', 'transparent');
  }

  function valueDuration(data) {
    return 1000 * data.value / self.params.maxValue;
  }

  /*
   * Create gradient
   * Resource: http://jsfiddle.net/ZCwrx/
   */
  function setGradient() {
    var gradient = self.svg.selectAll('.gradient')
    .data([self.params.data]);

    gradient.exit().remove();

    var gradientEnter = gradient.enter().append('linearGradient')
      .attr('y1', minY)
      .attr('y2', maxY)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('id', getGradientId)
      .attr('class', 'gradient')
      .attr('gradientUnits', 'userSpaceOnUse');
    gradientEnter.append('stop')
      .attr('offset', '0')
      .attr('stop-color', self.params.gradientStartColor);
    gradientEnter.append('stop')
      .attr('offset', '0.5')
      .attr('stop-color', self.params.gradientStopColor);
  }

  /*
   * Get width of bar
   */
  function widthBar(data) {
    return 1;
    // return self.width / self.params.data.length;
  }

  /*
   * Get x bar position
   */
  function xBarPosition(data) {
    return self.x(u.getDateObjectFromString(data.key)) + self.margin.left + 1;
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

  function minY() {
    return self.height;
  }

  function maxY() {
    return self.y(self.params.maxValue);
  }

  /*
   * Merge parameter object with defaults
   */
  function mergeParams() {
    return Object.assign(self.defaultParams, params);
  }

  function xCurrentPosition() {
    return d3.select(this).attr('x');
  }

  function yCurrentPosition() {
    return d3.select(this).attr('y');
  }

  function currentWidthBar() {
    return d3.select(this).attr('width');
  }

  function currentHeightBar() {
    return d3.select(this).attr('height');
  }

  function handleGroupMouseOver(data) {
    var mouse = d3.mouse(self.svg.node());
    Events.emit('bar/on/mouseover', {x: mouse[0], y: mouse[1]});
  }

  function handleGroupMouseLeave() {
    Events.emit('bar/on/mouseleave');
  }

  function hideIndicator() {
    self.indicator.classed('active', false);
  }

  function showIndicator(data) {
    self.indicator.attr('x1', data.x)
    .attr('x2', data.x)
    .classed('active', true);
  }

  function getGradientId() {
    return 'gradient-' + self.params.selector.replace('#', '');
  }

  function handleDataLoadDone() {
    self.params.data = u.filterDataOnDate(self.params.startDate, self.params.endDate, self.params.data);
    setDomain();
  }

  function handleDomainSet() {
    setGradient();
    setMeanLine();
  }

  function handleMeanLineSet() {
    draw();
  }

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
