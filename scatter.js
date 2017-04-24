/*
              marginXLabel                      marginXChart
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
            AXIS_OFFSET: 5,
            DEFAULT_HEIGHT: 400,
            FONT_SIZE: 10,
            PADDING: 30
        });
    }

    initialize (data, options) {
        var me = this;
        options = (options || {});

        me.data = data;
        me.colors = options.colors;
        me.random = options.random;
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

        me.xAxis = d3.axisBottom(me.xScale);
        me.yAxis = d3.axisLeft(me.yScale);

        // add the axes to the svg
        me.xLabels = me.container.svg
            .append('g')
            .attr('transform', 'translate(' + me.options.PADDING + ',' + (me.container.svgHeight - me.options.PADDING) + ')')
            .call(me.xAxis);
        me.yLabels = me.container.svg
            .append('g')
            .attr('transform', 'translate(' + me.options.PADDING + ',' + me.options.PADDING + ')')
            .call(me.yAxis);

        me.points = new ElementCollection(
            me.container.svg,
            'points',
            'circle',
            {
                cx: function (d) { return me.xScale(d.x); },
                cy: function (d) { return me.yScale(d.y); },
                r: function () { return (me.random ? 10 : 5); },
                fill: function (d) { return (me.random ? me.scaleFill(Math.sqrt(d.x * d.x + d.y * d.y)) : me.colors[d.label]); }
            },
            me.data,
            me.key
        );

        me.marginsSetup();
        me.anchorsSetup();
        me.scaleRangesPositionalSetup();
        me.positionAllElements();

        me.points.selection
            .attr('cx', me.points.attrs.cx)
            .attr('cy', me.points.attrs.cy)
            .style('opacity', 0.5);

        me.points.selection
            .transition()
            .duration(me.options.ANIM_DURATION)
            .attr('r', me.points.attrs.r)
            .attr('fill', me.points.attrs.fill);
    }

    setLimits () {
        var me = this;

        me.xMin = d3.min(me.data, function (d) { return d.x; });
        me.xMax = d3.max(me.data, function (d) { return d.x; });
        me.yMin = d3.min(me.data, function (d) { return d.y; });
        me.yMax = d3.max(me.data, function (d) { return d.y; });

        if (me.random) {
            me.sMin = d3.min(me.data, function (d) { return Math.sqrt(d.x * d.x + d.y * d.y); });
            me.sMax = d3.max(me.data, function (d) { return Math.sqrt(d.x * d.x + d.y * d.y); });
        }
    }

    marginsSetup () {
        var me = this;

        // TODO
    }

    anchorsSetup () {
        var me = this;

        me.points.anchor = [me.options.PADDING, me.options.PADDING];
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

        me.xScale.range([0, me.container.svgWidth - 2 * me.options.PADDING]);
        me.yScale.range([me.container.svgHeight - 2 * me.options.PADDING, 0]);
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
        me.xLabels
            .attr('transform', 'translate(' + me.options.PADDING + ',' + (me.container.svgHeight - me.options.PADDING) + ')');
        me.yLabels
            .attr('transform', 'translate(' + me.options.PADDING + ',' + me.options.PADDING + ')');
    }

    updateVisAllElements () {
        var me = this;

        me.points.updateVis(['cx', 'cy']);
        me.xLabels
            .call(me.xAxis);
        me.yLabels
            .call(me.yAxis);
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
        me.xScale.domain([me.xMin - 1, me.xMax + 1]);
        me.yScale.domain([me.yMin - 1, me.yMax + 1]);

        if (me.random) {
            me.scaleFill.domain([me.sMin, me.sMax]);
        }

        // visual updates
        me.xLabels
            .transition()
            .duration(me.options.ANIM_DURATION)
            .call(me.xAxis);
        me.yLabels
            .transition()
            .duration(me.options.ANIM_DURATION)
            .call(me.yAxis);
        me.points.selection
            .data(me.data, me.key)
            .transition()
            .duration(function (d) {
                return (me.random ? Math.sqrt(d.x * d.x + d.y * d.y) / me.sMax * me.options.ANIM_DURATION : me.options.ANIM_DURATION);
            })
            .attr('cx', me.points.attrs.cx)
            .attr('cy', me.points.attrs.cy)
            .attr('fill', function (d) {
                return (me.random ? me.scaleFill(Math.sqrt(d.x * d.x + d.y * d.y)) : me.points.attrs.fill(d));
            });
    }
}
