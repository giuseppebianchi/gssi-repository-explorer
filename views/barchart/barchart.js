import "/shared/navbar.js";
import { links, nodes } from "./data";
import * as d3 from "d3";

import "./barchart.css";

let MAX_VALUE,
  MIN_VALUE,
  chartColor = "#60A5FA";
let ACTIVELAYER = "Model::Coverage",
  checkClick = false,
  updating = false;
let [TYPE_PROPERTY, QUALITY_PROPERTY] = ACTIVELAYER.split("::");

const getMaxMinValuesFromNodes = (nodes, prop, type) => {
  //default values
  const default_values = [0, 100];
  let parse_nodes;
  //can be used either nodes object or force.nodes() array
  Array.isArray(nodes)
    ? (parse_nodes = nodes)
    : (parse_nodes = Object.values(nodes));

  const filter_array = parse_nodes
    .filter((item) =>
      item.type == type ? +item.quality[QUALITY_PROPERTY] : null
    )
    .map((i) => parseFloat(i.quality[QUALITY_PROPERTY]));

  //check if there are enough objects with valid SIZE_PROPERTY values
  if (filter_array < 2) return default_values;

  const sorted_array = filter_array.sort((prev, current) => prev - current);

  const min = sorted_array[0],
    max = sorted_array[sorted_array.length - 1];

  return min + max ? [min, max] : default_values;
};
//get integer number between
const getRelativeValue = (n, round) =>
  round
    ? Math.round((n * MAX_NODE_SIZE) / MAX_VALUE)
    : (n * MAX_NODE_SIZE) / MAX_VALUE;
const getLongestWordSize = (nodes) => {
  let parse_nodes,
    max = 0;
  //can be used either nodes object or force.nodes() array
  Array.isArray(nodes)
    ? (parse_nodes = nodes)
    : (parse_nodes = Object.values(nodes));
  parse_nodes.map((i) => (i.info.length > max ? (max = i.info.length) : null));
  return max;
};

//init min and max values
[MIN_VALUE, MAX_VALUE] = getMaxMinValuesFromNodes(
  nodes,
  QUALITY_PROPERTY,
  TYPE_PROPERTY
);

var data = d3.values(nodes).filter((i) => i.type == TYPE_PROPERTY);
/*var data = d3.values(nodes).sort((a, b) => {
	const aa = a.name.toUpperCase(), bb = b.name.toUpperCase()
	return aa < bb ? -1 : aa > bb ? 1 : 0
});*/

//check labels x axis height
let xLabelsSize = getLongestWordSize(data) * 7;
const barchart = document.getElementById("barchart");

// set the dimensions and margins of the graph
let margin = {
  top: 100,
  right: 70 /*+ data[data.length-1].info.length*4*/,
  bottom: xLabelsSize,
  left: 40 + (data[0]?.info.length * 4 || 0),
};
let width = 30 * data.length; //window.innerWidth - margin.left - margin.right,
//height = window.innerHeight - document.getElementById("barchart").offsetTop - margin.top - (xLabelsSize < 250 ? margin.bottom : 0);
let height =
  xLabelsSize > window.innerHeight / 2
    ? window.innerHeight - barchart.offsetTop - 30
    : window.innerHeight - barchart.offsetTop - margin.top - margin.bottom;

// append the svg object to the body of the page
var main = d3
  .select("#barchart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

var svg = main
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// X axis
var x = d3
  .scaleBand()
  .range([0, width])
  .domain(
    data.map(function (d) {
      return d.info;
    })
  )
  .padding(0.3);

let xAxis = svg
  .append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class", "domain-label")
  .call(d3.axisBottom(x));

let xAxisLabels = xAxis
  .selectAll("text")
  .attr("transform", "translate(-10,0)rotate(-45)")
  .style("text-anchor", "end");
//.attr("transform", "translate(10, 5)rotate(45)")
//.style("text-anchor", "start");

// Add Y axis
var y = d3.scaleLinear().domain([0, MAX_VALUE]).range([height, 0]);

const yAxis = svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

// Bars
const bars = svg
  .selectAll("value-bar")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", function (d) {
    return x(d.info);
  })
  .attr("width", x.bandwidth())
  .attr("fill", chartColor)
  // no bar at the beginning thus:
  .attr("height", function (d) {
    return height - y(0);
  }) // always equal to 0
  .attr("y", function (d) {
    return y(0);
  }); // always equal to 0

