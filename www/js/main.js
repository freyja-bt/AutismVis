var margin = { top: 50, right: 50, bottom: 50, left: 50 },
    width = 0.6 * (window.innerWidth - margin.left - margin.right),
    height = window.innerHeight - margin.top - margin.bottom;

blue1 = "#0096c7" //received before
blue2 = "#a9d6e5" //received after
gray1 = "#dee2e6" //none
gray0 = "#343a40" //all

//Autism Providers
var p2pDataGA
var ageData
var prevalenceData
var us

currVis = 0
totalVis = 5

var svg = d3.select(".fixed").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("class", "mainVisGroup")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

var tool_tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function (d) {
        return "<div class = 'label'>Country </div>" + d.country
            + "<br><br><div class = 'label'>Year </div>" + d.year
            + "<br><br><div class = 'label'>Refugees </div>" + numberWithCommas(d.yearTotal)
    });



var serviceAvailability, services
var totalPopulation = 14637 / 10

var cols = 50//200;
var size = width / cols;

var unitXScale, unitNodes, xAxis, unitYScale, yAxis
var scrollToExplore = false;

//unit vis for services cliff
function servicesCliffVis() {
    //TODO: removed unnecessary DOM elements]
    if (!d3.select(".unitVisGroup").empty()) {
        d3.select(".unitVisGroup").style("display", "block");
        //TODO: refresh to all pixels
        showUnits();
        return;
    }

    bottomMargin = 100;
    height2 = height - bottomMargin //leave some space at the bottom
    serviceAvailability = {
        'Speech-language therapy': {
            'before': 66, 'after': 10
        },
        'Personal assistant': {
            'before': 54, 'after': 12
        },
        'Social work': {
            'before': 58, 'after': 22
        },
        'Case Management': {
            'before': 67, 'after': 42
        },
        'Transportation': {
            'before': 50, 'after': 30
        },
        'Occupational or life skills therapy': {
            'before': 51, 'after': 32
        },
        'Psychological or mental health': {
            'before': 41, 'after': 30
        },
        'Respite care': {
            'before': 23, 'after': 13
        },
        'Diagnostic medical services': {
            'before': 37, 'after': 28
        },
        'Assistive technology': {
            'before': 15, 'after': 6
        },
        'Physical therapy': {
            'before': 14, 'after': 7
        }
    }
    services = Object.keys(serviceAvailability)

    d3.select("#updateServiceType")
        .selectAll('option')
        .data(services)
        .enter()
        .append('option')
        .text(function (d) {
            return d
        })
        .attr("value", function (d) {
            return d
        })

    unitXScale = d3.scaleLinear().range([0, width])
    unitXScale.domain([0, cols])

    unitNodes = d3.range(totalPopulation).map((d, i) => {
        yStep = Math.floor(i / cols)
        return {
            xPos: unitXScale(i % cols),
            yPos: height2 - (Math.floor((i / cols)) * size),
            size: size
        }
    })



    xAxis = d3.axisBottom()
        .scale(unitXScale)

    unitVisGroup = svg.append('g').attr("class", "unitVisGroup")
    unitVisGroup.append('g')
        .attr('transform', 'translate(0,' + (+height2) + ')')
        .call(xAxis)
        .attr('class', 'xAxisUnit')
        .selectAll("text")
        //.style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em")


    let yScaleRange = totalPopulation / cols * size

    unitYScale = d3.scaleLinear().range([height2, height2 - yScaleRange])
    let yScaleUnits = yScaleRange / size

    unitYScale.domain([0, yScaleUnits * cols])

    yAxis = d3.axisLeft()
        .scale(unitYScale);

    unitVisGroup.append("g")
        .call(yAxis)
        .attr('class', 'yAxisUnit')



    showUnits()


    //one pixel represents 10 youths
    legendSvg = d3.selectAll(".nlts2Pixel")
    legendSvg.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("height", 20)
        .attr("width", 20)
        .style("fill", "black")

    legendSvg.append("text")
        .attr("x", 40)
        .attr("y", 25)
        .text("=")

    data = d3.range(10).map(d => {
        return { id: d }
    })
    persons = legendSvg.append('g')
        .attr("transform", "translate(60,10)")

    persons.selectAll(".person")
        .data(data)
        .enter()
        .append("svg:image")
        .attr("xlink:href", function (d) { return "./images/person_black.png" })
        .attr("x", function (d) {
            return d.id * 25
        })
        .attr("y", 0)
        .attr("height", 0)
        .attr("width", 0)
        .transition()
        .duration(1000)
        .delay(d => { return d.id * 100 })
        .attr("height", 20)
        .attr("width", 20)
    //.style("fill", "red");



}

