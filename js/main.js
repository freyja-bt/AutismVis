var margin = { top: 150, right: 150, bottom: 150, left: 150 },
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight - margin.top - margin.bottom;

blue1 = "#0096c7"
blue2 = "#a9d6e5"
gray1 = "#dee2e6"
gray0 = "#343a40"


currVis = 0
totalVis = 5

var svg = d3.select(".fixed").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
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
var totalPopulation = 14637

var cols = 200;
var size = width / cols;

var unitXScale, unitNodes, xAxis, unitYScale, yAxis

//unit vis for services cliff
function servicesCliffVis() {
    //TODO: removed unnecessary DOM elements

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
            yPos: height - (Math.floor((i / cols)) * size),
            size: size
        }
    })



    xAxis = d3.axisBottom()
        .scale(unitXScale)

    svg.append('g')
        .attr('transform', 'translate(0,' + (+height) + ')')
        .call(xAxis)
        .attr('class', 'xAxisUnit')
        .selectAll("text")
        //.style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", ".15em")


    let yScaleRange = totalPopulation / cols * size

    unitYScale = d3.scaleLinear().range([height, height - yScaleRange])
    let yScaleUnits = yScaleRange / size

    unitYScale.domain([0, yScaleUnits * cols])

    yAxis = d3.axisLeft()
        .scale(unitYScale);

    svg.append("g")
        .call(yAxis)
        .attr('class', 'yAxisUnit')



    showUnits()

    // d3.select("#nextVis").on("click", function () {
    //     console.log("clicked");
    //     //showUnits(27)
    // })

    



}

function showUnits(service = null, ratio = null) {
    var units = svg
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
            else{
                d.class = ''
            }
        })
        svg.selectAll('.unit')
            .filter(d => { return d.class == 'none' })
            // .transition()
            // .duration(1000)
            // .delay(function (d, i) {
            //     return (unitsToShow - i) * 0.5
            // })
            .style("fill", gray1)
    }

}

function showUnitsBefore(service = null) {
    if (service != null) {
        ratioBefore = service['before']
        ratioAfter = service['after']
        unitsBefore = totalPopulation * ratioBefore / 100

        unitNodesToShow = unitNodes.filter((d, i) => {
            if (i < unitsBefore) {
                return true;
            }
        })
        unitNodes.forEach((d,i) => {
            if (i < unitsBefore){
                d.class = 'before'
            }
            else{
                d.class = 'none'
            }
        })
    }

    svg.selectAll('.unit').filter((d,i) => {return d.class == 'none'})
        .style('fill', gray1)

    svg.selectAll('.unit').filter((d,i) => {return d.class == 'before'})
        .style('fill', blue1)

}
function showUnitsAfter(service = null) {
    console.log(ratio)
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
        })

    }


    var units = svg
        .selectAll('.unit')
        .filter((d, i) => {
            return d.class == 'after'
        })
        .transition()
        .duration(1000)
        .style("fill", blue2)
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

//Autism Providers
var p2pDataGA
var ageData
d3.csv("data/P2PData.csv", function (dataSet) {
    p2pData = dataSet;
    console.log(p2pData);
    p2pDataGA = p2pData.filter(d => { if (d["State"] == "GA") return true; })
    ageData = d3.nest()
        .key(function (d) { return d["Age"] })
        .rollup(function (v) { return v.length })
        .object(p2pDataGA)
    console.log(ageData);

    servicesCliffVis()
    // new scroll('div1', '50%', showNoServices, servicesCliffVis);
    // new scroll('div2', '50%', showSpeechTherapyServicesBefore, showNoServices);
    // new scroll('div3', '50%', showSpeechTherapyServicesAfter, showSpeechTherapyServicesBefore);
    // new scroll('div4', '50%', exploreServices, showSpeechTherapyServicesAfter);

    

    d3.select("#nextVis").on("click", function(){
        console.log("next")
        currVis = currVis + 1
        updateCurrVis(currVis)
    })
    d3.select("#prevVis").on("click", function(){
        currVis = currVis - 1
        updateCurrVis(currVis)
    })
})

function updateCurrVis(){
    d3.select("#div" + currVis).style("display", "block")
    for(let vis = 0; vis < totalVis; vis++){
        if(vis != currVis){
            d3.select("#div" + vis).style("display", "none")
        }
    }


    if(currVis == 0){
        servicesCliffVis()
    }
    else if(currVis == 1){
        showNoServices()
    }
    else if(currVis == 2){
        showSpeechTherapyServicesBefore()
    }
    else if(currVis == 3){
        showSpeechTherapyServicesAfter()
    }
    else if(currVis == 4){
        exploreServices()
    }
}
function showNoServices() {
    showUnits(service = null, ratio = (100 - 26))
}
function showSpeechTherapyServicesBefore() {
    //showUnits(service = null, serviceAvailability['Speech-language therapy'].before)
    showUnitsBefore(serviceAvailability['Speech-language therapy'])
}
function showSpeechTherapyServicesAfter() {
    showUnitsAfter(serviceAvailability['Speech-language therapy'])
    d3.select("#updateServiceType").style("display", "none");
}
function exploreServices(){
    unitNodes.forEach((d) => { d.class = '' })
    showUnits()
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




