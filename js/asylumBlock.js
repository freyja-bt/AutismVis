var blockCols;
// blockCols = Math.ceil(Math.sqrt(persons.length));
var otherCountryPersons;
var allPersons
var resettledColor = "rgb(43, 174, 102)"
var notResettledColor = "#aa0000";

var tooltipTotal = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function (d) {
        return "<div class = 'label'>Year</div>"
            + d.year + "<br><br><div class = 'label'>Total Refugees</div>" + numberWithCommas(yearTotalPersons[d.year])
    });

function showBlock() {
    svg.call(tooltipTotal)
    d3.selectAll(".xAxis").remove();
    d3.selectAll(".yAxisAsylum").remove();
    buildSparkline(2018)
    d3.selectAll(".sparklineTextAsylum").remove();
    d3.selectAll(".sparklineTextNumber").remove();
    blockCols = Math.ceil(Math.sqrt(persons.length));
    otherCountryPersons = [];

    var otherCountryData = [];
    Object.assign(otherCountryData, allCountriesData);
    otherCountryData = otherCountryData.splice(20, allCountriesData.length);

    otherCountryData.forEach((c, idx) => {
        var total = Math.round(c.total / ratio);
        var cumulative = { 2011: c.years[2011], 2012: 0, 2013: 0, 2014: 0, 2015: 0, 2016: 0, 2017: 0, 2018: 0 };

        for (i = 2012; i <= 2018; i++) {
            cumulative[i] = cumulative[i - 1] + c.years[i];
        }

        var nodes = d3.range(total).map(function (d, i) {
            return {
                size: size,
                year: getYear(i, cumulative),
                country: c.country
            }

        })
        otherCountryPersons = otherCountryPersons.concat(nodes);

    })
    //console.log(otherCountryPersons);
    allPersons = [];
    Object.assign(allPersons, persons);
    allPersons = allPersons.concat(otherCountryPersons);

    allPersons.sort(function (a, b) {
        return a.year - b.year;
    })

    //console.log(allPersons);
    var units = svg
        .selectAll('rect')
        .data(allPersons)

    units.exit().remove();

    var unitsEnter = units.enter().append('rect').attr('class', 'dataPixel')

    units = units.merge(unitsEnter)
        .style("fill", function (d) {
            return colorScale(yearsTotalPersonsArray.indexOf(d.year));
        })
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })
        .on("mouseover", function (d, i) {
            var year = d.year;
            d3.selectAll('.dataPixel').style('opacity', function (r) {
                return (r.year == year) ? 1.0 : 0.5;
            })
            tooltipTotal.show(d);
        })
        .on("mouseout", function (d, i) {
            d3.selectAll('.dataPixel').style('opacity', 1.0)
            tooltipTotal.hide()
        })
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
            return (i % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor((i / blockCols)) * size);
        })
}

var personsCopy = []

//not required. showing persons from all countries in total block
function showOtherCountryPersons() {
    buildSparkline(2018)

    blockCols = Math.ceil(Math.sqrt(persons.length));
    personsCopy = [];
    Object.assign(personsCopy, persons);
    otherCountryPersons.sort(function (a, b) {
        return a.year - b.year;
    })

    personsCopy = personsCopy.concat(otherCountryPersons);

    var units = svg
        .selectAll('rect')
        .data(personsCopy)

    units.exit().remove();

    var unitsEnter = units
        .enter()
        .append('rect')
        .attr('class', function (d, i) {
            'year' + d.year
        })
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })


    units = units.merge(unitsEnter);

    units
        .style("fill", function (d) {
            return colorScale(d.year % 2011)
        })
        .attr("class", function (d, i) {
            if (i < 2154)
                return "resettled";
            else
                return "not_resettled"
        })
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
            return ((i) % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor(((i) / blockCols)) * size);
        })

}


