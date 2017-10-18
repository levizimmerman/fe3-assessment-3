var TimeFilter = function(selector) {
  var self = this;
  self.element = document.getElementById(selector);
  self.selectedStartDate = '';
  self.selectedEndDate = '';
  self.selectedType = '';

  /*
  * Subscriptions
  */
  Events.on('date/range/default', handleDateRangeChange);
  Events.on('timefilter/select', handleFilterSelect)

  self.getEndDate = function() {
    return self.selectedEndDate;
  };

  self.getStartDate = function() {
    return self.selectedStartDate;
  };

  init();

  function init() {
    build();
  }

  function build() {
    var prevButton = document.createElement('button');
    var nextButton = document.createElement('button');
    var pills = document.createElement('ul');
    var weekPill = document.createElement('li');
    var weekPillButton = document.createElement('button');
    var monthPill = document.createElement('li');
    var monthPillButton = document.createElement('button');
    // var yearPill = document.createElement('li');
    // var yearPillButton = document.createElement('button');

    // Set attributes
    prevButton.setAttribute('class', 'time-filter-prev');
    nextButton.setAttribute('class', 'time-filter-next');
    pills.setAttribute('class', 'time-filter-pills');
    weekPill.setAttribute('class', 'time-filter-pill');
    monthPill.setAttribute('class', 'time-filter-pill');
    // yearPill.setAttribute('class', 'time-filter-pill');
    weekPill.setAttribute('data-type', 'week');
    monthPill.setAttribute('data-type', 'month');
    // yearPill.setAttribute('data-type', 'year');

    // Set text
    prevButton.innerText = 'Prev';
    nextButton.innerText = 'Next';
    weekPillButton.innerText = 'Week';
    monthPillButton.innerText = 'Month';
    // yearPillButton.innerText = 'Year';

    // Add listeners
    prevButton.addEventListener('click', handlePrevClick);
    nextButton.addEventListener('click', handleNextClick);
    weekPillButton.addEventListener('click', handleWeekClick);
    monthPillButton.addEventListener('click', handleMonthClick);
    // yearPillButton.addEventListener('click', handleYearClick);

    // Appending
    self.element.appendChild(prevButton);
    weekPill.appendChild(weekPillButton);
    pills.appendChild(weekPill);
    monthPill.appendChild(monthPillButton);
    pills.appendChild(monthPill);
    // yearPill.appendChild(yearPillButton);
    // pills.appendChild(yearPill);
    self.element.appendChild(pills);
    self.element.appendChild(nextButton);
  }

  function handlePrevClick() {
    var type = self.selectedType;
    var newStartDate = moment(self.selectedStartDate).clone().subtract(1, type);
    var newEndDate = moment(self.selectedEndDate).clone().subtract(1, type);
    setStartDate(newStartDate.toDate());
    setEndDate(newEndDate.toDate());
    Events.emit('timefilter/nav');
  }

  function handleNextClick() {
    var type = self.selectedType;
    var newStartDate = moment(self.selectedStartDate).clone().add(1, type);
    var newEndDate = moment(self.selectedEndDate).clone().add(1, type);
    setStartDate(newStartDate.toDate());
    setEndDate(newEndDate.toDate());
    Events.emit('timefilter/nav');
  }

  function handleWeekClick(event) {
    var newStartDate = moment(self.getEndDate()).clone().subtract(1, 'week');
    setStartDate(newStartDate.toDate());
    Events.emit('timefilter/select', {type: 'week'});
  }

  function handleMonthClick() {
    var newStartDate = moment(self.getEndDate()).clone().subtract(1, 'month');
    setStartDate(newStartDate.toDate());
    Events.emit('timefilter/select', {type: 'month'});
  }

  function handleYearClick() {
    Events.emit('timefilter/select', {type: 'year'});
  }

  function handleDateRangeChange(data) {
    setEndDate(data.endDate);
    setStartDate(data.startDate);
    setType(data.rangeType);
    var activeRangeElement = self.element.querySelector('.time-filter-pill.active');
    var rangeElement = self.element.querySelector('[data-type="' + data.rangeType + '"]');
    if (activeRangeElement) {
        activeRangeElement.classList.remove('active');
    }
    if(!rangeElement.classList.contains('active')) {
      rangeElement.classList.add('active');
    }
  }

  function handleFilterSelect(data) {
    setType(data.type);
  }

  function setType(type) {
    self.selectedType = type;
  }

  function setEndDate(date) {
    self.selectedEndDate = date;
  }

  function setStartDate(date) {
    self.selectedStartDate = date;
  }
};