function showUnits(service = null, ratio = null) {
    unitVisGroup = svg.select(".unitVisGroup");

    var units = unitVisGroup
        .selectAll('.unit')
        .data(unitNodes)

    var unitsEnter = units
        .enter()
        .append('rect')

    units = units.merge(unitsEnter);

    units
        .attr('class', 'unit')
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })
        .attr('x', function (d, i) {
            return d.xPos;
        })
        .attr('y', function (d) {
            return d.yPos - size;
        })
        .style("fill", gray0)

    //gray out units
    if (ratio != null) {
        unitsToShow = totalPopulation * ratio / 100
        unitNodes.forEach((d, i) => {
            if (i > unitsToShow) {
                d.class = 'none'
            }
            else {
                d.class = ''
            }
        })
        totalWithoutServices = totalPopulation - unitsToShow

        unitVisGroup.selectAll('.unit')
            .filter(d => { return d.class == 'none' })
            .transition()
            .duration(1000)
            .delay(function (d, i) {
                return (totalWithoutServices - i) * 10
            })
            .style("fill", gray1)
    }

}

function showUnitsBefore(service = null) {
    if (scrollToExplore) {
        return;
    }
    unitVisGroup = svg.select(".unitVisGroup");
    if (service != null) {
        ratioBefore = service['before']
        ratioAfter = service['after']
        unitsBefore = totalPopulation * ratioBefore / 100

        unitNodesToShow = unitNodes.filter((d, i) => {
            if (i < unitsBefore) {
                return true;
            }
        })
        unitNodes.forEach((d, i) => {
            if (i < unitsBefore) {
                d.class = 'before'
            }
            else {
                d.class = 'none'
            }
        })
    }

    unitVisGroup.selectAll('.unit').filter((d, i) => { return d.class == 'none' })
        // .transition(1000)
        // .delay((d,i) => {return i*10})
        .style('fill', gray1)

    unitVisGroup.selectAll('.unit').filter((d, i) => { return d.class == 'before' })
        .style('fill', blue1)


    //legend
    ordinal = d3.scaleOrdinal()
        .range([blue1, gray1])
        .domain(["Received service", "Did not receive service"]);

    var barLegendSvg = d3.select(".servicesBefore");

    barLegendSvg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,20)");

    var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(10)
        .scale(ordinal);

    barLegendSvg.select(".legendOrdinal")
        .call(legendOrdinal);

}
function showUnitsAfter(service = null) {
    if (scrollToExplore) {
        return;
    }
    unitVisGroup = svg.select(".unitVisGroup");

    if (service != null) {
        ratioBefore = service['before']
        ratioAfter = service['after']
        unitsBefore = totalPopulation * ratioBefore / 100
        unitsAfter = totalPopulation * ratioAfter / 100

        console.log(unitsBefore)
        console.log(unitsAfter)
        unitNodes.forEach((d, i) => {
            if (i > unitsAfter && i < unitsBefore) {
                d.class = 'after'
            }
            if (i < unitsAfter) {
                d.class = 'before'
            }
        })

    }


    var units = unitVisGroup
        .selectAll('.unit')
        .filter((d, i) => {
            return d.class == 'after'
        })
    total = units.nodes().length

    units.transition()
        .duration(1000)
        .delay((d, i) => { return (total - i) * 5 })
        .style("fill", blue2)

    unitVisGroup.selectAll(".unit")
        .filter((d, i) => {
            return d.class == 'before'
        })
        .style("fill", blue1)


    //legend
    
    ordinal = d3.scaleOrdinal()
        .range([gray1, blue2, blue1])
        .domain(["Did not receive service","Did not receive service after high school", "Received service during and after high school"]);

    var barLegendSvg = d3.select(".servicesAfter");

    barLegendSvg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,20)");

    var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(10)
        .scale(ordinal);

    barLegendSvg.select(".legendOrdinal")
        .call(legendOrdinal);
}


function dummyfunction() {
    console.log("just displaying nothing ---- ")
}

function getYear(node, cumulative) {
    for (i = 2011; i <= 2018; i++) {
        if (node < Math.round(cumulative[i] / ratio)) {
            return i;
        }
    }
    return 0;
}


//waypoints scroll constructor
function scroll(n, offset, func1, func2) {
    return new Waypoint({
        element: document.getElementById(n),
        handler: function (direction) {
            direction == 'down' ? func1() : func2();
        },
        //start 75% from the top of the div
        offset: offset
    });
};



