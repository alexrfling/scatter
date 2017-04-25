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
        me.labelKey = options.labelKey;
        me.colors = options.colors;
        me.random = options.random;
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
        me.scaleFill = d3.scaleQuantize();

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
                r: function () { return (me.random ? 10 : 5); },
                fill: function (d) { return (me.random ? me.scaleFill(Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey])) : me.colors[d[me.labelKey]]); }
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
                    '<tr><td>' + me.labelKey + '</td><td>' + d[me.labelKey] + '</td></tr>' +
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
                    .style('opacity', 0.5);
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
            .style('opacity', 0.5);

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

    setLimits () {
        var me = this;

        me.xMin = d3.min(me.data, function (d) { return d[me.xKey]; });
        me.xMax = d3.max(me.data, function (d) { return d[me.xKey]; });
        me.yMin = d3.min(me.data, function (d) { return d[me.yKey]; });
        me.yMax = d3.max(me.data, function (d) { return d[me.yKey]; });

        if (me.random) {
            me.sMin = d3.min(me.data, function (d) { return Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey]); });
            me.sMax = d3.max(me.data, function (d) { return Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey]); });
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

    scaleDomainFillSetup () {
        var me = this;

        if (me.random) {
            me.scaleFill.domain([me.sMin, me.sMax]);
        }
    }

    scaleDomainsSetup () {
        var me = this;

        me.scaleDomainsHorizontalSetup();
        me.scaleDomainsVerticalSetup();
        me.scaleDomainFillSetup();
    }

    scaleRangesPositionalSetup () {
        var me = this;

        me.xScale.range([0, me.container.svgWidth - me.marginXLabel - me.options.PADDING]);
        me.yScale.range([me.container.svgHeight - me.marginYLabel - me.options.PADDING, 0]);
    }

    scaleRangeFillSetup () {
        var me = this;

        if (me.random) {
            me.scaleFill.range(me.interpolateColors('#3366cc', 'lightgrey', '#109618', 256));
        }
    }

    scaleRangesSetup () {
        var me = this;

        me.scaleRangesPositionalSetup();
        me.scaleRangeFillSetup();
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
                .attr('fill', function (d) {
                    return (me.random ? me.scaleFill(Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey])) : me.points.attrs.fill(d));
                });
        } else {
            me.xAxis.updateVis(me.options.ANIM_DURATION);
            me.yAxis.updateVis(me.options.ANIM_DURATION);
            me.points.selection
                .data(me.data, me.key)
                .transition()
                .duration(function (d) {
                    return (me.random ? Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey]) / me.sMax * me.options.ANIM_DURATION : me.options.ANIM_DURATION);
                })
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .attr('fill', function (d) {
                    return (me.random ? me.scaleFill(Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey])) : me.points.attrs.fill(d));
                });
        }
    }

    updateKeys (xKey, yKey) {
        var me = this;
        me.xKey = (xKey ? xKey : me.xKey);
        me.yKey = (yKey ? yKey : me.yKey);
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
                .attr('fill', function (d) {
                    return (me.random ? me.scaleFill(Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey])) : me.points.attrs.fill(d));
                });
        } else {
            me.xAxis.updateVis(me.options.ANIM_DURATION);
            me.yAxis.updateVis(me.options.ANIM_DURATION);
            me.points.selection
                .data(me.data, me.key)
                .transition()
                .duration(function (d) {
                    return (me.random ? Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey]) / me.sMax * me.options.ANIM_DURATION : me.options.ANIM_DURATION);
                })
                .attr('cx', me.points.attrs.cx)
                .attr('cy', me.points.attrs.cy)
                .attr('fill', function (d) {
                    return (me.random ? me.scaleFill(Math.sqrt(d[me.xKey] * d[me.xKey] + d[me.yKey] * d[me.yKey])) : me.points.attrs.fill(d));
                });
        }
    }
}
