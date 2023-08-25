import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

function App() {
  const svgRef = useRef();
  const createGraph = async () => {
    // read from csv and format variables
    let data = await d3.csv(
      "https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv"
    );
    let parseTime = d3.timeParse("%Y-%m-%d");
    data.forEach((d) => {
      d.date = parseTime(d.date);
      d.value = +d.value;
    });
    console.log(data);

    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 50, left: 70 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},     ${margin.top})`);

    // Add X axis and Y axis
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);
    x.domain(
      d3.extent(data, (d) => {
        return d.date;
      })
    );
    y.domain([
      0,
      d3.max(data, (d) => {
        return d.value;
      }),
    ]);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x));
    svg.append("g").call(d3.axisLeft(y));

    // adding grid lines
    var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height, 0]);
    var yGrid = (g) =>
      g
        .style("stroke", "gray")
        .style("stroke-opacity", 0.2)
        .selectAll("line")
        .data(yScale.ticks())
        .join("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d));
    svg.append("g").call(yGrid);
    var xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, width]);
    var xGrid = (g) =>
      g
        .style("stroke", "gray")
        .style("stroke-opacity", 0.2)
        .selectAll("line")
        .data(xScale.ticks())
        .join("line")
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("y1", 0)
        .attr("y2", height);
    svg.append("g").call(xGrid);

    // add the Line
    var valueLine = d3
      .line()
      .x((d) => {
        return x(d.date);
      })
      .y((d) => {
        return y(d.value);
      });
    svg
      .append("path")
      .data([data])
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", valueLine);
  };

  useEffect(() => {
    createGraph();
  }, []);

  return <div ref={svgRef}></div>;
}

export default App;
