import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./App.css";

function App() {
  const svgRef = useRef();
  const createGraph = async () => {
    // read from csv and format variables
    let res = await d3.csv("http://localhost:3005/sample_ecg_data_d3.csv");
    let data = [];
    res.forEach((d) => {
      d.date = new Date(d.date);
      d.value = +d.value;
      data.push(d);
    });
    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 90, left: 70 },
      width = (data.length || 200) * 50 - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},     ${margin.top})`);

    // create tooltip div
    const tooltip = d3
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
      d3.min(data, (d) => {
        return d.value;
      }),
      d3.max(data, (d) => {
        return d.value;
      }),
    ]);
    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .attr("class", "x-axis")
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeMillisecond.every(200))
          .tickFormat(d3.timeFormat("%I:%M:%S:%L %p"))
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-.8em")
      .attr("dy", "-.6em");
    svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    // adding grid lines
    var yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height, 0]);
    var yGrid = (g) =>
      g
        .style("stroke", "red")
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
        .style("stroke", "red")
        .style("stroke-opacity", 0.2)
        .selectAll("line")
        .data(xScale.ticks())
        .join("line")
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("y1", 0)
        .attr("y2", height);
    svg.append("g").call(xGrid);

    //construct base line
    var baseline = d3
      .line()
      .x((d) => {
        return x(d.date);
      })
      .y(90);

    svg
      .append("path")
      .data([data])
      .attr("class", "base-line")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("d", baseline);

    // add the Line
    var valueLine = d3
      .line()
      .curve(d3.curveCardinal)
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
      .attr("stroke", "black")
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
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "8,8");

    const tooltipLineY = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-y")
      .attr("stroke", "blue")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "8,8");

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
      circle.transition().duration(50).attr("r", 3.5);

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
        .style("display", "block")
        .style("left", `${xPos + 100}px`)
        .style("top", `${yPos + 50}px`)
        .html(
          `<strong>Time:</strong> ${
            new Date(d.date).toTimeString().slice(0, 8) || "N/A"
          }<br><strong>Value:</strong> ${
            d.value !== undefined ? d.value.toFixed(2) : "N/A"
          }`
        );
    });

    // listening rectangle mouse leave function
    listeningRect.on("mouseleave", function () {
      circle.transition().duration(50).attr("r", 0);
      tooltip.style("display", "none");
      tooltipLineX.attr("x1", 0).attr("x2", 0);
      tooltipLineY.attr("y1", 0).attr("y2", 0);
      tooltipLineX.style("display", "none");
      tooltipLineY.style("display", "none");
    });
  };

  useEffect(() => {
    createGraph();
  }, []);

  return (
    <div
      style={{
        width: "900px",
        overflow: "auto",
        margin: "auto",
        position: "relative",
      }}
    >
      <div ref={svgRef}></div>
    </div>
  );
}

export default App;
