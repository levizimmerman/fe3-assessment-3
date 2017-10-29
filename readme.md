# Health Data from my iPhone
[Health app][u_app_health] from Apple is an iOS application that can measure different kinds activities of its OS user.

## Background
For this project I wanted to use personal data because I was curious if I could get some new insights about myself. Following the steps mentioned in the [workflow][u_workflow] I managed to display the data in four different bar charts:
1. Step counts per day.
2. Flights climbed per day.
3. Distance walked or ran per day.
4. Sleep cycle per day.

All the chart are displayed on the same x scale, namely time. Time was the only property that all data entries had in common. So when hovering over the chart with your cursor, more detailed information will be displayed. Detailed information includes the exact value of the bar and the difference (%) it has with the mean.

### Workflow
These were the steps taken in general to create the data visualization:
1. Export data - From the [Health app][u_app_health] I have exported a XML file.
2. Import data - Using [d3.xml][u_d3_xml] to load the data and add a mapping function to its callback.
3. Clean data - Filters all `<Record>` from XML. For each `<Record>` attributes are selected and parsed.
4. Transform data - Maps filtered data to a workable object.
5. Create axis - Create y scale based on min and max values, and x scale based on date range (week or month).
6. Create charts - Draws charts (bars) based on filtered and transformed data.
7. Add transitions - Animate scale and bars when data is filtered or loaded.
8. Add events - Events listeners are added to chart elements to add interaction to the visualization.

## Data
Within the [XML][u_xml] file I only select the `<Record>` elements. Then for each `<Record>` I filter out the attribute values I need.

### Cleaning data
I have used the following code to clean the XML and transform it to a JSON object:
```javascript
data = [].map.call(data.querySelectorAll('Record'), function (record) {
  return {
    type: parseType(record.getAttribute('type')),
    value: parseValue(record.getAttribute('value')),
    startDate: parseTime(record.getAttribute('startDate')),
    endDate: parseTime(record.getAttribute('endDate')),
    creationDate: parseTime(record.getAttribute('creationDate'))
  }
});
```
There four types of record found the XML file:
1.
2.
3.
4.

#### Step count data
```xml
<Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone van Levi" sourceVersion="9.2" device="&lt;&lt;HKDevice: 0x174484920&gt;, name:iPhone, manufacturer:Apple, model:iPhone, hardware:iPhone8,1, software:9.2&gt;" unit="count" creationDate="2016-01-13 19:57:52 +0200" startDate="2016-01-13 19:08:24 +0200" endDate="2016-01-13 19:09:26 +0200" value="31"/>
```

#### Distance walked or ran data
```xml
<Record type="HKQuantityTypeIdentifierDistanceWalkingRunning" sourceName="iPhone van Levi" sourceVersion="9.2" device="&lt;&lt;HKDevice: 0x17089eaf0&gt;, name:iPhone, manufacturer:Apple, model:iPhone, hardware:iPhone8,1, software:9.2&gt;" unit="km" creationDate="2016-01-13 19:57:52 +0200" startDate="2016-01-13 19:08:24 +0200" endDate="2016-01-13 19:09:26 +0200" value="0.02432"/>
```

#### Flights climbed data
```xml
<Record type="HKQuantityTypeIdentifierFlightsClimbed" sourceName="iPhone van Levi" sourceVersion="9.2" device="&lt;&lt;HKDevice: 0x174893150&gt;, name:iPhone, manufacturer:Apple, model:iPhone, hardware:iPhone8,1, software:9.2&gt;" unit="count" creationDate="2016-01-13 19:57:52 +0200" startDate="2016-01-13 19:29:43 +0200" endDate="2016-01-13 19:29:43 +0200" value="2"/>
```

#### Sleep analysis data
```xml
<Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Clock" sourceVersion="50" device="&lt;&lt;HKDevice: 0x174c8cf30&gt;, name:iPhone, manufacturer:Apple, model:iPhone, hardware:iPhone8,1, software:10.0.2&gt;" creationDate="2016-10-17 07:30:22 +0200" startDate="2016-10-17 00:30:00 +0200" endDate="2016-10-17 07:30:22 +0200" value="HKCategoryValueSleepAnalysisInBed">
 <MetadataEntry key="_HKPrivateSleepAlarmUserWakeTime" value="2016-10-18 05:30:00 +0000"/>
 <MetadataEntry key="_HKPrivateSleepAlarmUserSetBedtime" value="2016-10-15 22:30:00 +0000"/>
 <MetadataEntry key="HKTimeZone" value="Europe/Amsterdam"/>
</Record>
```

## Dependencies
This project has a couple of dependencies listed below. These dependencies are mandatory to get the code running without bugs. There are other includes in this project, but are not required to get the code working.

### External
* [MomentJS][u_momentjs](v2.19.1) - Parse, validate, manipulate, and display dates and times in JavaScript.
* [D3][u_d3](v4) - D3.js is a JavaScript library for manipulating documents based on data.

### Internal (custom libraries)
* [Events.js][u_events] - Adds pub-sub pattern possibilities to your code.
* [Utils.js][u_utils] - Adds a bundle of functions to do general data mutations and get information.
* [BarChart.js][u_barchart] - Creates a bar chart with given parameters.
* [SleepCycle.js][u_sleepcycle] - Creates a sleep cycle bar chart with given parameters.


## Features

## License

[u_momentjs]: https://momentjs.com/
[u_d3]: https://d3js.org/
[u_events]: https://github.com/levizimmerman/fe3-assessment-3/blob/master/shared/events.js
[u_utils]: https://github.com/levizimmerman/fe3-assessment-3/blob/master/shared/utils.js
[u_barchart]: https://github.com/levizimmerman/fe3-assessment-3/blob/master/graphs/BarChart.js
[u_sleepcycle]: https://github.com/levizimmerman/fe3-assessment-3/blob/master/graphs/SleepCycle.js
[u_app_health]: https://www.apple.com/ios/health/
[u_workflow]: https://github.com/levizimmerman/fe3-assessment-3#workflow
[u_d3_xml]: https://github.com/d3/d3-request/blob/master/README.md#xml
[u_xml]: https://github.com/levizimmerman/fe3-assessment-3/blob/master/index.xml
