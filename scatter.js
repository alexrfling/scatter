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

        me.xScale = d3.scaleLinear();
        me.yScale = d3.scaleLinear();
        me.rScale = d3.scaleLinear();
        me.scaleFillCategorical = d3.scaleOrdinal();
        me.scaleFillContinuous = d3.scaleQuantize();

        // initalize scales
        me.scaleDomainsSetup();
        me.scaleRangesSetup();

        me.xAxis = new Axis(
            me.container.svg,
            'axis',
            me.xScale,
            me.options.FONT_SIZE,
            'bottom'
        );
        me.yAxis = new Axis(
            me.container.svg,
            'axis',
            me.yScale,
            me.options.FONT_SIZE,
            'left'
        );

        me.points = new ElementCollection(
            me.container.svg,
            'points',
            'circle',
            {
                cx: function (d) { return me.xScale(d[me.xKey]); },
                cy: function (d) { return me.yScale(d[me.yKey]); },
                r: function (d) { return me.rScale(d[me.rKey]); },
                fill: function (d) { return (me.categorical ? me.scaleFillCategorical(d[me.fKeyCategorical]) : me.scaleFillContinuous(d[me.fKeyContinuous])); },
                duration: function (d) {
                    var dx = d[me.xKey] - me.xMid;
                    var dy = d[me.yKey] - me.yMid;

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
                return '<table>' +
                    '<tr><td>' + me.xKey + '</td><td>' + d[me.xKey] + '</td></tr>' +
                    '<tr><td>' + me.yKey + '</td><td>' + d[me.yKey] + '</td></tr>' +
                    '<tr><td>' + me.fKeyCategorical + '</td><td>' + d[me.fKeyCategorical] + '</td></tr>' +
                    '</table>';
            });

        // invoke tooltip
        me.container.svg
            .call(me.tooltip);

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
            })

        me.marginsSetup();
        me.anchorsSetup();
        me.scaleRangesPositionalSetup();
        me.positionAllElements();

        me.xAxis.updateVis();
        me.yAxis.updateVis();

        me.points.selection
            .attr('cx', me.points.attrs.cx)
            .attr('cy', me.points.attrs.cy)
            .style('opacity', 0.25);

        if (me.skipTransitions) {
            me.points.updateVis('r', 'fill');
        } else {
            me.points.selection
                .transition()
                .duration(me.options.ANIM_DURATION)
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

    marginsSetup () {
        var me = this;

        me.marginXLabel = 30;
        me.marginYLabel = me.options.FONT_SIZE;
        me.marginXChart = me.container.svgWidth - me.marginXLabel;
        me.marginYChart = me.container.svgHeight - me.marginYLabel;
    }

    anchorsSetup () {
        var me = this;

        me.points.anchor = [me.marginXLabel, me.options.PADDING];
        me.xAxis.anchor = [me.marginXLabel, me.container.svgHeight - me.marginYLabel];
        me.yAxis.anchor = [me.marginXLabel, me.options.PADDING];
    }

    scaleDomainsHorizontalSetup () {
        var me = this;

        me.xScale.domain([me.xMin - 1, me.xMax + 1]);
    }

    scaleDomainsVerticalSetup () {
        var me = this;

        me.yScale.domain([me.yMin - 1, me.yMax + 1]);
    }

    scaleDomainsSizeSetup () {
        var me = this;

        me.rScale.domain([me.rMin, me.rMax]);
    }

    scaleDomainFillSetup () {
        var me = this;

        if (me.categorical) {
            me.scaleFillCategorical.domain(me.fDomain);
        } else {
            me.scaleFillContinuous.domain([me.fMin, me.fMax]);
        }
    }

    scaleDomainsSetup () {
        var me = this;

        me.scaleDomainsHorizontalSetup();
        me.scaleDomainsVerticalSetup();
        me.scaleDomainsSizeSetup();
        me.scaleDomainFillSetup();
    }

    scaleRangesPositionalSetup () {
        var me = this;

        me.xScale.range([0, me.container.svgWidth - me.marginXLabel - me.options.PADDING]);
        me.yScale.range([me.container.svgHeight - me.marginYLabel - me.options.PADDING, 0]);
    }

    scaleRangeSizeSetup () {
        var me = this;

        me.rScale.range([me.minRadius, me.maxRadius]);
    }

    scaleRangeFillSetup () {
        var me = this;

        me.scaleFillCategorical.range(me.colorsCategorical);
        me.scaleFillContinuous.range(me.colorsContinuous);
    }

    scaleRangesSetup () {
        var me = this;

        me.scaleRangesPositionalSetup();
        me.scaleRangeFillSetup();
        me.scaleRangeSizeSetup();
    }

    positionAllElements () {
        var me = this;

        me.points.position();
        me.xAxis.position();
        me.yAxis.position();
    }

    updateVisAllElements () {
        var me = this;

        me.points.updateVis('cx', 'cy');
        me.xAxis.updateVis();
        me.yAxis.updateVis();
    }

    resize (height) {
        var me = this;
        me.container.resize(height);

        me.marginsSetup();
        me.anchorsSetup();
        me.scaleRangesPositionalSetup();
        me.positionAllElements();
        me.updateVisAllElements();
    }

    updateColors(loColor, hiColor) {
        var me = this;
        me.loColor = (loColor ? loColor : me.loColor);
        me.hiColor = (hiColor ? hiColor : me.hiColor);
        me.colorsContinuous = me.interpolateColors(me.loColor, 'lightgrey', me.hiColor, 256);

        // scale updates
        me.scaleRangeFillSetup();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateColorScaling (categorical) {
        var me = this;
        me.categorical = (categorical === undefined ? me.categorical : categorical);
        me.setLimits();

        // scale updates
        me.scaleDomainFillSetup();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateXKey (xKey) {
        var me = this;
        me.xKey = (xKey ? xKey : me.xKey);
        me.setXLimits();
        me.setSMax();

        // scale updates
        me.scaleDomainsHorizontalSetup();

        // visual updates
        me.updateVisAttr('cx');
    }

    updateYKey (yKey) {
        var me = this;
        me.yKey = (yKey ? yKey : me.yKey);
        me.setYLimits();
        me.setSMax();

        // scale updates
        me.scaleDomainsVerticalSetup();

        // visual updates
        me.updateVisAttr('cy');
    }

    updateRKey (rKey) {
        var me = this;
        me.rKey = (rKey ? rKey : me.rKey);
        me.setRLimits();

        // scale updates
        me.scaleDomainsSizeSetup();

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
        me.scaleDomainFillSetup();

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
        me.scaleDomainFillSetup();

        // visual updates
        me.updateVisAttr('fill');
    }

    updateVisAttr (attribute) {
        var me = this;

        if (me.skipTransitions) {

            // update axis if necessary
            if (attribute === 'cx') {
                me.xAxis.updateVis();
            } else if (attribute === 'cy') {
                me.yAxis.updateVis();
            }

            // update attribute
            me.points.updateVis(attribute);
        } else {

            // update axis if necessary
            if (attribute === 'cx') {
                me.xAxis.updateVis(me.options.ANIM_DURATION);
            } else if (attribute === 'cy') {
                me.yAxis.updateVis(me.options.ANIM_DURATION);
            }

            // update attribute
            me.points.selection
                .transition()
                .duration(me.points.attrs.duration)
                .attr(attribute, me.points.attrs[attribute]);
        }
    }

    updateData (data) {
        var me = this;
        me.data = data;
        me.setLimits();

        // scale updates
        me.scaleDomainsSetup();

        // visual updates
        if (me.skipTransitions) {
            me.xAxis.updateVis();
            me.yAxis.updateVis();
            me.points.selection
                .data(me.data, me.key)
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .attr('r', me.points.attrs.r)
                .attr('fill', me.points.attrs.fill);
        } else {
            me.xAxis.updateVis(me.options.ANIM_DURATION);
            me.yAxis.updateVis(me.options.ANIM_DURATION);
            me.points.selection
                .data(me.data, me.key)
                .transition()
                .duration(me.points.attrs.duration)
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .attr('r', me.points.attrs.r)
                .attr('fill', me.points.attrs.fill);
        }
    }
}