// d3.queue()
//     .defer(d3.json, "data/us.json")
//     .defer(d3.csv, "data/adult_prevalence.csv", numeric)
//     .defer(d3.csv, "data/P2PData.csv")
//     .await(function (error, us, prevalenceData, p2pData) {
d3.csv("data/P2PData.csv", function (dataSet) {
    p2pData = dataSet

    p2pDataGA = p2pData.filter(d => { if (d["State"] == "GA") return true; })
    ageData = d3.nest()
        .key(function (d) { return d["Age"] })
        .rollup(function (v) { return v.length })
        .object(p2pDataGA)

    //starts with this
    childrenVsAdults()

    new scroll('div0', '50%', drawPrevalenceMap, childrenVsAdults);
    new scroll('zoomGeorgia', "50%", zoomGeorgia, drawPrevalenceMap)
    new scroll('georgiaServices', '50%', georgiaServices, zoomGeorgia)
    new scroll('div1', '50%', servicesCliffVisDummy, georgiaServices);

    new scroll('div2', '50%', showNoServices, servicesCliffVisDummy);
    new scroll('div3', '50%', showSpeechTherapyServicesBefore, showNoServices);
    new scroll('div4', '50%', showSpeechTherapyServicesAfter, showSpeechTherapyServicesBefore);
    new scroll('div5', '50%', exploreServices, showSpeechTherapyServicesAfter);

    d3.select("#nlts2Outcomes").on("click", function () {
        scrollToExplore = true;
        document.getElementById('div5').scrollIntoView();
    })
    d3.select("#providersGA").on("click", function () {
        document.getElementById('georgiaServices').scrollIntoView();
    })
    d3.select("#adultsPrevalence").on("click", function () {
        document.getElementById('div0').scrollIntoView();
    })

    d3.select("#nextVis").on("click", function () {
        console.log("next")
        currVis = currVis + 1
        updateCurrVis(currVis)
    })
    d3.select("#prevVis").on("click", function () {
        currVis = currVis - 1
        updateCurrVis(currVis)
    })
})

function servicesCliffVisDummy() {
    //if(d3.select(""))
    emptySvg()
    servicesCliffVis()
}
function emptySvg() {
    console.log("emptying svg")
    //svg.selectAll("*").remove();
    svg.select(".cartogram").style("display", "none")
    svg.select(".genderBarGraph").style("display", "none");
    d3.select("#leafletMap").style("display", "none");
}

function updateCurrVis() {
    d3.select("#div" + currVis).style("display", "block")
    for (let vis = 0; vis < totalVis; vis++) {
        if (vis != currVis) {
            d3.select("#div" + vis).style("display", "none")
        }
    }


    if (currVis == 0) {
        servicesCliffVis()
    }
    else if (currVis == 1) {
        showNoServices()
    }
    else if (currVis == 2) {
        showSpeechTherapyServicesBefore()
    }
    else if (currVis == 3) {
        showSpeechTherapyServicesAfter()
    }
    else if (currVis == 4) {
        exploreServices()
    }
}
function showNoServices() {
    if (scrollToExplore) {
        return;
    }
    showUnits(service = null, ratio = (100 - 26))

    //legend
    ordinal = d3.scaleOrdinal()
        .range([gray0, gray1])
        .domain(["Received Services", "Did Not Receive Services"]);

    var barLegendSvg = d3.select(".noService");

    barLegendSvg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,20)");

    var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(10)
        .scale(ordinal);

    barLegendSvg.select(".legendOrdinal")
        .call(legendOrdinal);
}
function showSpeechTherapyServicesBefore() {
    //showUnits(service = null, serviceAvailability['Speech-language therapy'].before)
    showUnitsBefore(serviceAvailability['Speech-language therapy'])
}
function showSpeechTherapyServicesAfter() {
    showUnitsAfter(serviceAvailability['Speech-language therapy'])
    d3.select("#updateServiceType").style("display", "none");
}
function exploreServices() {
    //TODO: create from scratch so that direct link works
    // unitNodes.forEach((d) => { d.class = '' })
    // showUnits()
    if (scrollToExplore) {
        scrollToExplore = false;
    }
    servicesCliffVis()

    d3.select("#updateServiceType").style("display", "block");

    d3.select("#updateServiceType").on("change", function (d) {
        let selectedServiceType = d3.select(this).property("value")
        console.log(selectedServiceType);
        //showUnits(serviceAvailability[selectedServiceType])
        showUnitsBefore(serviceAvailability[selectedServiceType])
        setTimeout(() => {
            showUnitsAfter(serviceAvailability[selectedServiceType])
        }, 1000);
    })

    //legend
    
    ordinal = d3.scaleOrdinal()
        .range([gray1, blue2, blue1])
        .domain(["Did not receive service","Did not receive service after high school", "Received service during and after high school"]);

    var barLegendSvg = d3.select(".exploreServices");

    barLegendSvg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,20)");

    var legendOrdinal = d3.legendColor()
        .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
        .shapePadding(10)
        .scale(ordinal);

    barLegendSvg.select(".legendOrdinal")
        .call(legendOrdinal);

}

