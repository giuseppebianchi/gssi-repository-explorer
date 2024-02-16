import "/shared/navbar";
import { links, nodes, subject } from "./data";
import gauge from "./gauge";

import "/shared/main.css";
import "../graph/graph.css";
import "./detail.css";

const container = document.getElementById("main-wrapper"),
  repo = document.getElementById("repo"),
  card = document.getElementById("card-details"),
  navbar = document.getElementById("navbar-details");

const vw_offset = card.clientWidth + 50;

const MIN_LINK_DISTANCE = 200,
  MIN_NODE_SIZE = 5,
  MAX_NODE_SIZE = 30,
  MAX_SCALE = 3;

const width = window.innerWidth, // container.clientWidth - (parseFloat(getComputedStyle(container).paddingLeft) * 2),
  height = window.innerHeight; // - repo.offsetTop;

const backgroundNodeLabel = "#efefef";

let ACTIVELAYER = "A::A",
  checkClick = false;
let [TYPE_PROPERTY, SIZE_PROPERTY] = ACTIVELAYER.split("::");

let MAX_VALUE, MIN_VALUE;

const getMaxMinValuesFromNodes = (nodes) => {
  //default values
  const default_values = [0, 100];
  let parse_nodes;
  //can be used either nodes object or force.nodes() array
  Array.isArray(nodes)
    ? (parse_nodes = nodes)
    : (parse_nodes = Object.values(nodes));

  const filter_array = parse_nodes
    .filter((item) =>
      item.type == TYPE_PROPERTY ? +item.quality[SIZE_PROPERTY] : null
    )
    .map((i) => parseFloat(i.quality[SIZE_PROPERTY]));

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

//get a valid numeric value from SIZE_PROPERTY property
const getNodeSize = (d) => {
  const value = d.quality[SIZE_PROPERTY],
    type = d.type;

  //check type, if it's not TYPE_PROPERTY return default size
  if (type !== TYPE_PROPERTY) {
    return MIN_NODE_SIZE;
  }

  //type is ok, then node's size depends on d..quality.SIZE_PROPERTY's value

  //check if value is a number, null or undefined
  const num = +value ? +value : 0;

  //get relative value
  const rel = getRelativeValue(num);

  return rel + MIN_NODE_SIZE;
};

//set distance for each edge, adding an offset based on nodes' size
const linkDistanceByNodeSize = (d) => {
  let offset = 0;

  //get source node offset
  const source_offset = getNodeSize(d.source);
  if (source_offset > MIN_NODE_SIZE) offset += source_offset;

  //get target node offset
  const target_offset = getNodeSize(d.target);
  if (target_offset > MIN_NODE_SIZE) offset += target_offset;

  return offset + MIN_LINK_DISTANCE;
};

//init min and max values
[MIN_VALUE, MAX_VALUE] = getMaxMinValuesFromNodes(nodes);

links.forEach(function (link) {
  link.source =
    nodes[link.source] || (nodes[link.source] = { name: link.source });
  link.target =
    nodes[link.target] || (nodes[link.target] = { name: link.target });
  link.value = +link.value;
});

var force = d3.layout
  .force()
  .nodes(d3.values(nodes))
  .links(links)
  .size([width + vw_offset, height])
  //.linkDistance(60)
  .linkDistance(linkDistanceByNodeSize)
  .charge(-700)
  //.charge(-300)
  .on("tick", tick)
  .start();

var zoom = d3.behavior
  .zoom()
  .on("zoom", function (e) {
    svg.attr(
      "transform",
      "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")"
    );
  })
  .scaleExtent([0.3, MAX_SCALE])
  .on("zoomend", zoomend);

/*var svg = d3.select("div#repo").append("svg")
    .attr("width", width)
    .attr("height", height);*/
var svg = d3
  .select("div#repo")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  .call(zoom)
  .append("g");

