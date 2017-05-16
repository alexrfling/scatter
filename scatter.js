/*
             +------------+----------------------------------------------------+
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
marginYChart |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             +------------+----------------------------------------------------+
marginYLabel |            |                                                    |
             +------------+----------------------------------------------------+
              marginXLabel                      marginXChart
*/
class Scatter extends Widget {

    constructor (id) {
        super(id, {
            SVG_MARGINS: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            },
            ANIM_DURATION: 1000,
            DEFAULT_HEIGHT: 400,
            FONT_SIZE: 10,
            PADDING: 10
        });
    }

    initialize (data, options) {
        var me = this;
        options = (options || {});

        me.data = data;
        me.xKey = options.xKey;
        me.yKey = options.yKey;
        me.rKey = options.rKey;
        me.fKeyCategorical = options.fKeyCategorical;
        me.fKeyContinuous = options.fKeyContinuous;
        me.colorsCategorical = (options.colorsCategorical || [
            '#109618', '#3366cc', '#dc3912', '#ff9900', '#990099',
            '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
            '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300',
            '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
        ]);
        me.loColor = (options.loColor || '#3366cc');
        me.hiColor = (options.hiColor || '#109618');
        me.colorsContinuous = (options.colorsContinuous || me.interpolateColors(me.loColor, 'lightgrey', me.hiColor, 256));
        me.categorical = options.categorical;
        me.minRadius = (options.minRadius || 4);
        me.maxRadius = (options.maxRadius || 16);
        me.skipTransitions = options.skipTransitions;
        me.tooltipFormat = (options.tooltipFormat || d3.format('.7'));
        me.scaleOverUnder = (options.scaleOverUnder || Math.sqrt(2) * Math.sqrt(Number.MAX_VALUE));
        me.setLimits();

        // clear out DOM elements inside parent
        me.destroy();

        // holds all HTML and SVG elements
        me.container = new SVGContainer(
            me.id,
            'd3-helpers-widget-div',
            'd3-helpers-widget-svg',
            function () { me.resize.call(me); },
            me.options.SVG_MARGINS,
            (options.height || me.options.DEFAULT_HEIGHT)
        );

        me.scaleX = d3.scaleLinear();
        me.scaleY = d3.scaleLinear();
        me.scaleR = d3.scaleLinear();
        me.scaleFillCategorical = d3.scaleOrdinal();
        me.scaleFillContinuous = d3.scaleQuantize();

        // initalize scales
        me.setScaleDomains();
        me.setScaleRanges();

        me.axisX = new Axis(
            me.container.svg,
            'axis',
            me.scaleX,
            me.options.FONT_SIZE,
            'bottom'
        );
        me.axisY = new Axis(
            me.container.svg,
            'axis',
            me.scaleY,
            me.options.FONT_SIZE,
            'left'
        );

        me.axisX.axis.tickFormat(d3.format('.1'));
        me.axisY.axis.tickFormat(d3.format('.1'));

        me.points = new ElementCollection(
            me.container.svg,
            'points',
            'circle',
            {
                cx: function (d) { return me.scaleX(d[me.xKey]); },
                cy: function (d) { return me.scaleY(d[me.yKey]); },
                r: function (d) { return me.scaleR(d[me.rKey]); },
                fill: function (d) { return (me.categorical ? me.scaleFillCategorical(d[me.fKeyCategorical]) : me.scaleFillContinuous(d[me.fKeyContinuous])); },
                duration: function (d) {
                    var dx = d[me.xKey] - me.xMid;
                    var dy = d[me.yKey] - me.yMid;
                    dx = dx / me.scaleOverUnder;
                    dy = dy / me.scaleOverUnder;

                    return 500 + Math.sqrt(dx * dx + dy * dy) / me.sMax * me.options.ANIM_DURATION;
                }
            },
            me.data,
            me.key
        );

        me.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('w')
            .offset([0, -10])
            .html(function (d) {
                var fKey = (me.categorical ? me.fKeyCategorical : me.fKeyContinuous);
                var fVal = (typeof d[fKey] === 'number' ? me.tooltipFormat(d[fKey]) : d[fKey]);

                return '<table>' +
                    '<tr><td>' + me.xKey + ' (x)</td><td>' + me.tooltipFormat(d[me.xKey]) + '</td></tr>' +
                    '<tr><td>' + me.yKey + ' (y)</td><td>' + me.tooltipFormat(d[me.yKey]) + '</td></tr>' +
                    '<tr><td>' + me.rKey + ' (size)</td><td>' + me.tooltipFormat(d[me.rKey]) + '</td></tr>' +
                    '<tr><td>' + fKey + ' (color)</td><td>' + fVal + '</td></tr>' +
                    '</table>';
            });

        // invoke tooltip
        me.container.svg
            .call(me.tooltip);

        me.attachPointEventListeners();

        me.setMargins();
        me.setAnchors();
        me.setScaleRangesPositional();
        me.positionAllElements();

        me.axisX.updateVis();
        me.axisY.updateVis();

        me.points.selection
            .attr('cx', me.points.attrs.cx)
            .attr('cy', me.points.attrs.cy)
            .style('opacity', 0.25);

        if (me.skipTransitions) {
            me.points.updateVis('r', 'fill');
        } else {
            me.points.selection
                .transition()
                .duration(me.points.attrs.duration)
                .attr('r', me.points.attrs.r)
                .attr('fill', me.points.attrs.fill);
        }
    }

    setXLimits () {
        var me = this;

        me.xMin = d3.min(me.data, function (d) { return d[me.xKey]; });
        me.xMax = d3.max(me.data, function (d) { return d[me.xKey]; });
        me.xMid = me.xMin + 0.5 * (me.xMax - me.xMin);
    }

    setYLimits () {
        var me = this;

        me.yMin = d3.min(me.data, function (d) { return d[me.yKey]; });
        me.yMax = d3.max(me.data, function (d) { return d[me.yKey]; });
        me.yMid = me.yMin + 0.5 * (me.yMax - me.yMin);
    }

    setRLimits () {
        var me = this;

        me.rMin = d3.min(me.data, function (d) { return d[me.rKey]; });
        me.rMax = d3.max(me.data, function (d) { return d[me.rKey]; });
    }

    setSMax () {
        var me = this;

        me.sMax = d3.max(me.data, function (d) {
            var dx = d[me.xKey] - me.xMid;
            var dy = d[me.yKey] - me.yMid;
            dx = dx / me.scaleOverUnder;
            dy = dy / me.scaleOverUnder;

            return Math.sqrt(dx * dx + dy * dy);
        });
    }

    setFCategoricalDomain () {
        var me = this;

        me.fDomain = [];
        for (var j = 0; j < me.data.length; j++) {
            var value = me.data[j][me.fKeyCategorical];

            if (!me.fDomain.includes(value)) {
                me.fDomain.push(value);
            }
        }
    }

    setFContinuousLimits () {
        var me = this;

        me.fMin = d3.min(me.data, function (d) { return d[me.fKeyContinuous]; });
        me.fMax = d3.max(me.data, function (d) { return d[me.fKeyContinuous]; });
    }

    setLimits () {
        var me = this;

        me.setXLimits();
        me.setYLimits();
        me.setRLimits();
        me.setSMax();

        if (me.categorical) {
            me.setFCategoricalDomain();
        } else {
            me.setFContinuousLimits();
        }
    }

    setMargins () {
        var me = this;

        me.marginXLabel = 40;
        me.marginYLabel = me.options.FONT_SIZE;
        me.marginXChart = me.container.svgWidth - me.marginXLabel;
        me.marginYChart = me.container.svgHeight - me.marginYLabel;
    }

    setAnchors () {
        var me = this;

        me.points.anchor = [me.marginXLabel, me.options.PADDING];
        me.axisX.anchor = [me.marginXLabel, me.container.svgHeight - me.marginYLabel];
        me.axisY.anchor = [me.marginXLabel, me.options.PADDING];
    }

    setScaleDomainsHorizontal () {
        var me = this;

        me.scaleX.domain([me.xMin, me.xMax]);
    }

    setScaleDomainsVertical () {
        var me = this;

        me.scaleY.domain([me.yMin, me.yMax]);
    }

    setScaleDomainsSize () {
        var me = this;

        me.scaleR.domain([me.rMin, me.rMax]);
    }

    setScaleDomainsFill () {
        var me = this;

        if (me.categorical) {
            me.scaleFillCategorical.domain(me.fDomain);
        } else {
            me.scaleFillContinuous.domain([me.fMin, me.fMax]);
        }
    }

    setScaleDomains () {
        var me = this;

        me.setScaleDomainsHorizontal();
        me.setScaleDomainsVertical();
        me.setScaleDomainsSize();
        me.setScaleDomainsFill();
    }

    setScaleRangesPositional () {
        var me = this;

        me.scaleX.range([0, me.container.svgWidth - me.marginXLabel - me.options.PADDING]);
        me.scaleY.range([me.container.svgHeight - me.marginYLabel - me.options.PADDING, 0]);
    }

    setScaleRangesSize () {
        var me = this;

        me.scaleR.range([me.minRadius, me.maxRadius]);
    }

    setScaleRangesFill () {
        var me = this;

        me.scaleFillCategorical.range(me.colorsCategorical);
        me.scaleFillContinuous.range(me.colorsContinuous);
    }

    setScaleRanges () {
        var me = this;

        me.setScaleRangesPositional();
        me.setScaleRangesFill();
        me.setScaleRangesSize();
    }

    positionAllElements () {
        var me = this;

        me.points.position();
        me.axisX.position();
        me.axisY.position();
    }

    updateVisAllElements () {
        var me = this;

        me.points.updateVis('cx', 'cy');
        me.axisX.updateVis();
        me.axisY.updateVis();
    }

    attachPointEventListeners () {
        var me = this;

        me.points.selection
            .on('mouseover', function (d) {
                d3.select(this)
                    .style('opacity', 1);
                me.tooltip.show(d);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .style('opacity', 0.25);
                me.tooltip.hide();
            });
    }

    resize (height) {
        var me = this;
        me.container.resize(height);

        me.setMargins();
        me.setAnchors();
        me.setScaleRangesPositional();
        me.positionAllElements();
        me.updateVisAllElements();
    }

    updateColors(loColor, hiColor) {
        var me = this;
        me.loColor = (loColor ? loColor : me.loColor);
        me.hiColor = (hiColor ? hiColor : me.hiColor);
        me.colorsContinuous = me.interpolateColors(me.loColor, 'lightgrey', me.hiColor, 256);

        // scale updates
        me.setScaleRangesFill();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateColorScaling (categorical) {
        var me = this;
        me.categorical = (categorical === undefined ? me.categorical : categorical);
        me.setLimits();

        // scale updates
        me.setScaleDomainsFill();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateXKey (xKey) {
        var me = this;
        me.xKey = (xKey ? xKey : me.xKey);
        me.setXLimits();
        me.setSMax();

        // scale updates
        me.setScaleDomainsHorizontal();

        // visual updates
        me.updateVisAttr('cx');
    }

    updateYKey (yKey) {
        var me = this;
        me.yKey = (yKey ? yKey : me.yKey);
        me.setYLimits();
        me.setSMax();

        // scale updates
        me.setScaleDomainsVertical();

        // visual updates
        me.updateVisAttr('cy');
    }

    updateRKey (rKey) {
        var me = this;
        me.rKey = (rKey ? rKey : me.rKey);
        me.setRLimits();

        // scale updates
        me.setScaleDomainsSize();

        // visual updates
        me.updateVisAttr('r');
    }

    updateFKeyCategorical (fKeyCategorical) {
        var me = this;
        me.fKeyCategorical = (fKeyCategorical ? fKeyCategorical : me.fKeyCategorical);
        if (me.categorical) {
            me.setFCategoricalDomain();
        }

        // scale updates
        me.setScaleDomainsFill();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateFKeyContinuous (fKeyContinuous) {
        var me = this;
        me.fKeyContinuous = (fKeyContinuous ? fKeyContinuous : me.fKeyContinuous);
        if (!me.categorical) {
            me.setFContinuousLimits();
        }

        // scale updates
        me.setScaleDomainsFill();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateVisAttr (attribute) {
        var me = this;

        if (me.skipTransitions) {

            // update axis if necessary
            if (attribute === 'cx') {
                me.axisX.updateVis();
            } else if (attribute === 'cy') {
                me.axisY.updateVis();
            }

            // update attribute
            me.points.updateVis(attribute);
        } else {

            // update axis if necessary
            if (attribute === 'cx') {
                me.axisX.updateVis(me.options.ANIM_DURATION);
            } else if (attribute === 'cy') {
                me.axisY.updateVis(me.options.ANIM_DURATION);
            }

            // update attribute
            me.points.selection
                .transition()
                .duration(me.points.attrs.duration)
                .attr(attribute, me.points.attrs[attribute]);
        }
    }

    updateData (data, xKey, yKey, rKey, fKeyCategorical, fKeyContinuous) {
        var me = this;
        me.data = data;
        me.xKey = (xKey ? xKey : me.xKey);
        me.yKey = (yKey ? yKey : me.yKey);
        me.rKey = (rKey ? rKey : me.rKey);
        me.fKeyCategorical = (fKeyCategorical ? fKeyCategorical : me.fKeyCategorical);
        me.fKeyContinuous = (fKeyContinuous ? fKeyContinuous : me.fKeyContinuous);
        me.setLimits();

        // scale updates
        me.setScaleDomains();

        // visual updates
        if (me.skipTransitions) {
            me.axisX.updateVis();
            me.axisY.updateVis();
            me.points.updateData(me.data, me.key);
            me.points.updateVis('cx', 'cy', 'r', 'fill');
            me.points.selection
                .style('opacity', 0.25);
        } else {
            me.axisX.updateVis(me.options.ANIM_DURATION);
            me.axisY.updateVis(me.options.ANIM_DURATION);

            // add temporary classes to separate old bars from bars to be kept
            me.points.group
                .selectAll('circle')
                .data(me.data, me.key)
                .exit()
                .attr('class', 'remove');
            me.points.group
                .selectAll('circle')
                .filter(function () { return (this.className.baseVal !== 'remove'); })
                .attr('class', 'keep');

            // add new points, invisible, with same class as points to be kept
            me.points.group
                .selectAll('circle')
                .data(me.data, me.key)
                .enter()
                .append('circle')
                .attr('class', 'keep')
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .style('opacity', 0.25);

            // transition all points (old points removed)
            me.points.group
                .selectAll('circle.remove')
                .transition()
                .duration(me.points.attrs.duration)
                .attr('r', 0)
                .remove();
            me.points.group
                .selectAll('circle.keep')
                .transition()
                .duration(me.points.attrs.duration)
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .attr('r', me.points.attrs.r)
                .attr('fill', me.points.attrs.fill);

            // update point selection
            me.points.selection = me.points.group
                .selectAll('circle.keep')
                .classed('keep', false);
        }

        me.attachPointEventListeners();
    }
}
