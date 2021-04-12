var rpersons = [];
var xResettlementScale = d3.scaleBand().range([0, width]);
var xTimeScale = d3.scaleBand().range([height, 0]);
var resettlementCompleteData = []
var rTimeData = []
var countryList = []
var destList = []
var timeOrigin = "Syrian Arab Rep.";
var timeDest = "USA";
var dropdown2;
var dropdown3;
var submissionData = []

var submittedColor = "#d0d1e6";
var departedColor = "rgb(43, 174, 102)";

var yScaleResettlement = d3.scaleLinear()
d3.csv("data/resettlementTimeSeries.csv", function (rdata) {
    resettlementCompleteData = rdata
})
d3.csv("data/resettlementSubmissions.csv", function (sdata) {
    submissionData = sdata
    submissionData.forEach(d => {
        if(countryList.indexOf(d.origin)==-1)
            countryList.push(d.origin)
    }) 
    submissionData.forEach(d => {
        if(destList.indexOf(d.destination)==-1)
            destList.push(d.destination)
    }) 
})

var rtoolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-8, 0])
    .html(function (d) {
        if(d.isTime == false && d.setAccepted == true){
            
            return "<div class= 'greenLabel'>Total Submissions</div>" + parseInt(d.total) 
            + "<br><br><div class = 'greenLabel'>Accepted Submissions</div>" + parseInt(d.accepted)
        }
        else if(d.isTime == false && d.setAccepted == false){
            
            return "<div class ='greenLabel'>Total Submissions</div>" + parseInt(d.total) 
            + "<br><br><div class = 'greenLabel'>Pending Submissions</div>" + (parseInt(d.total) - parseInt(d.accepted))
        }
        else if(d.isTime == true && d.setAccepted == true){
         
            return "<div class = 'greenLabel'>Total Submissions</div>" + parseInt(d.total) 
            + "<br><br><div class = 'greenLabel'>Accepted Submissions</div>" + parseInt(d.accepted)
        }
        else if(d.isTime == true && d.setAccepted == false){
            
            return "<div class = 'greenLabel'>Total Submissions</div>" + parseInt(d.total) 
            + "<br><br><div class = 'greenLabel'>Pending Submissions</div>" + (parseInt(d.total) - parseInt(d.accepted))
        }
    });