function zoomend(e) {
  const box = this.getBBox();
  let translated = zoom.translate();

  if (box.width < window.innerWidth) {
    //when box is smaller than viewport check its own width to limit panning
    if (box.x < vw_offset - box.width / 2)
      translated[0] += vw_offset - box.width / 2 - box.x;
    else if (box.x > window.innerWidth - box.width / 2)
      translated[0] -= box.x - (window.innerWidth - box.width / 2);
  } else {
    //when box is bigger than viewport check the center of viewport to limit panning
    if (box.x > window.innerWidth / 2)
      translated[0] -= box.x - window.innerWidth / 2;
    else if (box.x + box.width < vw_offset + window.innerWidth / 2)
      translated[0] += window.innerWidth / 2 - (box.x + box.width);
  }

  if (box.height < window.innerHeight) {
    //when box is smaller than viewport check its own height to limit panning
    if (box.y < -box.height / 2) translated[1] += -box.height / 2 - box.y;
    else if (box.y > window.innerHeight - box.height / 2)
      translated[1] -= box.y - (window.innerHeight - box.height / 2);
  } else {
    //when box is bigger than viewport check the center of viewport to limit panning
    if (box.y > window.innerHeight / 2)
      translated[1] -= box.y - window.innerHeight / 2;
    else if (box.y + box.height < window.innerHeight / 2)
      translated[1] += window.innerWidth / 2 - (box.y + box.height);
  }
  zoom.translate(translated);
  svg
    .transition()
    .duration(300)
    .attr(
      "transform",
      "translate(" + translated + ")" + " scale(" + zoom.scale() + ")"
    );
}
// build the arrow.
svg
  .append("svg:defs")
  .selectAll("marker")
  .data(["end"]) // Different link/path types can be defined here
  .enter()
  .append("svg:marker") // This section adds in the arrows
  .attr("id", String)
  .attr("viewBox", "0 -5 10 10")
  //.attr("refX", 15)
  //.attr("refY", -1.5)
  .attr("refX", 0)
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("svg:path")
  .attr("d", "M0,-5L10,0L0,5");

// add the links and the arrows
var path = svg
  .append("svg:g")
  .selectAll("path")
  .data(force.links())
  .enter()
  .append("svg:path")
  .attr("class", function (d) {
    return "link " + d.relationtype;
  })
  //.attr("class", "link")
  .attr("id", (d, i) =>
    d.relationtype === "Distance"
      ? "path_" + d.source.name + "_" + d.target.name
      : null
  )
  //.style("stroke-dasharray", ("3, 3"))
  .attr("marker-end", (link) =>
    link.type === "unidirectional" ? "url(#end)" : 0
  );
//TEXTPATH
const labelpath = svg
  .append("g")
  .selectAll("text")
  .data(links.filter((d) => d.relationtype === "Distance"))
  .enter()
  .append("g")
  .attr("class", "path-label");
const textpath = labelpath
  .append("text")
  .attr("class", "link-label")
  .append("textPath")
  .attr("xlink:href", (d, i) => "#path_" + d.source.name + "_" + d.target.name)
  .attr("text-anchor", "middle")
  .attr("startOffset", "50%")
  .text((d) => d.value);

// define the nodes
var node = svg
  .selectAll(".node")
  .data(force.nodes())
  .enter()
  .append("g")
  //.attr("class", "node")
  .attr("class", function (d) {
    return "node " + d.type;
  })
  .call(force.drag);

node
  .on("mouseenter", mouseover)
  //.on("mouseout", mouseout)
  //.on("mouseover", mouseover)
  .on("mouseleave", mouseout)
  .on("mousedown", mousedown)
  .on("mouseup", mouseup);

// add the nodes
node
  .append("circle")
  .attr("class", function (d) {
    return d.virtual;
  })
  //.attr("r", 5)
  .attr("r", (d) => {
    const radius = getNodeSize(d);
    d.radius = radius;
    return radius;
  });
// add the text
const nodeLabel = node
  .append("text")
  // .attr("x", 12)
  .attr("x", (d) => d.radius + 7)
  .attr("dy", ".35em")
  .text(function (d) {
    return d.name;
  })
  .attr("class", (d) => "node-label")
  .call(getTextBox);

//add background text
const bgNodeLabel = node
  .insert("rect", "text")
  .attr("rx", 10)
  .attr("class", "node-label-bg")
  //.style("fill", "#efefef")
  .attr("x", (d) => d.bbox.x - 2.5)
  .attr("y", (d) => -d.bbox.height)
  //.attr("width", d => {debugger})
  .attr("width", (d) => d.bbox.width + 10)
  .attr("height", (d) => d.bbox.height * 2);
