function getCentroid(t) {
    t = t.replace(/[a-z].*/g, " ") // remove relative coords, could rather tag it for later processing to absolute!
        .replace(/[\sA-Z]+/gi, " ").trim().split(" ");  // remove letters and simplify spaces.
    //console.log(t)

    for (var i in t) {    // set valid initial values
        if (t[i].length > 1) {
            p = t[i].split(",");
            xmin = xmax = p[0]; ymin = ymax = p[1];
        }
    }
    for (var i in t) { // update xmin,xmax,ymin,ymax
        p = t[i].split(",");
        if (!p[1]) { p[0] = xmin; p[1] = ymin; } // ignore relative jumps such h20 v-10
        xmin = Math.min(xmin, p[0]);
        xmax = Math.max(xmax, p[0]);
        ymin = Math.min(ymin, p[1]);
        ymax = Math.max(ymax, p[1]);
    }
    //return [[xmin, ymax], [xmax, ymin]];
    return [xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2];
}

var prevalenceBarGraph
var countiesTip
var lowColor = '#eff3ff'
var highColor = '#08519c'

function drawPrevalenceMap() {
    svg.selectAll("*").remove()



    var svgCartogram = svg.append("g").attr("class", "cartogram"),
        radius = d3.scaleSqrt().range([0, 90]).clamp(true),
        colorCartogram = d3.scaleLinear().range([lowColor, highColor])//scaleOrdinal().range(d3.schemeBlues[4]);

    svgCartogram.attr("height", height - 100)
        .attr("width", width - 100);
    casesPerGender = {
        xAxis: null, yAxis: null, x: null, y: null, z: null
    }
    var cartogramTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-5, 0])
        .html(function (d) {
            return 'State: ' + d.id + '<br>Estimate Cases: ' + d.cases + '<br>Estimated Prevalence: ' + d.prevalence
        })
    svgCartogram.call(cartogramTip);

    countiesTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-5, 0])
        .html(function (d) {
            providers = "";
            if (d.providers == undefined)
                providers = "N/A"
            else
                providers = d.providers

            return 'County: ' + d.properties.name + '<br>Number of providers: ' + providers
        })
    //svgCartogram.call(countiesTip);

    function numeric(row) {
        for (var key in row) {
            if (key == "Cases" || key == "Prevalence" || key == "FemaleCases" || key == "MaleCases" || key == "FemalePrevalence" || key == "MalePrevalence") {
                row[key] = +row[key];
            }
        }
        delete row[""];
        return row;
    }




    var isCartogram = false;
    d3.queue()
        .defer(d3.json, "data/us.json")
        .defer(d3.csv, "data/adult_prevalence.csv", numeric)
        .defer(d3.json, "data/us-counties.json")
        .await(function (err, us, data, usCounties) {
            radius.domain([0, d3.max(data, d => { return d["Cases"] })]);
            colorCartogram.domain(d3.extent(data, d => { return d["Prevalence"] }))

            dataById = d3.nest().key(d => d["id"]).rollup(a => { return a[0] }).object(data)
            dataByCountyName = d3.nest().key(d => d["State"]).rollup(a => { return a[0] }).object(data)


            var neighbors = topojson.neighbors(us.objects.states.geometries),
                nodes = topojson.feature(us, us.objects.states).features;

            function scale(scaleFactor) {
                return d3.geoTransform({
                    point: function (x, y) {
                        this.stream.point(x * scaleFactor, y * scaleFactor);
                    }
                });
            }

            path = d3.geoPath().projection(scale(0.85));
            nodes.forEach(function (node, i) {
                //node.id = node.properties.name;
                node.cases = dataById[node.id]["Cases"]
                node.prevalence = dataById[node.id]["Prevalence"]
                var centroid = d3.geoPath().projection(scale(0.85)).centroid(node);

                node.x0 = centroid[0];
                node.y0 = centroid[1];

                cleanUpGeometry(node);

            });



            var statesGroup = svgCartogram.append("g")
            var states = statesGroup.selectAll("path")
                .data(nodes)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("class", "state")
                .attr("fill", d => {
                    return colorCartogram(d.prevalence)
                })


            var counties = svgCartogram.append("g")
                .attr("id", "counties")

            counties.selectAll("path")
                .data(topojson.feature(usCounties, usCounties.objects.counties).features)
                .enter().append("path")
                .attr("d", path)
                .attr("class", "county-boundary")
                .style("fill", "none")
                .style("stroke", "none");


            //state labels
            // svgCartogram.selectAll(".dorlingStateLabel")
            //     .data(nodes)
            //     .enter()
            //     .append("text")
            //     .attr("class", "dorlingStateLabel")
            //     .style("fill", "white")
            //     .text(node => node.id)
            //     .attr("text-anchor", "middle")
            //     .attr("x", node => node.x0)
            //     .attr("y", node => node.y0)

            prevalenceBarGraph = svg.append("g")
            prevelanceBySexAxis(data)
            prevelanceBySex(dataById, "GA")

            states.on("mouseover", d => {

                prevelanceBySex(dataById, d.id);
                cartogramTip.show(d)
            })
                .on("mouseout", d => {
                    //TODO: show total
                    prevelanceBySex(dataById, "GA")
                    cartogramTip.hide()
                })



            simulate();

            function simulate() {
                nodes.forEach(function (node) {
                    node.x = node.x0;
                    node.y = node.y0;
                    node.r = radius(node.cases);
                });

                colorCartogram.domain(d3.extent(nodes, d => d.prevalence));

                var links = d3.merge(neighbors.map(function (neighborSet, i) {
                    return neighborSet.filter(j => nodes[j]).map(function (j) {
                        return { source: i, target: j, distance: nodes[i].r + nodes[j].r + 3 };
                    });
                }));

                var simulation = d3.forceSimulation(nodes)
                    .force("cx", d3.forceX().x(d => width / 2).strength(0.02))
                    .force("cy", d3.forceY().y(d => height / 2).strength(0.02))
                    .force("link", d3.forceLink(links).distance(d => d.distance))
                    .force("x", d3.forceX().x(d => d.x).strength(0.1))
                    .force("y", d3.forceY().y(d => d.y).strength(0.1))
                    .force("collide", d3.forceCollide().strength(0.8).radius(d => d.r + 3))
                    .stop();

                while (simulation.alpha() > 0.1) {
                    simulation.tick();
                }


                nodes.forEach(function (node) {
                    var circle = pseudocircle(node),
                        closestPoints = node.rings.slice(1).map(function (ring) {
                            var i = d3.scan(circle.map(point => distance(point, ring.centroid)));
                            return ring.map(() => circle[i]);
                        }),
                        interpolator = d3.interpolateArray(node.rings, [circle, ...closestPoints]);

                    node.interpolator = function (t) {
                        //console.log(interpolator(t))
                        var str = pathString(interpolator(t));
                        // Prevent some fill-rule flickering for MultiPolygons
                        if (t > 0.99) {
                            return str.split("Z")[0] + "Z";
                        }

                        return str;
                    };
                });

                d3.select("#showCartogram").on("click", function () {
                    if (!isCartogram) {
                        showCartogram()
                        d3.select(this).text("Geographical");
                    }

                    else {
                        showCholorpleth()
                        d3.select(this).text("Cartogram");
                    }

                    isCartogram = !isCartogram
                })
                function showCartogram() {
                    states
                        .sort((a, b) => b.r - a.r)
                        .transition()
                        .duration(1500)
                        .attrTween("d", node => {
                            return node.interpolator
                        })

                    //state labels
                    // svgCartogram.selectAll(".dorlingStateLabel")
                    //     .transition()
                    //     .duration(1500)
                    //     .attr("x", node => {
                    //         return getCentroid(node.interpolator(1))[0]
                    //     })
                    //     .attr("y", node => {
                    //         return getCentroid(node.interpolator(1))[1]
                    //     })

                }
                function showCholorpleth() {
                    states
                        .transition()
                        .duration(1500)
                        .attrTween("d", node => t => node.interpolator(1 - t))
                        .on("end", (d, i) => i || simulate());

                    // svgCartogram.selectAll(".dorlingStateLabel")
                    //     .transition()
                    //     .duration(1500)
                    //     .attr("x", node => node.x0)
                    //     .attr("y", node => node.y0)
                }

                var legend = d3.legendColor()
                    .shapeWidth(30)
                    .orient('vertical')
                    .title("Prevalence")
                    .scale(colorCartogram);

                cartogramHeight = d3.select(".cartogram").node().getBBox().height
                cartogramWidth = d3.select(".cartogram").node().getBBox().width

                svgCartogram.append("g")
                    .attr("class", "mapLegend")
                    .attr("transform", "translate(" + (cartogramWidth - 150) + "," + (cartogramHeight - 150) + ")");

                svgCartogram.select(".mapLegend")
                    .call(legend);

            }


        })

    //bar graph
    function prevelanceBySexAxis(data) {
        cartogramHeight = d3.select(".cartogram").node().getBBox().height
        cartogramBarPadding = 100
        console.log(cartogramHeight);

        keys = ["MaleCases", "FemaleCases"]

        totalMax = d3.max(data, d => { return d.Cases })

        casesPerGender.y = d3.scaleBand()
            .range([cartogramHeight + cartogramBarPadding + 30, cartogramHeight + cartogramBarPadding])
            .padding(0.1)
            .paddingOuter(0.2)
            .paddingInner(0.2)

        casesPerGender.x = d3.scaleLinear()
            .range([0, width])

        casesPerGender.xAxis = prevalenceBarGraph.append("g")
            .attr("class", "genderBarGraph")
            .attr("transform", 'translate(0,' + (cartogramHeight + cartogramBarPadding) + ')')
            .attr("class", "x-axis")

        maleColor = "#F98E31"
        femaleColor = "#FBC491"

        casesPerGender.z = d3.scaleOrdinal()
            .range([maleColor, femaleColor])
            .domain(keys);

        casesPerGender.x.domain([0, totalMax]).nice();

        prevalenceBarGraph.selectAll(".x-axis")
            //.transition().duration(speed)
            .call(d3.axisTop(casesPerGender.x).ticks(5))

        d3.select(".x-axis").select("path").style("stroke", gray1)
        d3.select(".x-axis").selectAll(".tick").select("line").style("stroke", gray1)


        //legend
        ordinal = d3.scaleOrdinal()
            .range([maleColor, femaleColor])
            .domain(["Male", "Female"]);

        var barLegendSvg = d3.select(".barLegend");

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

    //bar graph
    function prevelanceBySex(dataById, stateId) {
        keys = ["MaleCases", "FemaleCases"]
        data = dataById[stateId];
        speed = 1000
        total = dataById[stateId]["MaleCases"] + dataById[stateId]["FemaleCases"]

        // data.sort(d3.select("#sort").property("checked")
        //     ? (a, b) => b.total - a.total
        //     : (a, b) => states.indexOf(a.State) - states.indexOf(b.State))

        casesPerGender.y.domain([stateId]);

        var group = prevalenceBarGraph.selectAll("g.layer")
            .data(d3.stack().keys(keys)([data]))

        group.exit().remove()

        group.enter().insert("g", ".y-axis").append("g")
            .classed("layer", true)
            .style("fill", d => casesPerGender.z(d.key));

        var bars = prevalenceBarGraph.selectAll("g.layer").selectAll("rect")
            .data(d => d, e => e.data.id);

        bars.exit().remove()

        bars.enter().append("rect")
            .attr("height", casesPerGender.y.bandwidth())
            .merge(bars)
            //.transition().duration(speed)
            .attr("y", d => casesPerGender.y(d.data.id))
            .attr("x", d => casesPerGender.x(d[0]))
            .attr("width", d => casesPerGender.x(d[1]) - casesPerGender.x(d[0]))


        var totalLabel = prevalenceBarGraph.selectAll(".text")
            .data([data], d => d.id);

        totalLabel.exit().remove()

        formatComma = d3.format(",")
        totalLabel.enter().append("text")
            .attr("class", "text")
            .attr("text-anchor", "start")
            .merge(totalLabel)
            // .transition().duration(speed)
            .attr("y", d => casesPerGender.y(d.id) + casesPerGender.y.bandwidth() / 2 + 5)
            .attr("x", d => casesPerGender.x(total) + 5)
            .text(d => formatComma(total))


        var stateLabel = prevalenceBarGraph.selectAll(".selectedStateLabel")
            .data([data], d => d.id)
        stateLabel.exit().remove()
        stateLabel.enter().append("text")
            .attr("class", "selectedStateLabel")
            .attr("y", d => casesPerGender.y(d.id) + casesPerGender.y.bandwidth() / 2 + 5)
            .attr("x", casesPerGender.x(0) - 30)
            .text(d => d.id)

    }


    function pseudocircle(node) {
        return node.rings[0].map(function (point) {
            var angle = node.startingAngle - 2 * Math.PI * (point.along / node.perimeter);
            return [
                Math.cos(angle) * node.r + node.x,
                Math.sin(angle) * node.r + node.y
            ];
        });
    }

    function cleanUpGeometry(node) {

        node.rings = (node.geometry.type === "Polygon" ? [node.geometry.coordinates] : node.geometry.coordinates);

        node.rings = node.rings.map(function (polygon) {
            polygon[0].area = d3.polygonArea(polygon[0]);
            polygon[0].centroid = d3.polygonCentroid(polygon[0]);
            return polygon[0];
        });

        node.rings.sort((a, b) => b.area - a.area);

        node.perimeter = d3.polygonLength(node.rings[0]);

        // Optional step, but makes for more circular circles
        bisect(node.rings[0], node.perimeter / 72);

        node.rings[0].reduce(function (prev, point) {
            point.along = prev ? prev.along + distance(point, prev) : 0;
            node.perimeter = point.along;
            return point;
        }, null);

        node.startingAngle = Math.atan2(node.rings[0][0][1] - node.y0, node.rings[0][0][0] - node.x0);

    }

    function bisect(ring, maxSegmentLength) {
        for (var i = 0; i < ring.length; i++) {
            var a = ring[i], b = i === ring.length - 1 ? ring[0] : ring[i + 1];

            while (distance(a, b) > maxSegmentLength) {
                b = midpoint(a, b);
                ring.splice(i + 1, 0, b);
            }
        }
    }

    function distance(a, b) {
        return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
    }

    function midpoint(a, b) {
        return [a[0] + (b[0] - a[0]) * 0.5, a[1] + (b[1] - a[1]) * 0.5];
    }

    function pathString(d) {
        return (d.rings || d).map(ring => "M" + ring.join("L") + "Z").join(" ");
    }


}
zoomScrollDown = true
function zoomGeorgia() {
    //TODO: fix back scroll
    d3.select("#leafletMap").style("display", "none");
    d3.select(".unitVisGroup").style("display", "none");
    //console.log(d3.select("#leafletMap"));
    if (!zoomScrollDown) {
        //drawPrevalenceMap()
        svg.select(".cartogram").style("display", "block");
    }
    svg.select(".cartogram").style("display", "block");


    zoomScrollDown = !zoomScrollDown

    pathsById = d3.map(d3.selectAll("path.state").nodes(), path => { return path.__data__.id })
    georgiaPath = pathsById["$GA"];
    var centered = null

    var centroid = getCentroid(georgiaPath.getAttribute("d"))
    x = centroid[0];
    y = centroid[1];
    k = 6;
    centered = georgiaPath;

    svgCartogram = d3.select(".cartogram")
    svgCartogram.selectAll("path.state")
        .classed("active", (d) => { return d.id === "GA"; });



    svgCartogram.transition()
        .duration(750)
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
        .style("stroke-width", 1.5 / k + "px");

    // d3.selectAll(".county-boundary")
    //     .style("fill", "none")
    //     .style("stroke", "black");

    svgCartogram.selectAll("path.state")
        .transition()
        .duration(1000)
        .style("fill", "white")//d => { if (d.id !== "GA") return "white" })
        .style("stroke", "none")

    // svgCartogram.selectAll("path.state")
    //     .on("mouseover", {})
    //     .on("mouseout", {})

    prevalenceBarGraph.remove()
    d3.select(".mapLegend").remove();

    d3.selectAll("path.state").filter(d => { return d.id == "GA" }).call(countiesTip);

    d3.queue()
        .defer(d3.csv, "data/providers_per_county.csv")
        .defer(d3.csv, "data/georgia_county_codes.csv")
        .await(function (err, providersPerCounty, countyCodes) {

            providersPerCounty.forEach(row => {
                row["Providers"] = + row["Providers"]
            })
            data = d3.map(providersPerCounty, d => {
                return d["County"]
            })
            countyName = d3.map(countyCodes, d => {
                return d["fips"]
            })


            lowColor = "#c6dbef"
            highColor = "#084594"
            providersScale = d3.scaleLinear().range([lowColor, highColor])
            providersScale.domain([1, d3.max(providersPerCounty, d => { return d["Providers"] })])

            d3.selectAll(".county-boundary")
                .style("fill", d => {
                    //console.log(d)
                    if (countyName["$" + d.id] !== undefined) {
                        county = countyName["$" + d.id]["name"]
                        if (data["$" + county] != undefined) {
                            d.providers = data["$" + county]["Providers"]
                            return providersScale(data["$" + county]["Providers"])
                        }
                        return "white"
                    }

                })
                .style("stroke", d => {
                    if (countyName["$" + d.id] !== undefined)
                        return "gray"
                    else
                        return "none"
                })

            georgiaCounties = d3.selectAll(".county-boundary")
                .filter(d => {
                    return (countyName["$" + d.id] !== undefined)
                })
            georgiaCounties
                .on("mouseover", d => countiesTip.show(d))
                .on("mouseout", countiesTip.hide);


            otherCounties = d3.selectAll(".county-boundary")
                .filter(d => {
                    return (countyName["$" + d.id] === undefined)
                })
            otherCounties.on("mouseover", {})
                .on("mouseout", {})


            var legend = d3.legendColor()
                .shapeWidth(30)
                .orient('vertical')
                .title("Count of Providers")
                .scale(providersScale)
                .labelFormat(d3.format(".0f"));

            if (d3.select(".countiesLegendSvg").empty()) {
                legendGroup = d3.select("#zoomGeorgia")
                                .append("svg")
                                .attr("class", "countiesLegendSvg")
                                .attr("width", 300)
                                .attr("height", 300)
                
                legendGroup.append("g")
                    .attr("class", "countiesLegend")
                    .attr("transform", "translate(" + 20 + "," + 40 + ")");

                legendGroup.select(".countiesLegend")
                    .call(legend);
            }

        })


}