//show same color for all asylum seeksers
function changeColor() {
    buildSparkline(2018)
    d3.selectAll(".sparklineTextAsylum").remove();
    d3.selectAll(".sparklineTextNumber").remove();
    var personsCopy = [];
    Object.assign(personsCopy, persons);
    personsCopy = personsCopy.concat(otherCountryPersons);

    personsCopy.sort(function (a, b) {
        return a.year - b.year;
    })

    var units = svg
        .selectAll('rect')
        .data(personsCopy)

    units.exit().remove();

    var unitsEnter = units
        .enter()
        .append('rect')
        .attr('class', function (d, i) {
            'year' + d.year
        })
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })


    units = units.merge(unitsEnter);

    units
        .style("fill", notResettledColor)
        .on("mouseover", doNothing)
        .on("mouseout", doNothing)
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
            return ((i) % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor(((i) / blockCols)) * size);
        })


}

function showChildren() {
    buildSparkline(2018)
    d3.selectAll(".sparklineTextAsylum").remove();
    d3.selectAll(".sparklineTextNumber").remove();
    var childrenCount = allPersons.length / 2;

    var units = svg
        .selectAll('rect')
        .data(allPersons)

    units.exit().remove();

    var unitsEnter = units
        .enter()
        .append('rect')




    units = units.merge(unitsEnter);

    units
        .attr('x', function (d, i) {
            return ((i) % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor(((i) / blockCols)) * size);
        })
        .style("fill", notResettledColor)
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })
        .transition()
        .duration(1000)
        .delay(function (d, i) {
            return i * 5;
        })
        .style("fill", function (d, i) {
            if (i < childrenCount)
                return "white";
            else
                return notResettledColor;
        })
}

function splitResettled() {
    d3.select('.xAxisSparkline').remove();
    yearsSparklineRemoval = [2011,2012,2013,2014,2015,2016,2017,2018];
    for(i=0;i<yearsSparklineRemoval.length;i++){
        d3.select('.line-plot'+yearsSparklineRemoval[i]).classed('sparkLinesHide',true);
    }
    d3.select(".originDropDownLabel").remove()
    d3.selectAll(".originDropDown").remove()
    d3.selectAll(".yearDropdownOrigin").remove()
    d3.select(".yearDropdownDest").remove()
    d3.selectAll('.xaxis').remove()
    d3.selectAll(".yAxisAsylum").remove();
    d3.selectAll('.resettlementaxis').remove()
    d3.selectAll('.timeaxis').remove()
    d3.selectAll('.ResettlementRatioImage').remove()
    d3.selectAll(".yAxisResettlement").remove()

    var resettled = 222706 / ratio;

    var line = chartG
        .selectAll('.line-plot')
        .data([])
    line.exit().remove();

    blockCols = Math.ceil(Math.sqrt(persons.length));
    var units = svg
        .selectAll('rect')
        .data(allPersons)

    units.exit().remove();

    var unitsEnter = units
        .enter()
        .append('rect')
        .attr('class', function (d, i) {
            'year' + d.year
        })
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })


    units = units.merge(unitsEnter);

    units
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })
        .style("fill", function (d) {
            return notResettledColor
        })
        .attr("class", function (d, i) {
            if (i < resettled)
                return "resettled";
            else
                return "not_resettled"
        })
        .on("mouseover", doNothing)
        .on("mouseout", doNothing)
        .transition()
        .delay(2000)
        .duration(1000)
        .attr('x', function (d, i) {
            return ((i) % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor(((i) / blockCols)) * size);
        })


    d3.selectAll(".not_resettled")
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
            return ((resettled + i) % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor(((resettled + i) / blockCols)) * size) - 200;
        })



    d3.selectAll(".resettled")
        .transition()
        .duration(1000)
        .attr('x', function (d, i) {
            return (i % blockCols) * size;
        })
        .attr('y', function (d, i) {
            return height - (Math.floor((i / blockCols)) * size) - 100;
        })
        .style("fill", resettledColor)
}

function doNothing() {

}