function getTextBox(selection) {
  selection.each(function (d) {
    d.bbox = this.getBBox();
  });
}

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

// add the curvy lines
function tick() {
  path.attr("d", function (d) {
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);
    return (
      "M" +
      d.source.x +
      "," +
      d.source.y +
      "A" +
      dr +
      "," +
      dr +
      " 0 0,1 " +
      d.target.x +
      "," +
      d.target.y
    );
  });

  node.attr("transform", function (d) {
    return "translate(" + d.x + "," + d.y + ")";
  });

  // set distance based on node's radius
  path.attr("d", function (d, i) {
    // length of current path
    const pl = this.getTotalLength();

    //calculate radius of target node, including the arrow/marker's size
    //const r = getNodeSize(d.target) + Math.sqrt(6**2 + 6**2);
    const r = d.target.radius + Math.sqrt(6 ** 2 + 6 ** 2);
    //get the point on the the target node's circumference
    const m = this.getPointAtLength(pl - r);
    var dx = d.target.x - d.source.x,
      dy = d.target.y - d.source.y,
      dr = Math.sqrt(dx * dx + dy * dy);

    var result =
      "M" +
      d.source.x +
      "," +
      d.source.y +
      "A" +
      dr +
      "," +
      dr +
      " 0 0,1 " +
      m.x +
      "," +
      m.y;

    return result;
  });
}

var div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip custom-tooltip box-shadow")
  .style("opacity", 0);

function mousedown(d) {
  d3.event.stopPropagation();
  checkClick = true;
}

function mouseup(d) {
  checkClick = false;
}

function mouseover(d) {
  //ignore if node is clicked
  if (checkClick) {
    return;
  }

  const curr_node = d3.select(this);
  //here you can check if node is already in front
  //if it's not, bring node to front
  curr_node.moveToFront();

  curr_node
    .select("circle")
    .transition()
    .duration(500)
    //.attr("r", 16);
    .attr("r", (d) => d.radius * 1.3);

  //HIGHLIGHT LABEL
  curr_node.select("text").attr("fill", "#fff");
  curr_node.select("rect").style("fill", "#6EE7B7");

  div.transition().duration(300).style("opacity", 1);

  //const attrs = getAttributesList(d)
  div
    .html(
      `<h3>${d.info}</h3>
   		<ul class="tooltip-attr-list">
   		${getAttributesList(d.quality)}
   		</ul>`
    )
    //.style("left", (d3.event.pageX ) + "px")
    //.style("top", (d3.event.pageY + 100) + "px");
    .style("opacity", 1);
}
function getAttributesList(list) {
  let html = "";
  for (const attr in list) {
    html += `<li>
				<strong>${attr}</strong>: ${list[attr]}
			</li>`;
  }
  return html;
}
function mouseout(d) {
  //ignore if node is clicked
  if (checkClick) {
    return;
  }

  const curr_node = d3.select(this);

  curr_node
    .select("circle")
    .transition()
    .duration(500)
    //.attr("r", 8);
    .attr("r", (d) => d.radius);

  //UNHIGHLIGHT LABEL
  curr_node.select("text").attr("fill", "#333");
  curr_node.select("rect").style("fill", backgroundNodeLabel);

  div.transition().duration(300).style("opacity", 1e-6);
}

document.querySelectorAll(".select-activelayer").forEach((item) =>
  item.addEventListener("click", (e) => {
    e.preventDefault();
    ACTIVELAYER = e.currentTarget.dataset.layerid;
    const properties = ACTIVELAYER.split("::");
    TYPE_PROPERTY = properties[0];
    SIZE_PROPERTY = properties[1];

    //set min and max values by selected properties
    [MIN_VALUE, MAX_VALUE] = getMaxMinValuesFromNodes(nodes);

    force.stop();

    node
      .selectAll("circle")
      .transition()
      .duration(500)
      .attr("r", (d) => {
        const radius = getNodeSize(d);
        d.radius = radius;
        return radius;
      });
    node
      .selectAll("text")
      .attr("x", (d) => d.radius + 7)
      .call(getTextBox);
    node
      .selectAll("rect")
      .attr("x", (d) => d.bbox.x - 2.5)
      .attr("y", (d) => -d.bbox.height)
      .attr("width", (d) => d.bbox.width + 10)
      .attr("height", (d) => d.bbox.height * 2);

    force.start();
  })
);