//resettlement countries visualization
function createOriginCountryViz(origin) {
    d3.select('.xAxisSparkline').remove()
    d3.selectAll(".dropdownLabel").remove()
    d3.selectAll(".originDropDown").remove()
    d3.selectAll(".yearDropdownOrigin").remove()
    d3.select(".yearDropdownDest").remove()
    d3.selectAll(".not_resettled").remove()

    svg
    .append("image")
    .attr('xlink:href','images/resettlementRatio.png')
    .attr('width',200)
    .attr('height',200)
    .attr('x',width-3.5*margin.right)
    .attr('y',-100)
    .attr('class',"ResettlementRatioImage")

    if(!origin)
        origin = "Syrian Arab Rep."
    svg.call(rtoolTip)
    var originData = resettlementCompleteData.filter(function(obj){
        if(obj["origin"] == origin && obj["destination"]!="all")
            return true
    })
   
    var totalSubmissions = submissionData.filter(function(obj){
        if(obj["origin"] == origin && obj["destination"]!="all")
            return true
    })
    
    var resettlementCountrywiseYearData = d3.nest()
        .key(function (d) {
            return d["destination"];
        })
        .key(function (d) {
            return d["year"];
        })
        .entries(totalSubmissions)
        .map(function (d) {
            var years = {};
            var total = 0;
            years = { 2011: 0, 2012: 0, 2013: 0, 2014: 0, 2015: 0, 2016: 0, 2017: 0, 2018: 0 }
            d.values.forEach(y => {
                years[y.key] = +y.values[0]['submissions'];
                total += +y.values[0]['submissions'];
            })
            return { 'country': d.key, 'years': years, 'total': total };
        })

    var totalDepartures = d3.nest()
        .key(function (d) {
            return d["destination"];
        })
        .key(function (d) {
            return d["year"];
        })
        .entries(originData)
        .map(function (d) {
            var years = {};
            var total = 0;
            years = { 2011: 0, 2012: 0, 2013: 0, 2014: 0, 2015: 0, 2016: 0, 2017: 0, 2018: 0 }
            d.values.forEach(y => {
                years[y.key] = +y.values[0]['total'];
                total += +y.values[0]['total'];
            })
            return { 'country': d.key, 'years': years, 'total': total };
        })

    

    resettlementCountrywiseYearData.sort(function (a, b) {
        return b.total - a.total;
    })
    totalDepartures.sort(function (a, b) {
        return b.total - a.total;
    })

    resettlementCountrywiseYearData = resettlementCountrywiseYearData.splice(0, 10);

    var countries = resettlementCountrywiseYearData.map(function (d) { return d.country })

    svg.selectAll('.xaxis').remove()
    d3.selectAll(".yAxisAsylum").remove();
    svg.selectAll('.resettlementaxis').remove()
    svg.selectAll('.timeaxis').remove()
    xResettlementScale.domain(countries);


    var xAxis = d3.axisBottom()
        .scale(xResettlementScale)
    //x axis
    svg.append('g')
        .attr('transform', 'translate(0,' + (+height + 10) + ')')
        .call(xAxis)
        .attr('class','resettlementaxis')
        .selectAll("text")
        .attr("dx", "-0.5em")
        .attr("dy", ".15em")
        
    resettlement_cols = 20;
    barMargin = 10;
    resettlement_bandwidth = xResettlementScale.bandwidth() - (2 * barMargin);
    resettlement_size = resettlement_bandwidth / resettlement_cols;
    resettlement_ratio = 100;

    //cumulative
    rpersons = []
    safepersons = []
    resettlementCountrywiseYearData.forEach((c, idx) => {
        var total = Math.ceil(c.total / resettlement_ratio);

        var xStart = xResettlementScale(c.country) + barMargin;
        var accepted = totalDepartures.filter(function(o){
            return o.country == c.country
        })
        
        var resettlementNodes = d3.range(total).map(function (d, i) {
            return {
                size: resettlement_size,
                x: (i % resettlement_cols) * resettlement_size + xStart,
                y: height - (Math.floor((i / resettlement_cols)) * resettlement_size),
                c : c.country,
                total : c.total,
                setAccepted : (i < Math.floor(Math.min(accepted[0].total, c.total)/resettlement_ratio)) ? true : false,
                accepted : Math.min(accepted[0].total, c.total),
                totalCountries : countries,
                origin : origin,
                isTime : false
            }

        })
        rpersons = rpersons.concat(resettlementNodes);

    })

    //y axis
    var yMax = d3.max(rpersons, d => {
        return d.y;
    })
    var yMin = d3.min(rpersons, d => {
        return d.y;
    })
    
    var yScaleRange = yMax - yMin + resettlement_size;
    yScaleResettlement.range([height, height - yScaleRange]);
    
    var yScalePixels = yScaleRange/resettlement_size;

    yScaleResettlement.domain([0,yScalePixels * resettlement_cols * resettlement_ratio]);

    var yAxis = d3.axisLeft()
        .scale(yScaleResettlement);

    svg.append("g")
        .call(yAxis.ticks(5))
        .attr('class','yAxisResettlement')


    //remove above if doesn't work
    createResettlementViz(rpersons);
}

//time series visualization
function createOriginDestDropDown(){
    document.getElementsByClassName('container')[0].setAttribute("style","z-index:0");
    d3.select(".originDropDownLabel").remove()
    d3.select('.xAxisSparkline').remove()
    d3.selectAll(".originDropDown").remove()
    d3.selectAll(".yearDropdownOrigin").remove()
    d3.select(".yearDropdownDest").remove()
    d3.selectAll(".yAxisResettlement").remove()

    var yearDestDropDownLabel = d3.select('.fixed')
                        .insert("span","svg")
                        .attr("class", "yearDestDropDownLabel dropdownLabel")
    yearDestDropDownLabel.text("Resettlement Country:")

    dropdown3 = d3.select('.fixed')
                        .insert("select","svg")
                        .attr("class", "yearDropdownDest dropdown")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .on("change",updateTimeDest)


    var filterOriginBased = submissionData.filter(function(obj)
    {
        if(obj.origin == timeOrigin)
            return true;
    })
    destList = []
    filterOriginBased.forEach(d => {
        if(destList.indexOf(d.destination)==-1)
            destList.push(d.destination)
    }) 

    var opts = dropdown3.selectAll("option")
                    .data(destList.sort())

    opts.exit().remove()

    var optsEnter = opts.enter().append("option")
                    .attr("value", function(d){return d})
                    .text(function(d){
                        return d[0].toUpperCase()+d.slice(1,d.length)
                    })

    opts = opts.merge(optsEnter)
    if(destList.indexOf(timeDest) == -1)
    {
        timeDest = destList[0]
    }

    d3.select('.yearDropdownDest').property('value', timeDest);
    
    createTimeLine(timeOrigin,timeDest)
}


