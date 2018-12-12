function heatMap() {
  const margin = { top: 0, right: 180, bottom: 120, left: 100 };
  const xScale = d3.scale.ordinal();
  const yScale = d3.scale.ordinal();
  const zScale = d3.scale.quantile();
  const xAxis = d3.svg.axis().orient("bottom");
  const yAxis = d3.svg.axis().orient("left");
  const chartColors = [
    "#5081D6",
    "#53D4E0",
    "#55C990",
    "#61E053",
    "#E1F58E",
    "#BDD64C",
    "#CED63C",
    "#E0C13F",
    "#C99342",
    "#C97200",
    "#E06F3F",
    "#D63839"
  ];
  const xTextBottomPadding = 20;
  const monthDict = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December"
  };

  let width = 1200 - margin.left - margin.right;
  let height = 720 - margin.top - margin.bottom;
  let yearFormat = d => d;
  let monthFormat = d => d;
  let tempFormat = d => d;
  let legendPadding = 30;
  let xLabel = "";
  let yLabel = "";

  function chart(selection) {
    d3.select(this).html(""); //Delete any other charts before redrawing

    selection.each(function(data) {
      const svg = d3
        .select(this)
        .append("svg")
        .classed("main", true)
        .attr({
          width: width + margin.left + margin.right,
          height: height + margin.top + margin.bottom
        })
        .append("g")
        .classed("chartContainer", true)
        .attr({
          transform: `translate(${margin.left},${margin.top})`
        });

      const tooltip = d3
        .select(this)
        .append("div")
        .attr({ id: "tooltip" })
        .style({
          opacity: 0
        });

      const chartData = d3
        .nest()
        .key(d => d.year)
        .key(d => d.month)
        .rollup(d => d[0].variance)
        .entries(data.monthlyVariance);

      const years = chartData.map(d => +d.key);
      const months = chartData[0].values.map(d => +d.key);
      const variances = d3.merge(
        chartData.map(d => d.values.map(x => x.values))
      );

      xScale.domain(years).rangeBands([0, width]);

      yScale.domain(months).rangeBands([height, 0]);

      zScale.domain(variances).range(chartColors);

      xAxis.scale(xScale).tickValues(years.filter((d, i) => i % 20 === 0));
      yAxis.scale(yScale).tickFormat(day => monthDict[day]);

      const axes = svg
        .selectAll(".axis")
        .data([
          {
            axis: xAxis,
            x: 0,
            y: height,
            id: "x-axis"
          },
          {
            axis: yAxis,
            x: 0,
            y: 0,
            id: "y-axis"
          }
        ])
        .enter()
        .append("g")
        .attr({
          class: d => d.class + " axis",
          "text-anchor": "end",
          transform: d => `translate(${d.x},${d.y})`,
          id: d => d.id
        });

      axes.each(function(d) {
        d3.select(this).call(d.axis);
      });

      const yText = d3
        .select(".y.axis")
        .append("text")
        .classed("label", true)
        .attr({
          y: margin.left / -2,
          x: 0 - height / 2, //Because of rotation
          transform: "rotate(-90)",
          "text-anchor": "middle"
        })
        .text(yLabel);

      const xText = d3
        .select(".x.axis")
        .append("text")
        .classed("label", true)
        .attr({
          x: width / 2,
          y: margin.bottom / 2,
          "text-anchor": "middle"
        })
        .text(xLabel);

      const blockWidth = width / years.length,
        blockHeight = yScale.rangeBand();

      svg
        .append("g")
        .selectAll("rect")
        .data(data.monthlyVariance)
        .enter()
        .append("rect")
        .attr({
          x: d => xScale(d.year),
          y: d => yScale(d.month),
          height: blockHeight,
          width: blockWidth,
          "data-month": d => d.month - 1,
          "data-year": d => d.year,
          "data-temp": d => d.variance,
          class: "cell"
        })
        .style({
          fill: d => zScale(d.variance),
          stroke: "none",
          "stroke-width": 0,
          margin: 0,
          padding: 0
        })
        .on("mouseover", d => {
          tooltip
            .style({
              opacity: 0.8,
              top: d3.event.pageY - 70 + "px",
              left: d3.event.pageX + 60 + "px"
            })
            .attr({ "data-year": d.year })
            .html(
              `<h1>${d.year}</h1> <h2>${monthDict[d.month]}</h2><h2>${
                d.variance
              }&deg;C</h2><h2>${(d.variance + data.baseTemperature).toFixed(
                4
              )}&deg;C</h2>`
            );
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

      const legendX = width + legendPadding,
        legendY = margin.top + height / 3,
        legend = svg
          .append("g")
          .selectAll(".legend")
          .data(zScale.quantiles())
          .enter()
          .append("g")
          .attr({
            transform: (d, i) => `translate(${legendX},${legendY - i * 20})`,
            id: "legend"
          });

      legend
        .append("rect")
        .attr({
          width: 20,
          height: 20
        })
        .style("fill", zScale);

      legend
        .append("text")
        .attr("x", 26)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(d => `${d.toFixed(4)}ºC`);
    }); //selection
  }

  chart.width = _ => {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = _ => {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xLabel = _ => {
    if (!arguments.length) return xLabel;
    xLabel = _;
    return chart;
  };

  chart.yLabel = _ => {
    if (!arguments.length) return yLabel;
    yLabel = _;
    return chart;
  };

  chart.yearFormat = _ => {
    if (!arguments.length) return yearFormat;
    yearFormat = _;
    return chart;
  };

  chart.monthFormat = _ => {
    if (!arguments.length) return monthFormat;
    monthFormat = _;
    return chart;
  };

  chart.tempFormat = _ => {
    if (!arguments.length) return tempFormat;
    tempFormat = _;
    return chart;
  };

  chart.legendPadding = _ => {
    if (!arguments.length) return legendPadding;
    legendPadding = _;
    return chart;
  };

  return chart;
}

window.onload = function() {
  d3.json("https://gregoftheweb.com/temps.json", (error, data) => {
    if (error) throw error;
    const tempsChart = heatMap();
    // .yLabel("Month")
    // .xLabel("Year");
    d3.select("#chart")
      .datum(data)
      .call(tempsChart);
  });
};
