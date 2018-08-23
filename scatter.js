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
(function (global, factory) {

    (typeof exports === 'object' && typeof module !== 'undefined')
        ? factory(exports)
        : ((typeof define === 'function' && define.amd)
            ? define(['exports'], factory)
            : factory(global.d3 = (global.d3 || {})));

}(this, function (exports) {

    'use strict';

    class Scatter extends d3.Widget {

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
            me.data = data;
            me.xKey = xKey;
            me.yKey = yKey;
            options = (options || {});
            d3.setDefaultPropertiesFalsy(me, options, {
                rKey: null,
                fKeyCategorical: null,
                fKeyContinuous: null,
                loColor: '#3366cc',
                mdColor: 'darkgrey',
                hiColor: '#109618',
                numColors: 256,
                colorsCategorical: [
                    '#109618', '#3366cc', '#dc3912', '#ff9900', '#990099',
                    '#0099c6', '#dd4477', '#66aa00', '#b82e2e', '#316395',
                    '#994499', '#22aa99', '#aaaa11', '#6633cc', '#e67300',
                    '#8b0707', '#651067', '#329262', '#5574a6', '#3b3eac'
                ],
                defaultColor: 'black',
                minRadius: 4,
                maxRadius: 16,
                defaultRadius: 8,
                defaultOpacity: 0.25,
                scaleOverUnder: Math.sqrt(2) * Math.sqrt(Number.MAX_VALUE),
                tooltipFormat: d3.format('.7')
            });
            d3.setDefaultPropertiesFalsy(me, options, {
                colorsContinuous: me.interpolateColors(me.loColor, me.mdColor, me.hiColor, me.numColors)
            });
            d3.setDefaultPropertiesUndefined(me, options, {
                categorical: false,
                enableTransitions: true
            });

            // scales for point attributes (cx, cy, r, fill)
            me.scaleX = d3.scaleLinear();
            me.scaleY = d3.scaleLinear();
            me.scaleR = d3.scaleLinear();
            me.scaleFillCategorical = d3.scaleOrdinal();
            me.scaleFillContinuous = d3.scaleQuantize();

            // container to hold all visual elements
            me.container = me.newDefaultSVGContainer(options);

            me.axisX = new d3.Axis(
                me.container.svg,
                'axis',
                me.scaleX,
                me.options.FONT_SIZE,
                'bottom',
                {
                    tickFormat: d3.format('.1')
                }
            );

            me.axisY = new d3.Axis(
                me.container.svg,
                'axis',
                me.scaleY,
                me.options.FONT_SIZE,
                'left',
                {
                    tickFormat: d3.format('.1')
                }
            );

            me.points = new d3.ElementCollection(
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
                {
                    callbacks: {
                        mouseover: function (d) {
                            d3.select(this)
                                .style('opacity', 1);
                            me.tooltip.show(d);
                        },
                        mouseout: function (d) {
                            d3.select(this)
                                .style('opacity', me.defaultOpacity);
                            me.tooltip.hide();
                        }
                    },
                    styles: {
                        opacity: function () { return me.defaultOpacity; }
                    }
                }
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

            // set limits, margins, anchors, scales, and position all elements
            me.setLimits();
            me.setMargins();
            me.setAnchors();
            me.setScaleDomains();
            me.setScaleRanges();
            me.positionElements();

            // initialize points
            me.points.updateData(me.data, me.key);
            me.points.updateVis('cx', 'cy');
            me.points.updateStyle('opacity');

            // visual initialization
            if (me.enableTransitions) {
                me.axisX.updateVis(me.options.ANIM_DURATION);
                me.axisY.updateVis(me.options.ANIM_DURATION);
                me.points.selection
                    .transition()
                    .duration(me.points.attrs.duration)
                    .attr('r', me.points.attrs.r)
                    .attr('fill', me.points.attrs.fill);
            } else {
                me.axisX.updateVis();
                me.axisY.updateVis();
                me.points.updateVis('r', 'fill');
            }

            me.points.bindEventListeners();
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

            if (me.enableTransitions) {

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
            } else {

                // update axis if necessary
                if (attribute === 'cx') {
                    me.axisX.updateVis();
                } else if (attribute === 'cy') {
                    me.axisY.updateVis();
                }

                // update attribute
                me.points.updateVis(attribute);
            }
        }

        updateData (data, xKey, yKey, options) {
            var me = this;
            me.data = data;
            me.xKey = xKey;
            me.yKey = yKey;
            options = (options || {});
            d3.setDefaultPropertiesFalsy(me, options, {
                rKey: me.rKey,
                fKeyCategorical: me.fKeyCategorical,
                fKeyContinuous: me.fKeyContinuous
            });
            d3.setDefaultPropertiesUndefined(me, options, {
                enableTransitions: me.enableTransitions
            });

            // update limits and scales
            me.setLimits();
            me.setScaleDomains();

            // visual updates
            if (me.enableTransitions) {
                me.axisX.updateVis(me.options.ANIM_DURATION);
                me.axisY.updateVis(me.options.ANIM_DURATION);

                // update point data and selection (selection = updated points,
                // selection.exit = old points, selection.enter = new points)
                me.points.selection = me.points.selection
                    .data(me.data, me.key);

                // transition and remove old points
                me.points.selection
                    .exit()
                    .transition()
                    .duration(me.points.attrs.duration)
                    .attr('r', 0)
                    .remove();

                // add new points to the selection
                me.points.selection = me.points.selection
                    .enter()
                    .append('circle')
                    .attr('cx', me.points.attrs.cx)
                    .attr('cy', me.points.attrs.cy)
                    .style('opacity', me.defaultOpacity)
                    .merge(me.points.selection);

                // transition updated points + new points
                me.points.selection
                    .transition()
                    .duration(me.points.attrs.duration)
                    .attr('cx', me.points.attrs.cx)
                    .attr('cy', me.points.attrs.cy)
                    .attr('r', me.points.attrs.r)
                    .attr('fill', me.points.attrs.fill);
            } else {
                me.axisX.updateVis();
                me.axisY.updateVis();
                me.points.updateData(me.data, me.key);
                me.points.updateVis('cx', 'cy', 'r', 'fill');
                me.points.updateStyle('opacity');
            }

            me.points.bindEventListeners();
        }
    }

    exports.Scatter = Scatter;

    Object.defineProperty(exports, '__esModule', { value: true });
}));
