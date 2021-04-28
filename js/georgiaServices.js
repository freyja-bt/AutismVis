leafletScrollDown = true;
function georgiaServices() {
    if (!leafletScrollDown) {
        d3.select("#leafletMap").style("display", "block");
        return;
    }
    leafletScrollDown = !leafletScrollDown;

    svg.select(".cartogram").style("display", "none");
    svg.select(".unitVisGroup").style("display", "none");

    d3.select("#leafletMap").style("display", "block");


    activeBarColor = "steelblue"
    inactiveBarColor = gray1

    var mymap = L.map('leafletMap').setView([33.247875, -83.44116], 7);
    accessToken = 'pk.eyJ1Ijoic2hyaXNodGlhayIsImEiOiJja243cG55dzMwMXFkMnBxeGE0aTdzdzhhIn0.FwMnMNXY1bhjWrLKPVyUxw'
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 16,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

    d3.csv('data/allServiceProviders.csv', function (data) {
        //console.log("sfd")
        filteredData = data.filter(d => {
            return d["source"] == "p2p"
        })


        ageCategories = ["Under 3 Years", "3-5 Years", "6-11 Years", "12-18 Years", "19-21 Years", "21+ Years"]; //"All Ages"
        filteredData.map(row => {
            ages = row["ages"].split("; ");
            ageCategories.forEach(age => {
                if (ages.includes(age)) {
                    row[age] = 1
                }
                else {
                    row[age] = 0
                }
            })
        })

        console.log(filteredData);

        myCircleMarker = L.CircleMarker.extend({
            options: {
                name: "",
                age: "",
                agesUnder3: 0,
                ages3To5: 0,
                ages6To11: 0,
                ages12To18: 0,
                ages19To21: 0,
                agesAbove21: 0,
                agesAll: 0,
                isMarker: 1
            }
        })
        filteredData.forEach((loc, i) => {
            var marker = new myCircleMarker([loc['lat'], loc['lon']], {
                radius: 5,
                fill: true,
                fillColor: activeBarColor,
                fillOpacity: 0.6,
                stroke: true,
                color: activeBarColor,
                weight: 1,
                class: "geoMarker",
                name: loc["name"],
                age: loc["ages"],
                agesUnder3: loc["Under 3 Years"],
                ages3To5: loc["3-5 Years"],
                ages6To11: loc["6-11 Years"],
                ages12To18: loc["12-18 Years"],
                ages19To21: loc["19-21 Years"],
                agesAbove21: loc["21+ Years"],
                agesAll: loc["All Ages"],
                isMarker: 1
            })
            marker.id = i
            marker.addTo(mymap);
            marker.on("click", onClick)

        })

        //deselect all except 21+ initially
        mymap.eachLayer(layer => {
            if (layer.options.isMarker == 1 && layer.options.ages19To21 !== 1)
                layer.setStyle({ fill: false, stroke: false })
        })

        var popup = L.popup();

        function onMapClick(e) {
            console.log(e);
            popup
                .setLatLng(e.latlng)
                .setContent(e.name)
                .openOn(mymap);
        }

        //mymap.on('click', onMapClick);
        function onClick(e) {
            // console.log(this)
            popup
                .setLatLng(this._latlng)
                .setContent(this.options.name + "<br>Ages: " + this.options.age)
                .openOn(mymap);
        }


        ageKeys = ["agesUnder3", "ages3To5", "ages6To11", "ages12To18", "ages19To21", "agesAbove21"] //"agesAll"

        d3.selectAll(".ageCheckbox").on("change", function () {
            //console.log("changed");
            selected = [];
            ageKeys.forEach(key => {
                if (d3.select("#" + key).property("checked")) {
                    selected.push(key)
                }
            })
            //console.log(selected);
            mymap.eachLayer(layer => {
                if (layer.options.isMarker == 1)
                    layer.setStyle({ fill: false })
            })
            mymap.eachLayer(layer => {
                if (layer.options.isMarker == 1) {
                    selected.forEach(age => {
                        if (layer.options[age] == 1) {
                            layer.setStyle({ fill: true })
                        }

                    })
                }
            })
        })

        selectedBars = [];
        providersCount = []
        ageCategories.forEach((age, i) => {
            count = filteredData.filter((d) => {
                return d[age] == 1
            }).length
            providersCount.push({ "age": age, "count": count, "selected": true, "key": ageKeys[i] })
        })
        providersCount.forEach(d => {
            if (d.age != "21+ Years") {
                d.selected = false;
            }
        })
        ageBarGraph = d3.select("#ageBarGraph");

        barGraphWidth = 350
        barGraphHeight = 350
        barGraphMargin = { top: 50, right: 20, bottom: 60, left: 40 }
        // set the ranges
        var x = d3.scaleBand()
            .range([0, barGraphWidth])
            .padding(0.2);
        var y = d3.scaleLinear()
            .range([barGraphHeight, 0]);

        g = ageBarGraph.attr("width", barGraphWidth + barGraphMargin.left + barGraphMargin.right)
            .attr("height", barGraphHeight + barGraphMargin.top + barGraphMargin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + barGraphMargin.left + "," + barGraphMargin.top + ")");

        var ageBarGraphTip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-5, 0])
            .html(function (d) {
                if (d.selected) {
                    text = "Click to deselect"
                }
                else {
                    text = "Click to select"
                }
                return '<strong>Age:</strong> ' + d.age + '<br><strong>Number of Providers</strong>: ' + d.count + "<br>" + text
            })
        ageBarGraph.call(ageBarGraphTip);


        x.domain(providersCount.map(function (d) { return d.age; }));
        y.domain([0, d3.max(providersCount, function (d) { return +d.count })])

        bars = g.selectAll(".ageBar")
            .data(providersCount)
            .enter().append("rect")
            .attr("class", "ageBar")
            .attr("x", function (d) { return x(d.age); })
            .attr("width", x.bandwidth())
            .attr("y", y(0))
            .attr("height", 0)
            .style("fill", d => {
                if (d.selected == true) {
                    return activeBarColor
                }
                else {
                    return inactiveBarColor
                }
            })

        d3.selectAll("rect.ageBar")
            .transition()
            .duration(800)
            .attr("y", function (d) { return y(d.count); })
            .attr("height", function (d) { return barGraphHeight - y(d.count); })
            .delay(function (d, i) { return (i * 100) })


        g.selectAll(".ageBar").on("click", function (d) {
            d.selected = !d.selected;
            updateMap();
        })
            .on("mouseover", function (d) {
                ageBarGraphTip.show(d)
                d3.select(this).attr("stroke", gray0).attr("stroke-width", 0.8);
            })
            .on("mouseout", function (d) {
                ageBarGraphTip.hide()
                d3.select(this).attr("stroke", "none")
            })

        // add the x Axis
        g.append("g")
            .attr("transform", "translate(0," + barGraphHeight + ")")
            .call(d3.axisBottom(x))
            .attr("id", "agesXAxis")
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        // add the y Axis
        g.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .attr("id", "agesYAxis")

        d3.select("#agesXAxis").select("path")
            .style("stroke", "white")
        d3.select("#agesYAxis").select("path")
            .style("stroke", gray1)
        d3.select("#agesYAxis").selectAll(".tick").select("line")
            .style("stroke", gray1)

        d3.select("#agesXAxis").selectAll(".tick").select("line")
            .style("stroke", "white")

        d3.select("#cliff").on("click", function (d) {
            d3.event.preventDefault();
            //console.log("cliff")
            showCliff()
        })

        function showCliff() {
            line = d3.line()
                .defined(d => !isNaN(d.count))
                .x(d => x(d.age) + (x.bandwidth() / 2))
                .y(d => y(d.count))

            function transition(path) {
                path.transition()
                    .duration(5000)
                    .attrTween("stroke-dasharray", tweenDash)
            }

            function tweenDash() {
                const l = this.getTotalLength(),
                    i = d3.interpolateString("0," + l, l + "," + l);
                return function (t) { return i(t) };
            }
            g.append("path")
                .datum(providersCount.slice(2))
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 1.5)
                .attr("d", line)
                .call(transition);
        }






        function updateMap() {
            selectedAges = providersCount.filter(d => { return d.selected == true })
            console.log(selectedAges);
            d3.selectAll(".ageBar")
                .transition()
                .duration(500)
                .style("fill", d => {
                    if (d.selected == true) {
                        return activeBarColor
                    }
                    else {
                        return inactiveBarColor
                    }
                })


            selected = selectedAges.map(d => { return d.key })
            mymap.eachLayer(layer => {
                if (layer.options.isMarker == 1)
                    layer.setStyle({ fill: false, stroke: false })
            })
            mymap.eachLayer(layer => {
                if (layer.options.isMarker == 1) {
                    selected.forEach(age => {
                        if (layer.options[age] == 1) {
                            layer.setStyle({ fill: true, stroke: true })
                        }

                    })
                }
            })

        }

        //updateMap()
    })
}