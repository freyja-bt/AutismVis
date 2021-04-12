var chartG;
var yearTotal;
var yScale;
var chartWidth
var chartHeight
var xScaleSparkline
var parseDate = d3.timeParse('%Y');
var g = 0;
var prevtotalAsylumSeekers = 0;
function createSparkline() {
    yearTotal = d3.nest()
        .key(function (d) {
            return +d["Year"];
        })
        .rollup(function (leaves) {
            var total = d3.sum(leaves, function (c) {
                return +c["Refugees"];
            });
            return { year: leaves[0]["Year"], totalAsylumSeekers: total };
        })
        .entries(data);
    
    chartWidth = width/3
    chartHeight = height/4
    positionX = width/1.5
    positionY = 0

    xScaleSparkline = d3.scaleTime()
        .domain([parseDate(2011), parseDate(2018)])
        .range([0, chartWidth]);

    yScaleSparkline = d3.scaleLinear()
        .domain([0, d3.max(yearTotal, function (d) {
            return +(d.value.totalAsylumSeekers);
        })])
        .range([chartHeight, 0]);


    chartG = d3.select('svg')
        .append('g')
        .attr('transform', 'translate(' + [positionX, positionY] + ')')
        .attr('class', 'sparklineVis')
}

function buildSparkline(year){
    d3.select('.xAxisSparkline').remove()
    d3.selectAll('.sparklineTextAsylum').remove()
    d3.selectAll('.sparklineTextNumber').remove()

    var xAxisSparkline = d3.axisBottom()
        .scale(xScaleSparkline)

    chartG
        .append('g')
        .attr('transform', 'translate(0,' + (+chartHeight) + ')')
        .call(xAxisSparkline)
        .attr('class', 'xAxisSparkline')

    chartG.append("text")
    .attr("x", chartWidth/1.3-30)
    .attr("y", chartHeight+50)
    .text("Refugees in " + year + ":  ")
    .attr("class","sparklineTextAsylum")

    chartG.append("text")
    .attr("dx", chartWidth-30)
    .attr("y", chartHeight+50)
    .text(numberWithCommas(yearTotal[year%2011].value.totalAsylumSeekers))
    .attr("class","sparklineTextNumber")
    .attr("id","sparklineTextNumberID")

    //animateValue("sparklineTextNumberID", parseInt(prevtotalAsylumSeekers), parseInt(yearTotal[year%2011].value.totalAsylumSeekers), 100);
    //prevtotalAsylumSeekers = parseInt(yearTotal[year%2011].value.totalAsylumSeekers)

    //removal code 
    var nextYears = yearTotal.filter(function(d){
        return d.key > year
    })

    // console.log("hi")
    // console.log(d3.selectAll('.line-plot'+nextYears[0].key).empty())
    if(nextYears.length > 0 && !d3.selectAll('.line-plot'+nextYears[0].key).empty()){        
        d3.select('.line-plot'+nextYears[0].key).remove();
        return;
    }
    if(nextYears.length == 0 && !d3.selectAll('.line-plot'+year).empty()){
        if(!d3.select('.sparkLinesHide').empty()){
            for(i=0;i<yearsSparklineRemoval.length;i++){
                d3.select('.line-plot'+yearsSparklineRemoval[i]).classed('sparkLinesHide',false);
            }
        }
        return;
    }
    // end removal code

    var currYearTotal = yearTotal.filter(function (d) {
        if(year > 2011){
            return d.key == year || d.key == year - 1
        }            
        else
            return d.key == year
    })
    
    var lineInterpolate = d3.line()
        .x(function (d) { return xScaleSparkline(parseDate(d.value.year)); })
        .y(function (d) { return yScaleSparkline(d.value.totalAsylumSeekers); })

    var line = chartG
        .selectAll('.line-plot'  + year)
        .data([currYearTotal])

    var lineEnter = line
        .enter()
        .append("path")
        .attr('class','line-plot' + year)

    
    var mergedLine = lineEnter.merge(line)
    len = mergedLine.node().getTotalLength()
    g = len;
   

    mergedLine
    .attr('d', lineInterpolate)
    .attr("fill", function (d) {
        return "none"
    })
    .attr("stroke", "red")
    .attr("stroke-width", 3)
    .attr('class','line-plot' + year)
    .attr("len", function (d, i) {
        d.len = d3.select(this).node().getTotalLength() 
        return d3.select(this).node().getTotalLength()
    })
    .attr("stroke-dasharray", function (d, i) {
        return d.len + " " + d.len
    })
    .attr("stroke-dashoffset", function (d) {
        return d.len
    })
    .transition()
    .duration(2000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

}
function createSparklineCircles(currYearTotal) {
    var circle = chartG
        .selectAll('circle')
        .data(currYearTotal)

    circle.exit().remove();

    var circleEnter = circle
    .enter()
    .append("circle")
    .style("fill", "none")

    circleEnter.merge(circle)
    .attr('cx',function(d){
        return xScaleSparkline(parseDate(d.value.year));
    })
    .attr('cy',function(d){
        return yScaleSparkline(d.value.totalAsylumSeekers);
    })
    .attr('r',"2px")
    .transition()
    .ease(d3.easeLinear)    
    .style('fill', "#aa0000")
    .attr('çlass','sparklineCircle');
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function animateValue(id, start, end, duration) {
    var range = end - start;
    var current = start;
    var increment = end > start? 1000 : -1000;
    var stepTime = Math.abs(Math.floor(duration / range));
    var obj = document.getElementById(id);
    var timer = setInterval(function() {
        current += increment;
        obj.innerHTML = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, stepTime);
}

