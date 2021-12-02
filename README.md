Contains chart plugins for Origam based on the chart.js library.

## Radar Chart Plugin

Properties that can be read from the model (defined in a widget):

- `FilterField` name of a boolean field which will be used to filter the records displayed in the chart
- `SeriesLabelField` name of the field used as the series label
- `LabelFormat` format for the series labels in case the SeriesLabelField is of the Date type. The format is the C# date time format, for example dd.MM.yyyy HH:mm
- `SeriesValueFields` names of the fields to be shown on the chart axes separated by ";" for example: Result1;Result2;Result3;Result4;Result5
- `StepSize` size of the axes increment

## Line Chart Plugin

Properties that can be read from the model (defined in a widget):

- `FilterField` name of a boolean field which will be used to filter the records displayed in the chart
- `SeriesLabelField` name of the field used as the series label
- `LabelFormat` format for the series labels in case the SeriesLabelField is of the Date type. The format is the C# date time format, for example dd.MM.yyyy HH:mm
- `SeriesValueFields` names of the fields to be shown on the chart axes separated by ";" for example: Result1;Result2;Result3;Result4;Result5
- `StepSize` size of the axes increment
-  `lineColorName` A color of line on the chart axes separated by ";" for example: #ffffff;#ff00ff