/* RESPONSIVE */
function updateWindow() {
  x = window.innerWidth;
  y = window.innerHeight;
  force.stop();
  force.size([x + vw_offset, y]);
  force.start();
}
try {
  var ro = new ResizeObserver((entries) => {
    const cr = entries[0].contentRect;
    force.stop();
    force.size([cr.width + vw_offset, cr.height]);
    force.start();
    //svg.attr("width", cr.width).attr("height", cr.height);
  });
  ro.observe(document.body);
} catch (err) {
  console.log("ResizeObserver not available");
  window.addEventListener("resize", updateWindow);
}

//SUBJECT
const navbar_template = (node) => {
  //const {x, y, radius, bbox, fixed, index, name, px, py, quality, ...items} = node;
  const { type, info, virtual } = node;
  let items = { type, info, virtual };
  let navbar = "";
  for (const i in items) {
    navbar += `
        <div class="navbar-item">
            <div class="navbar-item-label">
                ${i}
            </div>
            <div class="navbar-item-label-text">
                ${items[i]}
            </div>
        </div>
        `;
  }
  return navbar;
};
const card_template = (node) => {
  //create gauge
  const { name, quality, type, info, virtual } = node;
  const quality_list = Object.keys(quality)
    .flatMap(
      (i) =>
        `<li><div id="gauge_${i}" class="quality-gauge"></div><span class="quality-label"><strong>${i}</strong>: ${parseFloat(
          node.quality[i]
        ).toFixed(2)}</span></li>`
    )
    .join("");
  return `
    <h1>${name}</h1>
    <hr>
    <ul class="quality-properties">
        ${quality_list}
    </ul>
  `;
};

const detail_object = nodes[subject];
console.log(detail_object);

//applicare Math.round() ad ogni valore min e max
const INFO_QUALITY_ATT = {
  Complexity: {
    min: 0,
    max: 82,
    best: "min",
  },
  Understandability: {
    min: 0,
    max: 3,
    best: "max",
  },
};

//check if subject has been found
if (detail_object) {
  card.innerHTML = card_template(detail_object);
  navbar.innerHTML = navbar_template(detail_object);
  //create gauge
  const size_cont =
    card.clientWidth -
    getComputedStyle(card).paddingLeft.slice(0, -2) * 2 -
    100;
  for (const i in detail_object.quality) {
    const powerGauge = gauge("#gauge_" + i, {
      size: size_cont,
      clipWidth: size_cont,
      clipHeight: 120,
      ringWidth: 20,
      minValue: INFO_QUALITY_ATT[i]
        ? INFO_QUALITY_ATT[i].best === "min"
          ? INFO_QUALITY_ATT[i].max
          : INFO_QUALITY_ATT[i].min
        : 0,
      maxValue: INFO_QUALITY_ATT[i]
        ? INFO_QUALITY_ATT[i].best === "min"
          ? INFO_QUALITY_ATT[i].min
          : INFO_QUALITY_ATT[i].max
        : 100,

      //minAngle: -180,
      //clipHeight: 150,

      minAngle: -135,
      clipHeight: 140,
      maxAngle: 90,
      clipHeight: 150,
      ringInset: 20,
      labelInset: 10,

      pointerWidth: 8,
      pointerTailLength: 5,
      pointerHeadLengthPercent: 0.7, //0.9

      //majorTicks: 190,
      majorTicks: 20,
      labelTicks: 5,
      transitionMs: 6000,
      arcColorFn: d3.interpolateHsl(d3.rgb("#EF4444"), d3.rgb("#10B981")),
      gradient: true,
      //arcColorFn: d3.interpolateHsl(d3.rgb('#ff0000'), d3.rgb('#00ff00'))
    });
    const value = parseFloat(detail_object.quality[i]);
    //check if value is greater than min and lower than max
    value < INFO_QUALITY_ATT[i].min
      ? powerGauge.render(INFO_QUALITY_ATT[i].min)
      : value > INFO_QUALITY_ATT[i].max
      ? powerGauge.render(INFO_QUALITY_ATT[i].max)
      : powerGauge.render(value);
  }
} else {
  card.innerHTML = `<h1>Subject Not Found</h1><p>Check nodes list and refresh the page.</p>`;
}
