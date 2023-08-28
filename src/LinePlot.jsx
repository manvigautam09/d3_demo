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
    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 50, left: 70 },
      width = 960 - margin.left - margin.right,
      height = 250 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},     ${margin.top})`);

    //   create tooltip div
    const tooltip = d3
      .select(svgRef.current)
      .append("div")
      .attr("class", "tooltip");

    // Create a second tooltip div for raw date
    const tooltipRawDate = d3
      .select(svgRef.current)
      .append("div")
      .attr("class", "tooltip");

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

    // Add a circle element
    const circle = svg
      .append("circle")
      .attr("r", 0)
      .attr("fill", "black")
      .style("stroke", "white")
      .attr("opacity", 0.7)
      .style("pointer-events", "none");

    // Add black lines extending from the circle to the date and value
    const tooltipLineX = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-x")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    const tooltipLineY = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-y")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2");

    // create a listening rectangle
    const listeningRect = svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("opacity", 0);

    listeningRect.on("mousemove", function (event) {
      const [xCoord] = d3.pointer(event, this);
      const bisectDate = d3.bisector((d) => d.date).left;
      const x0 = x.invert(xCoord);
      const i = bisectDate(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
      const xPos = x(d.date);
      const yPos = y(d.value);

      // UpDate the circle position
      circle.attr("cx", xPos).attr("cy", yPos);

      // Add transition for the circle radius
      circle.transition().duration(50).attr("r", 5);

      // Update the position of the black lines
      tooltipLineX
        .style("display", "block")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", 0)
        .attr("y2", height);
      tooltipLineY
        .style("display", "block")
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("x1", 0)
        .attr("x2", width);

      // add in our tooltip
      tooltip
        .style("position", "fixed")
        .style("left", `${width + 90}px`)
        .style("top", `${yPos + 20}px`)
        .style("background", "gray")
        .style("border-radius", "5px")
        .style("color", "white")
        .style("padding", "5px")
        .html(`${d.value !== undefined ? d.value.toFixed(2) : "N/A"}`);

      tooltipRawDate
        .style("position", "fixed")
        .style("left", `${xPos + 60}px`)
        .style("top", `${height + 53}px`)
        .style("background", "gray")
        .style("border-radius", "5px")
        .style("color", "white")
        .style("padding", "5px")
        .html(
          `${d.date !== undefined ? d.date.toISOString().slice(0, 10) : "N/A"}`
        );
    });
  };

  useEffect(() => {
    createGraph();
  }, []);

  return <div ref={svgRef}></div>;
}

export default App;
