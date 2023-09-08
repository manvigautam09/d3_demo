import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./App.css";

function App() {
  const svgRef = useRef();

  const margin = { top: 30, right: 20, bottom: 100, left: 60 };
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const createGraph = async () => {
    // read from csv and format variables
    // https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/3_TwoNumOrdered_comma.csv
    let res = await d3.csv("http://localhost:3005/ECG_sample_d3.csv");
    let data = [];
    res.forEach((d) => {
      d.time = new Date(d.time);
      d.value = +d.value;
      data.push(d);
    });

    // set the dimensions and margins of the graph
    let widthComp = (data.length || 200) * 10 - margin.left - margin.right,
      heightComp = 350 - margin.top - margin.bottom;
    setWidth(widthComp - (widthComp % 50));
    setHeight(heightComp - (heightComp % 50));

    // append the svg object to the body of the page
    let svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", widthComp + margin.left + margin.right)
      .attr("height", heightComp + margin.top + margin.bottom)
      .attr("style", "background-color:#F3F3F3")
      .append("g")
      .attr("transform", `translate(${margin.left},     ${margin.top})`);

    // create tooltip div
    const tooltip = d3
      .select(svgRef.current)
      .append("div")
      .attr("class", "tooltip");

    // adding grid lines
    var x_grid = d3.scaleIdentity().domain([0, widthComp]);
    var y_grid = d3.scaleIdentity().domain([0, heightComp]);

    svg
      .selectAll("line.x")
      .data(x_grid.ticks(data.length))
      .enter()
      .append("line")
      .attr("class", "minor")
      .attr("x1", x_grid)
      .attr("x2", x_grid)
      .attr("y1", 0)
      .attr("y2", heightComp)
      .style("stroke", function (d, i) {
        if (d % 50 !== 0) {
          return "#f3eaea";
        } else {
          return "#f9beba";
        }
      });

    // Draw Y-axis grid lines
    svg
      .selectAll("line.y")
      .data(y_grid.ticks(25))
      .enter()
      .append("line")
      .attr("class", "minor")
      .attr("x1", 0)
      .attr("x2", widthComp)
      .attr("y1", y_grid)
      .attr("y2", y_grid)
      .style("stroke", function (d, i) {
        if (d % 50 !== 0) {
          return "#f3eaea";
        } else {
          return "#f9beba";
        }
      });

    // Add X axis and Y axis
    var x = d3.scaleTime().range([0, widthComp]);
    var y = d3.scaleLinear().range([heightComp, 0]);
    x.domain(
      d3.extent(data, (d) => {
        return d.time;
      })
    );

    let min = d3.min(data, (d) => {
      return d.value;
    });
    let max = d3.max(data, (d) => {
      return d.value;
    });

    const diff = Math.abs(max) - Math.abs(min);
    if (Math.abs(max) > Math.abs(min)) {
      min = min - Math.abs(diff);
    } else if (Math.abs(min) > Math.abs(max)) {
      max = max + Math.abs(diff);
    }

    y.domain([min, max]);
    svg
      .append("g")
      .attr("transform", `translate(0, ${heightComp})`)
      .attr("class", "x-axis")
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeMillisecond.every(50))
          .tickFormat(function (d) {
            const formattedTime = d3.timeFormat("%I:%M:%S:%L %p")(d);
            return formattedTime.replace(/AM|PM/g, (match) =>
              match.toLowerCase()
            );
          })
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .attr("transform", "rotate(-90)")
      .attr("dx", "-.8em")
      .attr("dy", "-.6em");
    // svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    //construct base line
    var baseline = d3
      .line()
      .x((d) => {
        return x(d.time);
      })
      .y(heightComp / 2);

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
        return x(d.time);
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
      .attr("stroke", "#1f1ced")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "8,8");

    const tooltipLineY = svg
      .append("line")
      .attr("class", "tooltip-line")
      .attr("id", "tooltip-line-y")
      .attr("stroke", "#1f1ced")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "8,8");

    // create a listening rectangle
    const listeningRect = svg
      .append("rect")
      .attr("width", widthComp)
      .attr("height", heightComp)
      .attr("opacity", 0);

    listeningRect.on("mousemove", function (event) {
      const [xCoord] = d3.pointer(event, this);
      const bisectDate = d3.bisector((d) => d.time).left;
      const x0 = x.invert(xCoord);
      const i = bisectDate(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0 - d0.time > d1.time - x0 ? d1 : d0;
      const xPos = x(d.time);
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
        .attr("y2", heightComp);
      tooltipLineY
        .style("display", "block")
        .attr("y1", yPos)
        .attr("y2", yPos)
        .attr("x1", 0)
        .attr("x2", widthComp);

      // add in our tooltip
      tooltip
        .style("display", "block")
        .style("left", `${xPos}px`)
        .style("top", `${yPos}px`)
        .html(`${d.value !== undefined ? d.value.toFixed(2) : "N/A"}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: "900px",
        overflow: "auto",
        margin: "auto",
        position: "relative",
        marginTop: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "fixed" }}>
        <button>Add Range</button>
      </div>
      <div style={{ marginTop: 40 }} ref={svgRef}></div>
    </div>
  );
}

export default App;
