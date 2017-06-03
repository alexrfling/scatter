# scatter
Interactive scatter plot with d3.js

![alt text](https://raw.githubusercontent.com/alexrfling/scatter/master/img/example.png)

## Overview
`Scatter` takes the id of an HTML element, an array of data, and optional parameters, and generates an interactive scatter plot of the data appended to the HTML element.

## Boilerplate
In the head of your HTML document, include:
```html
<script src='d3-helpers/d3/d3.min.js'></script>
<script src='d3-helpers/d3-tip/index.js'></script>
<script src='d3-helpers/graphicalElement.js'></script>
<script src='d3-helpers/axis.js'></script>
<script src='d3-helpers/elementCollection.js'></script>
<script src='d3-helpers/svgContainer.js'></script>
<script src='d3-helpers/widget.js'></script>
<script src='scatter.js'></script>
<link rel='stylesheet' type='text/css' href='d3-helpers/d3-tip/examples/example-styles.css'>
<link rel='stylesheet' type='text/css' href='d3-helpers/widget.css'>
```

## Usage

### Constructor
new **Scatter**(_id_)  
Constructs a new Scatter widget with parent element set to the HTML element in the DOM with id _id_. Note that this does not modify the DOM.

### Methods
<a name='initialize' href='#initialize'>#</a> _chart_.**initialize**(_data_, _xKey_, _yKey_[, _options_])

Binds _data_ to _chart_ and renders a scatter plot inside the widget's parent element.
* _data_ - an array of objects
* _xKey_ - a string representing a key for which each object in _data_ has a number. This will be used to determine the x-position of each point in the scatter plot
* _yKey_ - a string representing a key for which each object in _data_ has a number. This will be used to determine the y-position of each point in the scatter plot
* _options_ - an object specifying various attributes of the rendering and widget
  * **width** - the width, in pixels, of the widget. If falsy, the width of the widget will be the same as the width of the widget's parent element
  * **height** - the height, in pixels, of the widget (default: `400`)
  * **rKey** - a string representing a key for which each object in _data_ has a number. This will be used to determine the size of each point in the scatter plot
  * **fKeyCategorical** - a string representing a key for which each object in _data_ has a value. If **categorical** is truthy, this will be used to determine the color of each point in the scatter plot
  * **fKeyContinuous** - a string representing a key for which each object in _data_ has a number. If **categorical** is falsy, this will be used to determine the color of each point in the scatter plot
  * **colorsCategorical** - an array of strings representing the range of colors to be used if **categorical** is truthy (default: `[
      '#109618', '#3366cc', '#dc3912', '#ff9900', '#990099',
      '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
      '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300',
      '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
  ]`)
  * **loColor** - a string representing the color to be associated with points that have a low value for **fKeyContinuous** (default: `#3366cc`)
  * **mdColor** - a string representing the color to be associated with points that have a mid-range value for **fKeyContinuous** (default: `darkgrey`)
  * **hiColor** - a string representing the color to be associated with points that have a high value for **fKeyContinuous** (default: `#109618`)
  * **numColors** - the number of colors to use in the interpolation of **loColor**, **mdColor**, and **hiColor**
  * **colorsContinuous** - an array of strings representing the range of colors to be used if **categorical** is falsy (default: an interpolation from **loColor** to **mdColor** to **hiColor** consisting of **numColors** strings)
  * **defaultColor** - a string representing the color to be given to all points if **fKeyCategorical** is falsy and **categorical** is truthy, or if both **fKeyContinuous** and **categorical** are falsy
  * **categorical** - if truthy, the colors of the points are determined by **fKeyCategorical**, otherwise they are determined by **fKeyContinuous**
  * **minRadius** - a number representing the smallest radius on a point possible if **rKey** is truthy (default: `4`)
  * **maxRadius** - a number representing the largest radius on a point possible if **rKey** is truthy (default: `16`)
  * **defaultRadius** - a number representing the smallest radius on a point possible if **rKey** is truthy (default: `4`)
  * **defaultOpacity** - a number representing the opacity of each point (default: `0.25`)
  * **noTransition** - if truthy, the widget will render without transitions. Otherwise, the widget will render with transitions
  * **tooltipFormat** - the function used to format numerical values in the tooltip (default: `d3.format('.7')`)

<a name='resize' href='#resize'>#</a> _chart_.**resize**([_width_[, _height_]])

If _width_ is truthy, sets the width (in pixels) of the widget to be _width_, otherwise the width of the widget doesn't change.  
If _height_ is truthy, sets the height (in pixels) of the widget to be _height_, otherwise the height of the widget doesn't change.

<a name='updateSort' href='#updateSort'>#</a> _chart_.**updateSort**([_byName_[, _ascending_]])

If _byName_ is truthy, sorts the bars in the widget by their associated `key` fields. If _byName_ is falsy and not `null`, sorts the bars in the widget by their associated `value` fields. Otherwise if _byName_ is `null`, the sorting of the bars in the widget doesn't change.  
If _ascending_ is truthy, the bars in the widget are sorted in ascending order. If _ascending_ is falsy and not `null`, the bars in the widget are sorted in descending order. Otherwise if _ascending_ is `null`, the ordering of the bars in the widget doesn't change.

<a name='updateColors' href='#updateColors'>#</a> _chart_.**updateColors**([_loColor_[, _mdColor_[, _posColor_[, _numColors_]]]])

If _loColor_ is truthy, updates the color of points with low values to be _loColor_. Otherwise, the color of points with low values doesn't change.  
If _mdColor_ is truthy, updates the color of points with mid-range values to be _mdColor_. Otherwise, the color of points with mid-range values doesn't change.  
If _hiColor_ is truthy, updates the color of points with high values to be _hiColor_. Otherwise, the color of points with high values doesn't change.
If _numColors_ is truthy, updates the number of colors in the interpolation of _loColor_, _mdColor_, and _hiColor_. Otherwise, the number of colors doesn't change.

<a name='updateColorScaling' href='#updateColorScaling'>#</a> _chart_.**updateColorScaling**([_categorical_])

If _categorical_ is truthy, updates the color of points to be determined by _fKeyCategorical_. If _categorical_ is falsy and not `undefined`, updates the color of points to be determined by _fKeyContinuous_. If _categorical_ is `undefined`, the color of points doesn't change.

<a name='updateXKey' href='#updateXKey'>#</a> _chart_.**updateXKey**([_key_])

If _key_ is truthy, updates the x-position of points to be determined by _key_. Otherwise, the x-position of points doesn't change.

<a name='updateYKey' href='#updateYKey'>#</a> _chart_.**updateYKey**([_key_])

If _key_ is truthy, updates the y-position of points to be determined by _key_. Otherwise, the y-position of points doesn't change.

<a name='updateRKey' href='#updateRKey'>#</a> _chart_.**updateRKey**([_key_])

Updates the size of points to be determined by _key_.

<a name='updateFKeyCategorical' href='#updateFKeyCategorical'>#</a> _chart_.**updateFKeyCategorical**([_key_])

Updates the color of points to be determined by _key_, if _categorical_ is truthy.

<a name='updateFKeyContinuous' href='#updateFKeyContinuous'>#</a> _chart_.**updateFKeyContinuous**([_key_])

Updates the color of points to be determined by _key_, if _categorical_ is falsy.

<a name='updateData' href='#updateData'>#</a> _chart_.**updateData**(_data_, _xKey_, _yKey_[, _options_])

Binds _data_ to _chart_ and updates the scatter plot accordingly. _data_, _xKey_, _yKey_, and, if provided, _options_ should be of the same form as described in <a href='#initialize'>initialize</a>.

### Example
HTML element in the DOM:
```html
<div id='parent'></div>
```
Data in JavaScript:
```js
var data = [
    {
        x: 348,
        y: -729
    },
    ...,
    {
        x: 651,
        y: 100
    }
];
```
Create an interactive scatter plot of `data`:
```js
var chart = new Scatter('parent');
chart.initialize(data, 'x', 'y');
```
See <a href='https://github.com/alexrfling/scatter/blob/master/example.html'>example.html</a> for more example usage.
