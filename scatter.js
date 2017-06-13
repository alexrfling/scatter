/*
             +------------+----------------------------------------------------+
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
marginChartY |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             |            |                                                    |
             +------------+----------------------------------------------------+
marginLabelY |            |                                                    |
             +------------+----------------------------------------------------+
              marginLabelX                      marginChartX
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

    initialize (data, xKey, yKey, options) {
        var me = this;
        options = (options || {});

        me.data = data;
        me.xKey = xKey;
        me.yKey = yKey;
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
        me.mdColor = (options.mdColor || 'darkgrey');
        me.hiColor = (options.hiColor || '#109618');
        me.numColors = (options.numColors || 256);
        me.defaultColor = (options.defaultColor || 'black');
        me.colorsContinuous = (options.colorsContinuous || me.interpolateColors(me.loColor, me.mdColor, me.hiColor, me.numColors));
        me.categorical = options.categorical;
        me.minRadius = (options.minRadius || 4);
        me.maxRadius = (options.maxRadius || 16);
        me.defaultRadius = (options.defaultRadius || 8);
        me.defaultOpacity = (options.defaultOpacity || 0.25);
        me.scaleOverUnder = (options.scaleOverUnder || Math.sqrt(2) * Math.sqrt(Number.MAX_VALUE));
        me.tooltipFormat = (options.tooltipFormat || d3.format('.7'));
        me.noTransition = (options.noTransition === undefined ? false : options.noTransition);

        me.setLimits();

        // clear out DOM elements inside parent
        me.destroy();

        // holds all HTML and SVG elements
        me.container = new SVGContainer(
            me.id,
            'd3-helpers-widget-div',
            'd3-helpers-widget-svg',
            me.options.SVG_MARGINS,
            options.width,
            (options.height || me.options.DEFAULT_HEIGHT),
            {
                onWindowResize: (options.width ? null : function () { me.resize.call(me); })
            }
        );

        // scales for point attributes (cx, cy, r, fill)
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
            'bottom',
            {
                tickFormat: d3.format('.1')
            }
        );

        me.axisY = new Axis(
            me.container.svg,
            'axis',
            me.scaleY,
            me.options.FONT_SIZE,
            'left',
            {
                tickFormat: d3.format('.1')
            }
        );

        me.points = new ElementCollection(
            me.container.svg,
            'points',
            'circle',
            {
                cx: function (d) { return me.scaleX(d[me.xKey]); },
                cy: function (d) { return me.scaleY(d[me.yKey]); },
                r: function (d) { return (me.rKey ? me.scaleR(d[me.rKey]) : me.defaultRadius); },
                fill: function (d) {
                    if (me.categorical) {
                        if (me.fKeyCategorical) {
                            return me.scaleFillCategorical(d[me.fKeyCategorical]);
                        }
                        return me.defaultColor;
                    } else {
                        if (me.fKeyContinuous) {
                            return me.scaleFillContinuous(d[me.fKeyContinuous]);
                        }
                        return me.defaultColor;
                    }
                },
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

        // tooltip for points
        me.tooltip = d3.tip()
            .attr('class', 'd3-tip')
            .direction('w')
            .offset([0, -10])
            .html(function (d) {
                var fKey = (me.categorical ? me.fKeyCategorical : me.fKeyContinuous);
                var html = '<table>'
                    + '<tr><td>' + me.xKey + ' (x)</td><td>' + me.tooltipFormat(d[me.xKey]) + '</td></tr>'
                    + '<tr><td>' + me.yKey + ' (y)</td><td>' + me.tooltipFormat(d[me.yKey]) + '</td></tr>';

                if (me.rKey) {
                    html += '<tr><td>' + me.rKey + ' (size)</td><td>' + me.tooltipFormat(d[me.rKey]) + '</td></tr>';
                }

                if (fKey) {
                    var fVal = (typeof d[fKey] === 'number' ? me.tooltipFormat(d[fKey]) : d[fKey]);
                    html += '<tr><td>' + fKey + ' (color)</td><td>' + fVal + '</td></tr>';
                }

                return html + '</table>';
            });

        // invoke tooltip
        me.container.svg
            .call(me.tooltip);

        me.bindEventListeners();

        me.setMargins();
        me.setAnchors();
        me.setScaleDomainsPositional();
        me.setScaleRangesPositional();
        me.positionElements();

        me.axisX.updateVis();
        me.axisY.updateVis();

        me.points.selection
            .attr('cx', me.points.attrs.cx)
            .attr('cy', me.points.attrs.cy)
            .style('opacity', me.defaultOpacity);

        if (me.noTransition) {
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

        if (!me.rKey) {
            return;
        }

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

        if (!me.fKeyCategorical) {
            return;
        }

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

        if (!me.fKeyContinuous) {
            return;
        }

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

        me.marginLabelX = 40;
        me.marginLabelY = me.options.FONT_SIZE;
        me.marginChartX = me.container.svgWidth - me.marginLabelX - me.options.PADDING;
        me.marginChartY = me.container.svgHeight - me.marginLabelY - me.options.PADDING;
    }

    setAnchors () {
        var me = this;

        me.points.anchor = [me.marginLabelX, me.options.PADDING];
        me.axisX.anchor = [me.marginLabelX, me.marginChartY + me.options.PADDING];
        me.axisY.anchor = [me.marginLabelX, me.options.PADDING];
    }

    setScaleDomainsHorizontal () {
        var me = this;
        var buffer = (1.0 * me.maxRadius / me.marginChartX) * (me.xMax - me.xMin);

        me.scaleX.domain([me.xMin - buffer, me.xMax + buffer]);
    }

    setScaleDomainsVertical () {
        var me = this;
        var buffer = (1.0 * me.maxRadius / me.marginChartY) * (me.yMax - me.yMin);

        me.scaleY.domain([me.yMin - buffer, me.yMax + buffer]);
    }

    setScaleDomainsPositional () {
        var me = this;

        me.setScaleDomainsHorizontal();
        me.setScaleDomainsVertical();
    }

    setScaleDomainsSize () {
        var me = this;

        me.scaleR.domain([me.rMin, me.rMax]);
    }

    setScaleDomainsFill () {
        var me = this;

        if (me.categorical && me.fKeyCategorical) {
            me.scaleFillCategorical.domain(me.fDomain);
        } else if (me.fKeyContinuous) {
            me.scaleFillContinuous.domain([me.fMin, me.fMax]);
        }
    }

    setScaleDomains () {
        var me = this;

        me.setScaleDomainsPositional();
        me.setScaleDomainsSize();
        me.setScaleDomainsFill();
    }

    setScaleRangesPositional () {
        var me = this;

        me.scaleX.range([0, me.marginChartX]);
        me.scaleY.range([me.marginChartY, 0]);
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

    positionElements () {
        var me = this;

        me.points.position();
        me.axisX.position();
        me.axisY.position();
    }

    updateVisElements () {
        var me = this;

        me.points.updateVis('cx', 'cy');
        me.axisX.updateVis();
        me.axisY.updateVis();
    }

    bindEventListeners () {
        var me = this;

        me.points.selection
            .on('mouseover', function (d) {
                d3.select(this)
                    .style('opacity', 1);
                me.tooltip.show(d);
            })
            .on('mouseout', function (d) {
                d3.select(this)
                    .style('opacity', me.defaultOpacity);
                me.tooltip.hide();
            });
    }

    resize (width, height) {
        var me = this;
        me.container.resize(width, height);

        me.setMargins();
        me.setAnchors();
        me.setScaleDomainsPositional();
        me.setScaleRangesPositional();
        me.positionElements();
        me.updateVisElements();
    }

    updateColors (loColor, mdColor, hiColor, numColors) {
        var me = this;
        me.loColor = (loColor || me.loColor);
        me.mdColor = (mdColor || me.mdColor);
        me.hiColor = (hiColor || me.hiColor);
        me.numColors = (numColors || me.numColors);
        me.colorsContinuous = me.interpolateColors(me.loColor, me.mdColor, me.hiColor, me.numColors);

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
        me.xKey = (xKey || me.xKey);
        me.setXLimits();
        me.setSMax();

        // scale updates
        me.setScaleDomainsHorizontal();

        // visual updates
        me.updateVisAttr('cx');
    }

    updateYKey (yKey) {
        var me = this;
        me.yKey = (yKey || me.yKey);
        me.setYLimits();
        me.setSMax();

        // scale updates
        me.setScaleDomainsVertical();

        // visual updates
        me.updateVisAttr('cy');
    }

    updateRKey (rKey) {
        var me = this;
        me.rKey = rKey;
        me.setRLimits();

        // scale updates
        me.setScaleDomainsSize();

        // visual updates
        me.updateVisAttr('r');
    }

    updateFKeyCategorical (fKeyCategorical) {
        var me = this;
        me.fKeyCategorical = fKeyCategorical;
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
        me.fKeyContinuous = fKeyContinuous;
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

        if (me.noTransition) {

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

    updateData (data, xKey, yKey, options) {
        var me = this;
        options = (options || {});

        me.data = data;
        me.xKey = xKey;
        me.yKey = yKey;
        me.rKey = options.rKey;
        me.fKeyCategorical = options.fKeyCategorical;
        me.fKeyContinuous = options.fKeyContinuous;
        me.noTransition = options.noTransition;
        me.setLimits();

        // scale updates
        me.setScaleDomains();

        // visual updates
        if (me.noTransition) {
            me.axisX.updateVis();
            me.axisY.updateVis();
            me.points.updateData(me.data, me.key);
            me.points.updateVis('cx', 'cy', 'r', 'fill');
            me.points.selection
                .style('opacity', me.defaultOpacity);
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
                .style('opacity', me.defaultOpacity);

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

        me.bindEventListeners();
    }
}