var simulation;
var nodes = [];
function ticked() {
    var u = d3.select('svg')
        .selectAll('.node')
        .data(nodes)


    u.enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', function (d) {
            return d.radius
        })
        .merge(u)
        .attr('cx', function (d) {
            return d.x
        })
        .attr('cy', function (d) {
            return d.y
        })

    u.exit().remove()
}
function createStickyNodes(step) {

    radius = 8
    var numNodes = 100 * step;


    nodes = d3.range(numNodes).map(function (d) {
        return { radius: radius }
    })

    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(0.1))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(function (d) {
            return d.radius
        }))
        .on('tick', ticked);


}
//for sticky nodes
function updateVis(step) {
    delay = 1500
    setTimeout(() => {
        createStickyNodes(step)
    }, delay * step);
}

function showVis1() {
    svg.selectAll('*').remove()
    createStickyNodes(1);
    for (let step = 2; step <= 10; step++) {
        updateVis(step);
    }
}
function showVis2() {
    svg.selectAll('*').remove()

    height = 500
    // set the ranges
    let x = d3.scaleBand()
        .range([0, width / 2])
        .padding(0.1);

    let y = d3.scaleLinear()
        .range([height, 0]);

    ages = Object.keys(ageData);
    ageDataArray = []
    ages.forEach(age => {
        ageDataArray.push({ category: age, count: ageData[age] })
    })
    console.log(ageDataArray);
    x.domain(["Under 3", "3 to 5", "6 to 11", "12 to 18", "19 to 21", "21+"]);
    console.log(x.domain())
    y.domain([0, d3.max(ageDataArray, function (d) { return d.count; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
        .data(ageDataArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.category); })
        .attr("width", x.bandwidth())
        .attr("y", function (d) { return y(d.count); })
        .attr("height", function (d) { return height - y(d.count); });

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y));

}
//interactive map
function showVis3() {
    // svg.selectAll('*').remove()
    // var mymap = L.map('mapid').setView([33.7541825, -84.390626], 13);
    // accessToken = 'pk.eyJ1Ijoic2hyaXNodGlhayIsImEiOiJja243cG55dzMwMXFkMnBxeGE0aTdzdzhhIn0.FwMnMNXY1bhjWrLKPVyUxw'
    // L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
    //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    //     maxZoom: 18,
    //     id: 'mapbox/streets-v11',
    //     tileSize: 512,
    //     zoomOffset: -1,
    //     accessToken: 'your.mapbox.access.token'
    // }).addTo(mymap);

    // d3.csv('data/geoLocations.csv', function (geoLocations) {
    //     geoLocations.forEach((loc,i) => {
    //         var marker = L.marker([loc['Latitude'], loc['Longitude']]).addTo(mymap);
    //         marker.id = i
    //     })

    //     var popup = L.popup();

    //     function onMapClick(e) {
    //         console.log(e.id);
    //         popup
    //             .setLatLng(e.latlng)
    //             .setContent("You clicked the map at " + e.latlng.toString())
    //             .openOn(mymap);
    //     }

    //     mymap.on('click', onMapClick);
    // })

}

function conclusion() {
    d3.selectAll(".ResettlementRatioImage").remove();
    d3.selectAll(".dropdownLabel").remove();
    d3.selectAll(".dropdown").remove();
    d3.selectAll('rect').remove();
    d3.selectAll('.timeaxis').remove();

    document.getElementsByClassName('container')[0].setAttribute("style", "z-index:100");
}

function donate() {

}


function numeric(row) {
    for (var key in row) {
        if (key == "Cases" || key == "Prevalence" || key == "FemaleCases" || key == "MaleCases" || key == "FemalePrevalence" || key == "MalePrevalence") {
            row[key] = +row[key];
        }
    }
    delete row[""];
    return row;
}

