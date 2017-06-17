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
<a name='constructorScatter' href='#constructorScatter'>#</a> new __Scatter__(_id_)

Constructs a new Scatter widget with parent element set to the HTML element in the DOM with id _id_. Note that this does not modify the DOM.

### Methods
<a name='initialize' href='#initialize'>#</a> _chart_.__initialize__(_data_, _xKey_, _yKey_[, _options_])

Binds _data_ to _chart_ and renders a scatter plot inside the widget's parent element.
* _data_ - an array of objects, each of which will have a point in the scatter plot, with its x-position determined by its `xKey` field and its y-position determined by its `yKey` field
* _xKey_ - a key for which each object in _data_ has a number. This will be used to determine the x-position of each point in the scatter plot
* _yKey_ - a key for which each object in _data_ has a number. This will be used to determine the y-position of each point in the scatter plot
* _options_ - an object specifying various attributes of the rendering and widget
  * __width__ - the width, in pixels, of the widget. If falsy, the width of the widget will be the same as the width of the widget's parent element (default: `undefined`)
  * __height__ - the height, in pixels, of the widget (default: `400`)
  * __rKey__ - a key for which each object in _data_ has a number. If truthy, this will be used to determine the size of each point in the scatter plot (default: `null`)
  * __fKeyCategorical__ - a key for which each object in _data_ has a value. If this and __categorical__ are truthy, this will be used to determine the color of each point in the scatter plot (default: `null`)
  * __fKeyContinuous__ - a key for which each object in _data_ has a number. If this is truthy and __categorical__ is falsy, this will be used to determine the color of each point in the scatter plot (default: `null`)
  * __loColor__ - the color of points that have a low value for __fKeyContinuous__ (default: `'#3366cc'`)
  * __mdColor__ - the color of points that have a mid-range value for __fKeyContinuous__ (default: `'darkgrey'`)
  * __hiColor__ - the color of points that have a high value for __fKeyContinuous__ (default: `'#109618'`)
  * __numColors__ - the number of colors in the interpolation of __loColor__, __mdColor__, and __hiColor__ (default: `256`)
  * __colorsContinuous__ - an array of colors to be used if __categorical__ is falsy (default: an interpolation from __loColor__ to __mdColor__ to __hiColor__ consisting of __numColors__ strings)
  * __colorsCategorical__ - an array of colors to be used if __categorical__ is truthy (default: `[
      '#109618', '#3366cc', '#dc3912', '#ff9900', '#990099',
      '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
      '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300',
      '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
  ]`)
  * __defaultColor__ - the color of each point if __fKeyCategorical__ is falsy and __categorical__ is truthy, or if both __fKeyContinuous__ and __categorical__ are falsy (default: `'black'`)
  * __categorical__ - if truthy, the color of the points is determined by __fKeyCategorical__, otherwise it is determined by __fKeyContinuous__
  * __minRadius__ - if __rKey__ is truthy, this is the radius of the point(s) having the smallest value for __rKey__ (default: `4`)
  * __maxRadius__ - if __rKey__ is truthy, this is the radius of the point(s) having the largest value for __rKey__ (default: `16`)
  * __defaultRadius__ - if __rKey__ is falsy, this is the radius of each point (default: `8`)
  * __defaultOpacity__ - the opacity of each point (default: `0.25`)
  * __tooltipFormat__ - the function used to format numerical values in the tooltip (default: `d3.format('.7')`)
  * __noTransition__ - if truthy, the widget will render/update without transitions. Otherwise, the widget will render/update with transitions (default: `false`)

<a name='resize' href='#resize'>#</a> _chart_.__resize__([_width_[, _height_]])

If _width_ is truthy, sets the width (in pixels) of the widget to be _width_, otherwise the width of the widget doesn't change.  
If _height_ is truthy, sets the height (in pixels) of the widget to be _height_, otherwise the height of the widget doesn't change.

<a name='updateColors' href='#updateColors'>#</a> _chart_.__updateColors__([_loColor_[, _mdColor_[, _posColor_[, _numColors_]]]])

If _loColor_ is truthy, updates the color of points with low values to be _loColor_. Otherwise, the color of points with low values doesn't change.  
If _mdColor_ is truthy, updates the color of points with mid-range values to be _mdColor_. Otherwise, the color of points with mid-range values doesn't change.  
If _hiColor_ is truthy, updates the color of points with high values to be _hiColor_. Otherwise, the color of points with high values doesn't change.  
If _numColors_ is truthy, updates the number of colors in the interpolation of _loColor_, _mdColor_, and _hiColor_. Otherwise, the number of colors doesn't change.

<a name='updateColorScaling' href='#updateColorScaling'>#</a> _chart_.__updateColorScaling__([_categorical_])

If _categorical_ is truthy, updates the color of points to be determined by _fKeyCategorical_. If _categorical_ is falsy and not `undefined`, updates the color of points to be determined by _fKeyContinuous_. If _categorical_ is `undefined`, the color of points doesn't change.

<a name='updateXKey' href='#updateXKey'>#</a> _chart_.__updateXKey__([_key_])

If _key_ is truthy, updates the x-position of points to be determined by _key_. Otherwise, the x-position of points doesn't change.

<a name='updateYKey' href='#updateYKey'>#</a> _chart_.__updateYKey__([_key_])

If _key_ is truthy, updates the y-position of points to be determined by _key_. Otherwise, the y-position of points doesn't change.

<a name='updateRKey' href='#updateRKey'>#</a> _chart_.__updateRKey__([_key_])

Updates the size of points to be determined by _key_.

<a name='updateFKeyCategorical' href='#updateFKeyCategorical'>#</a> _chart_.__updateFKeyCategorical__([_key_])

Updates the color of points to be determined by _key_, if _categorical_ is truthy.

<a name='updateFKeyContinuous' href='#updateFKeyContinuous'>#</a> _chart_.__updateFKeyContinuous__([_key_])

Updates the color of points to be determined by _key_, if _categorical_ is falsy.

<a name='updateData' href='#updateData'>#</a> _chart_.__updateData__(_data_, _xKey_, _yKey_[, _options_])

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
