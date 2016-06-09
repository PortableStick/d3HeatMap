function heatMap() {
    var margin = { top: 0, right: 180, bottom: 120, left: 100 },
        width = 1200 - margin.left - margin.right,
        height = 720 - margin.top - margin.bottom,
        yearFormat = function(d) {
            return d;
        },
        monthFormat = function(d) {
            return d;
        },
        tempFormat = function(d) {
            return d;
        },
        xScale = d3.scale.ordinal(),
        yScale = d3.scale.ordinal(),
        zScale = d3.scale.quantile(),
        xAxis = d3.svg.axis().orient("bottom"),
        yAxis = d3.svg.axis().orient("left"),
        chartColors = ['#5081D6', '#53D4E0', '#55C990', '#61E053', '#E1F58E', '#BDD64C', '#CED63C', '#E0C13F', '#C99342', '#C97200', '#E06F3F', '#D63839'],
        xLabel = '',
        yLabel = '',
        legendPadding = 30,
        xTextBottomPadding = 20,
        monthDict = { 1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December" };

    function chart(selection) {

        d3.select(this).html("") //Delete any other charts before redrawing

        selection.each(function(data) {

            var svg = d3.select(this).append('svg')
                .classed("main", true)
                .attr({
                    'width': width + margin.left + margin.right,
                    'height': height + margin.top + margin.bottom
                }).append('g').classed("chartContainer", true)
                .attr({
                    "transform": `translate(${margin.left},${margin.top})`
                });

            var tooltip = d3.select(this)
                .append("div")
                .classed("tooltip", true)
                .style({
                    'opacity': 0
                });

            var chartData = d3.nest()
                .key(function(d) {
                    return d.year;
                })
                .key(function(d) {
                    return d.month;
                })
                .rollup(function(d) {
                    return d[0].variance;
                })
                .entries(data.monthlyVariance);

            var years = chartData.map(function(d) {
                    return +(d.key);
                }),
                months = chartData[0].values.map(function(d) {
                    return +(d.key);
                }),
                variances = d3.merge(chartData.map(function(d) {
                    return d.values.map(function(x) {
                        return x.values;
                    });
                }));

            xScale.domain(years).rangeBands([0, width]);

            yScale.domain(months).rangeBands([height, 0]);

            zScale.domain(variances).range(chartColors);

            xAxis.scale(xScale).tickValues(years.filter(function(d, i) {
                return !(i % 20);
            }));
            yAxis.scale(yScale).tickFormat(function(day) {
                return monthDict[day];
            });

            var axes = svg.selectAll('.axis')
                .data([{
                    class: 'x',
                    axis: xAxis,
                    x: 0,
                    y: height
                }, {
                    class: 'y',
                    axis: yAxis,
                    x: 0,
                    y: 0
                }])
                .enter()
                .append('g')
                .attr({
                    'class': function(d) {
                        return d.class + ' axis';
                    },
                    "text-anchor": "end",
                    'transform': function(d) {
                        return `translate(${d.x},${d.y})`;
                    }
                });

            axes.each(function(d) {
                d3.select(this).call(d.axis);
            });

            var yText = d3.select('.y.axis')
                .append("text")
                .classed("label", true)
                .attr({
                    "y": (margin.left / -2),
                    "x": 0 - (height / 2), //Because of rotation
                    "transform": "rotate(-90)",
                    'text-anchor': 'middle'
                })
                .text(yLabel);

            var xText = d3.select('.x.axis')
                .append("text")
                .classed("label", true)
                .attr({
                    'x': (width / 2),
                    'y': margin.bottom / 2,
                    'text-anchor': 'middle'
                })
                .text(xLabel);

            var blockWidth = width / years.length,
                blockHeight = yScale.rangeBand();

            svg.append('g')
                .classed("boxes", true)
                .selectAll('rect')
                .data(data.monthlyVariance)
                .enter()
                .append("rect")
                .attr({
                    "x": function(d) {
                        return xScale(d.year);
                    },
                    "y": function(d) {
                        return yScale(d.month);
                    },
                    height: blockHeight,
                    width: blockWidth
                })
                .style({
                    "fill": function(d) {
                        return zScale(d.variance);
                    },
                    'stroke': 'none',
                    'stroke-width': 0,
                    "margin": 0,
                    "padding": 0
                })
                .on('mouseover', function(d) {
                    tooltip.style({
                        'opacity': 0.8,
                        'top': (d3.event.pageY - 70) + 'px',
                        'left': (d3.event.pageX + 60) + 'px'
                    }).html(`<h1>${d.year}</h1> <h2>${monthDict[d.month]}</h2><h2>${d.variance}&deg;C</h2><h2>${((d.variance + data.baseTemperature).toFixed(4))}&deg;C</h2>`);
                })
                .on('mouseout', function() {
                    tooltip.style('opacity', 0)
                });

            var legendX = width + legendPadding,
                legendY = margin.top + height / 3,
                legend = svg.append('g').selectAll(".legend")
                .data(zScale.quantiles())
                .enter().append('g')
                .classed("legend", true)
                .attr({
                    "transform": function(d, i) {
                        return `translate(${legendX},${legendY - (i * 20)})`;
                    }
                });

            legend.append("rect")
                .attr({
                    'width': 20,
                    'height': 20
                })
                .style("fill", zScale);

            legend.append("text")
                .attr("x", 26)
                .attr("y", 10)
                .attr("dy", ".35em")
                .text(function(d) {
                    return `${d.toFixed(4)}ºC`
                });

        }); //selection
    }

    chart.width = function(_) {
        if (!arguments.length) return width;
        width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return height;
        height = _;
        return chart;
    };

    chart.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return chart;
    };

    chart.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return chart;
    };

    chart.yearFormat = function(_) {
        if (!arguments.length) return yearFormat;
        yearFormat = _;
        return chart;
    };

    chart.monthFormat = function(_) {
        if (!arguments.length) return monthFormat;
        monthFormat = _;
        return chart;
    };

    chart.tempFormat = function(_) {
        if (!arguments.length) return tempFormat;
        tempFormat = _;
        return chart;
    };

    chart.legendPadding = function(_) {
        if (!arguments.length) return legendPadding;
        legendPadding = _;
        return chart;
    };

    return chart;

}

window.onload = function() {

    d3.json('./temps.json', function(error, data) {

        if (error) throw error;
        var tempsChart = heatMap().yLabel("Month").xLabel("Year");
        d3.select("#chart").datum(data).call(tempsChart);

    });

}
