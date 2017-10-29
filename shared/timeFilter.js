var TimeFilter = function (selector) {
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

  self.getEndDate = function () {
    return self.selectedEndDate;
  };

  self.getStartDate = function () {
    return self.selectedStartDate;
  };

  init();

  /*
   * Function container for initiliaze functions
   */
  function init() {
    build();
  }

  /*
   * Build HTML of time filter
   * - Creates buttons for navigation and week of month filter
   * - Sets atrributes for styling and data types
   * - Adds text to filters
   * - Adds click event listeners to buttons
   * - Appends new HTML to document
   */
  function build() {
    var prevButton = document.createElement('button');
    var nextButton = document.createElement('button');
    var pills = document.createElement('ul');
    var weekPill = document.createElement('li');
    var weekPillButton = document.createElement('button');
    var monthPill = document.createElement('li');
    var monthPillButton = document.createElement('button');

    // Set attributes
    prevButton.setAttribute('class', 'time-filter-prev');
    nextButton.setAttribute('class', 'time-filter-next');
    pills.setAttribute('class', 'time-filter-pills');
    weekPill.setAttribute('class', 'time-filter-pill');
    monthPill.setAttribute('class', 'time-filter-pill');
    weekPill.setAttribute('data-type', 'week');
    monthPill.setAttribute('data-type', 'month');

    // Set text
    weekPillButton.innerText = 'Week';
    monthPillButton.innerText = 'Month';

    // Add listeners
    prevButton.addEventListener('click', handlePrevClick);
    nextButton.addEventListener('click', handleNextClick);
    weekPillButton.addEventListener('click', handleWeekClick);
    monthPillButton.addEventListener('click', handleMonthClick);

    // Appending
    self.element.appendChild(prevButton);
    weekPill.appendChild(weekPillButton);
    pills.appendChild(weekPill);
    monthPill.appendChild(monthPillButton);
    pills.appendChild(monthPill);
    self.element.appendChild(pills);
    self.element.appendChild(nextButton);
  }

  /*
   * Handles previous click of button
   * - Creates new start and end date based on type ('week', 'month')
   * - Sets new dates
   * - Emits event
   */
  function handlePrevClick() {
    var type = self.selectedType;
    var newStartDate = moment(self.selectedStartDate)
      .clone()
      .subtract(1, type);
    var newEndDate = moment(self.selectedEndDate)
      .clone()
      .subtract(1, type);
    setStartDate(newStartDate.toDate());
    setEndDate(newEndDate.toDate());
    Events.emit('timefilter/nav');
  }

  /*
   * Handles next click of button
   * - Creates new start and end date based on type ('week', 'month')
   * - Sets new dates
   * - Emits event
   */
  function handleNextClick() {
    var type = self.selectedType;
    var newStartDate = moment(self.selectedStartDate)
      .clone()
      .add(1, type);
    var newEndDate = moment(self.selectedEndDate)
      .clone()
      .add(1, type);
    setStartDate(newStartDate.toDate());
    setEndDate(newEndDate.toDate());
    Events.emit('timefilter/nav');
  }

  /*
   * Handles week click of button
   * - Creates new start date based on type ('week')
   * - Sets new start date
   * - Emits event
   * - Sets DOM element to active
   */
  function handleWeekClick(event) {
    var newStartDate = moment(self.getEndDate())
      .clone()
      .subtract(1, 'week');
    setStartDate(newStartDate.toDate());
    Events.emit('timefilter/select', {
      type: 'week'
    });
    setActiveElement(this);
  }

  /*
   * Handles month click of button
   * - Creates new start date based on type ('month')
   * - Sets new start date
   * - Emits event
   * - Sets DOM element to active
   */
  function handleMonthClick() {
    var newStartDate = moment(self.getEndDate())
      .clone()
      .subtract(1, 'month');
    setStartDate(newStartDate.toDate());
    Events.emit('timefilter/select', {
      type: 'month'
    });
    setActiveElement(this);
  }

  /*
   * Set classname 'active' to passed element's parent
   */
  function setActiveElement(element) {
    var parent = element.parentNode;
    var timeFilters = document.querySelectorAll('.time-filter-pill');
    // Remove all active state classnames from elements that are not equal to the parent element
    for (var i = 0; timeFilters.length > i; i++) {
      if (timeFilters[i] !== parent && timeFilters[i].classList.contains('active')) {
        timeFilters[i].classList.remove('active');
      }
    }
    // Set active classname for parent element, after checking if it already has active state
    if (!parent.classList.contains('active')) {
      parent.classList.add('active');
    }
  }

  /*
   * Handles date range event
   * - Sets new enddate, startdate and type
   * - Sets clicked DOM element to active
   */
  function handleDateRangeChange(data) {
    setEndDate(data.endDate);
    setStartDate(data.startDate);
    setType(data.rangeType);
    var activeRangeElement = self.element.querySelector('.time-filter-pill.active');
    var rangeElement = self.element.querySelector('[data-type="' + data.rangeType + '"]');
    if (activeRangeElement) {
      activeRangeElement.classList.remove('active');
    }
    if (!rangeElement.classList.contains('active')) {
      rangeElement.classList.add('active');
    }
  }

  /*
   * Handles filter click of button by setting the new filter type
   */
  function handleFilterSelect(data) {
    setType(data.type);
  }

  /*
   * Sets type of instance to given type
   */
  function setType(type) {
    self.selectedType = type;
  }

  /*
   * Sets end date of instance to given date
   */
  function setEndDate(date) {
    self.selectedEndDate = date;
  }

  /*
   * Sets start date of instance to given date
   */
  function setStartDate(date) {
    self.selectedStartDate = date;
  }
};