function updateTimeDest(){
    console.log("lalalalalalalalala")
    timeDest = d3.select(this).property('value')
   
    createTimeLine(timeOrigin, timeDest)
}

function createTimeLine(origin, destination){
   
    var yearWiseOriginDestData = submissionData.filter(function(obj){
        if(obj["origin"] == origin && obj["destination"] == destination)
            return true
    })
    var resettledData = resettlementCompleteData.filter(function(obj){
        if(obj["origin"] == origin && obj["destination"]== destination)
            return true
    })
    
            
    yearWiseOriginDestData.sort(function (a, b) {
        return b.year - a.year;
    })
    

    var years = yearWiseOriginDestData.map(function (d) { return d.year })
    years.reverse()
    svg.selectAll('.xaxis').remove()
    svg.selectAll('.resettlementaxis').remove()
    svg.selectAll('.timeaxis').remove()

    xTimeScale.domain(years);

    var xAxis = d3.axisLeft()
        .scale(xTimeScale)
    //x axis
    svg.append('g')
        .call(xAxis)
        .attr('class','timeaxis')
        .selectAll("text")
        .attr("transform", "rotate(0)")
        .style("text-anchor", "end")
        .attr("x",-10)
        .attr("dy", "0.5em")
        .style("font-size", "12px")
        .style("color", "white");

    resettlement_cols = 10;
    barMargin = 5;
    resettlement_bandwidth = xTimeScale.bandwidth() - (2 * barMargin);
    resettlement_size = resettlement_bandwidth / resettlement_cols;
    resettlement_ratio = 100;

    //cumulative
    rTimeData = []
    yearWiseOriginDestData.forEach((c, idx) => {
        var total = Math.ceil(c.submissions / resettlement_ratio);
        var xStart = xTimeScale(c.year) + barMargin;
        var accepted = resettledData.filter(function(o){
            return o.year == c.year
        })
        var resettlementNodes = d3.range(total).map(function (d, i) {
            return {
                size: resettlement_size,
                y: ((i % resettlement_cols) * resettlement_size + xStart),
                x: (Math.floor((i / resettlement_cols)) * resettlement_size),
                year : c.year,
                total : c.submissions,
                setAccepted : (accepted.length && i < Math.ceil(Math.min(accepted[0].total, c.submissions)/resettlement_ratio)) ? true : false,
                accepted : accepted.length > 0 ? Math.min(accepted[0].total, c.submissions) : 0,
                origin : origin,
                isTime : true
            }
        })
        rTimeData = rTimeData.concat(resettlementNodes);

    })
    createResettlementViz(rTimeData);
}

function createResettlementViz(dataToVisualize) {
    var units = svg
        .selectAll('rect')
        .data(dataToVisualize)

    units.exit().remove();

    var unitsEnter = units
        .enter()
        .append('rect')
        

    units = units.merge(unitsEnter);

    units
        .transition()
        .duration(1000)
        .attr('height', function (d) {
            return d.size;
        })
        .attr('width', function (d) {
            return d.size;
        })
        .attr('x', function (d, i) {
            return d.x;
        })
        .attr('y', function (d) {
            return d.y - size;
        })
        .attr('y', function (d) {
            return d.y - size;
        })
        .attr('class', function(d,i)
        {
            if(d.setAccepted == true){
                return 'accepted'
            }
            else{
                return 'not_accepted'
            }
        })
        .style('fill', function (d) { 
            if(d.setAccepted == true)
                return departedColor
            else
                return submittedColor
        });

    units
        .on("mouseover", function (d, i) {
            if(d.setAccepted == true){
                d3.selectAll('.not_accepted').style('opacity', 0.7) 
                d3.selectAll('.accepted').style('opacity',1)
            }
            else{
                d3.selectAll('.accepted').style('opacity',0.7)
                d3.selectAll('.not_accepted').style('opacity', 1)
            }
                 
            rtoolTip.show(d)
        })
        .on("mouseout", function (d) {
            d3.selectAll('.accepted').style('opacity', 1.0)
            d3.selectAll('.not_accepted').style('opacity',1.0)
            rtoolTip.hide();
        })

}