// Animation
svg
  .selectAll("rect")
  .transition()
  .duration(800)
  .attr("y", function (d) {
    return y(
      d.type == TYPE_PROPERTY && +d.quality[QUALITY_PROPERTY]
        ? +d.quality[QUALITY_PROPERTY]
        : 0
    );
  })
  .attr("height", function (d) {
    return (
      height -
      y(
        d.type == TYPE_PROPERTY && +d.quality[QUALITY_PROPERTY]
          ? +d.quality[QUALITY_PROPERTY]
          : 0
      )
    );
  })
  .delay((d, i) => i * 100);

bars
  .on("mousemove", mousemove)
  .on("mouseleave", mouseout)
  .on("mouseenter", mouseenter);

//Tooltip
var div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip custom-tooltip")
  .style("opacity", 0);

function mouseenter(d) {
  //mouse events disabled while updating bars input data
  if (updating) {
    return;
  }
  const curr_bar = d3.select(this);
  curr_bar
    .transition("highlightbar")
    .duration(500)
    //.attr("r", 16);
    .attr("fill", "#FDE68A");

  xAxis
    .selectAll("text")
    .attr("class", (i) => (i == d.name ? "active-label" : null));

  div.transition("highlightbar").duration(300).style("opacity", 1);

  div.html(
    `<h3>${d.info}</h3><p><strong>${QUALITY_PROPERTY}</strong>: ${d.quality[QUALITY_PROPERTY]}</p>`
  );
}

function mousemove(d) {
  //mouse events disabled while updating bars input data
  if (updating) {
    return;
  }

  div.style(
    "transform",
    `translate(${d3.event.pageX}px, ${
      d3.event.pageY - (div.node().clientHeight + 10)
    }px)`
  );
}

function mouseout(d) {
  //mouse events disabled while updating bars input data
  if (updating) {
    return;
  }
  const curr_bar = d3.select(this);

  curr_bar
    .transition("highlightbar")
    .duration(500)
    //.attr("r", 16);
    .attr("fill", chartColor);

  //debugger;
  xAxis.selectAll(".active-label").attr("class", "");

  div.transition("highlightbar").duration(300).style("opacity", 0);
}

document.querySelectorAll(".select-activelayer").forEach((item) =>
  item.addEventListener("click", (e) => {
    e.preventDefault();
    //stop any animations
    svg.selectAll("rect").transition();

    //mouse events disabled while updating bars input data
    updating = true;
    ACTIVELAYER = e.currentTarget.dataset.layerid;
    const properties = ACTIVELAYER.split("::");
    TYPE_PROPERTY = properties[0];
    QUALITY_PROPERTY = properties[1];

    //set min and max values by selected properties
    [MIN_VALUE, MAX_VALUE] = getMaxMinValuesFromNodes(
      nodes,
      QUALITY_PROPERTY,
      TYPE_PROPERTY
    );

    //new data
    data = d3.values(nodes).filter((i) => i.type == TYPE_PROPERTY);

    //Calculate new sizes and positions
    width = data.length * 30;
    margin = {
      top: 100,
      right: 70,
      bottom: getLongestWordSize(data) * 7,
      left: 40 + (data[0]?.info.length * 4 || 0),
    };
    height =
      xLabelsSize > window.innerHeight / 2
        ? window.innerHeight - barchart.offsetTop - 30
        : window.innerHeight - barchart.offsetTop - margin.top - margin.bottom;
    main.attr("width", width + margin.left + margin.right);
    svg
      .transition()
      .duration(1000)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //X AXIS
    x.range([0, width]).domain(
      data.map(function (d) {
        return d.info;
      })
    );

    xAxis
      .transition("updatebars")
      .duration(1000)
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

    //Y AXIS
    y.domain([0, MAX_VALUE]).range([height, 0]);
    yAxis.call(d3.axisLeft(y));

    bars
      .data(data)
      .enter()
      .append("rect")
      .attr("x", function (d) {
        return x(d.info);
      })
      .attr("width", x.bandwidth())
      .attr("fill", chartColor)
      // no bar at the beginning thus:
      .attr("height", function (d) {
        return height - y(0);
      }) // always equal to 0
      .attr("y", function (d) {
        return y(0);
      }); // always equal to 0

    // Animation
    svg
      .selectAll("rect")
      .transition("updatebars")
      .duration(800)
      .attr("y", function (d) {
        return y(
          d.type == TYPE_PROPERTY && +d.quality[QUALITY_PROPERTY]
            ? +d.quality[QUALITY_PROPERTY]
            : 0
        );
      })
      .attr("height", function (d) {
        return (
          height -
          y(
            d.type == TYPE_PROPERTY && +d.quality[QUALITY_PROPERTY]
              ? d.quality[QUALITY_PROPERTY]
              : 0
          )
        );
      });

    //restore mouse events after update
    setTimeout(() => {
      updating = false;
    }, 1000);
  })
);
