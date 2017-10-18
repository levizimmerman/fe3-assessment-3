var SleepCycle = function(params) {
  var self = this;
  self.defaultParams = {
    data: [],
    startDate: '',
    endDate: '',
    yLabel: '',
    selector: '',
    minTime: '',
    maxTime: '',
    xTicks: 7,
    yTicks: 3
  };
  self.params = mergeParams();
  if (!self.params.selector) {
    console.error('No selector was given to SleepCycle');
  }
  self.svg = d3.select(self.params.selector);
  self.margin = {
    top: 20,
    right: 20,
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

  /*
   * Set x and y scale based on the width and height of the SVG width and height attributes
   */
  self.x = d3.scaleTime().
  range([0, self.width - self.margin.left - self.margin.right]);
  self.y = d3.scaleTime()
    .range([self.height, 0]);

  /*
   * Create group position
   */
  self.group = self.svg.append('g')
    .attr('transform', 'translate(' + self.margin.left + ', ' + self.margin.top + ')');

  function handleDataLoadDone() {
    setDomain();
  }

  function setDomain() {
    self.x.domain([self.params.startDate, self.params.endDate]);
    self.y.domain([self.params.maxTime, self.params.minTime]);
    Events.emit('sleepcycle/domain/set');
  }

  function handleDomainSet() {
    drawAxis();
  }

  function drawAxis() {
    // Join data
    var xAxis = self.group.selectAll('.axis--x')
    .data([self.params.data]);

    // Update
    xAxis.transition()
    .duration(500)
    .call(d3.axisBottom(self.x).ticks(self.params.xTicks));

    // Enter
    xAxis.enter().append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(' + self.margin.left + ', ' + self.height + ')')
      .call(d3.axisBottom(self.x).ticks(self.params.xTicks));

    // Join data
    var yAxis = self.group.selectAll('.axis--y')
    .data([self.params.data]);

    // Update
    yAxis.transition()
    .duration(500)
    .call(d3.axisLeft(self.y).ticks(self.params.yTicks));

    yAxis.enter().append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', 'translate(' + self.margin.left + ', 0)')
    .call(d3.axisLeft(self.y)
    .ticks(self.params.yTicks)
  .tickFormat(d3.timeFormat('%H:%M')))
    .append('text')
    .attr('x', 5)
    .attr('y', 5)
    .attr('fill', '#000')
    .attr('font-weight', 'bold')
    .attr('text-anchor', 'start')
    .text(self.params.yLabel);

    Events.emit('sleepcycle/axis/drawn');
  }

  function handleAxisDrawn() {
    // Join data
    var barGroup = self.group.selectAll('.bar-group')
    .data(self.params.data);

    var barGroupEnter = barGroup.enter().append('g')
    .attr('class', 'bar-group');

    barGroupEnter.attr('transform', xBarGroupPositionIncremented)
    .attr('opacity', 0)
    .transition()
    .duration(500)
    .attr('opacity', 1)
    .attr('transform', xBarGroupPosition)

    // Update
    barGroup.attr('transform', currentTransform)
    .transition()
    .duration(500)
    .attr('transform', xBarGroupPosition);

    var bar = barGroup.selectAll('.bar')
    .data(getValuesOfDay, function(data) {
      return data.value;
    });

    var barEnter = barGroupEnter.selectAll('.bar')
    .data(getValuesOfDay, function(data) {
      return data.value;
    });

    bar.attr('rx', barRadius)
    .attr('ry', barRadius)
    .attr('x', 0)
    .attr('width', currentWidthBar)
    .attr('y', currentyBarPosition)
    .attr('height', currentBarHeight)
    .transition()
    .duration(500)
    .attr('width', barWidth)
    .attr('y', yBarPosition)
    .attr('height', barHeight);

    barEnter.enter().append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', yBarPosition)
    .attr('width', barWidth)
    .attr('height', barHeight)
    .attr('rx', currentBarRadius)
    .attr('ry', currentBarRadius)
    .transition()
    .duration(500)
    .attr('rx', barRadius)
    .attr('ry', barRadius);

    // Exit
    bar.exit().remove();
    barGroup.exit()
    .attr('transform', currentTransform)
    .attr('opacity', 1)
    .transition()
    .duration(500)
    .attr('transform', xBarGroupPositionIncremented)
    .attr('opacity', 0)
    .remove();
  }

  function barRadius() {
    return barWidth() / 2;
  }

  function xBarGroupPosition(data) {
    return 'translate(' + xBarPosition(data) + ', 0)';
  }

  function xBarGroupPositionIncremented(data) {
    return 'translate(' + self.width + ', 0)';
  }

  function xBarPosition(data) {
    return self.x(u.getDateObjectFromString(data.key)) + self.margin.left;
  }

  function yBarPosition(data) {
    var date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(data.start.getHours());
    date.setMinutes(data.start.getMinutes());
    return self.y(date);
  }

  function barWidth() {
    if ((self.width / self.params.data.length) > 5) {
      return 5;
    }
    return self.width / self.params.data.length;
  }

  function barHeight(data) {
    return self.y(data.end) - self.y(data.start);
  }

  function getValuesOfDay(data) {
    return data.value;
  }

  function currentBarRadius() {
    return d3.select(this).attr('rx');
  }

  function currentTransform() {
    return d3.select(this).attr('transform');
  }

  function currentWidthBar() {
    return d3.select(this).attr('width');
  }

  function currentyBarPosition() {
    return d3.select(this).attr('y');
  }

  function currentBarHeight() {
    return d3.select(this).attr('height');
  }

  /*
   * Merge parameter object with defaults
   */
  function mergeParams() {
    return Object.assign(self.defaultParams, params);
  }

  function handleTimeFilterSelect(data) {
    var endDate = t.getEndDate();
    var newStartDate = t.getStartDate();
    var originalData = u.originalData[self.params.type];
    self.params.data = u.filterDataOnDate(newStartDate, endDate, originalData);
    self.params.startDate = newStartDate;
    self.params.endDate = endDate;
    Events.emit('sleepcycle/filter/time/done');
  }

  function handleTimeFilterNav() {
    var newEndDate = t.getEndDate();
    var newStartDate = t.getStartDate();
    var originalData = u.originalData[self.params.type];
    self.params.data = u.filterDataOnDate(newStartDate, newEndDate, originalData);
    self.params.startDate = newStartDate;
    self.params.endDate = newEndDate;
    Events.emit('sleepcycle/filter/time/nav');
  }
}
