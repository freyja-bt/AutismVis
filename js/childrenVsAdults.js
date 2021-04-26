function childrenVsAdults() {
    console.log("children vs adults")
    svg.selectAll("*").remove()
    var simulation;
    var populationGroups = [];

    function ticked() {
        console.log("ticked")
        var u = svg
            .selectAll('.populationCircle')
            .data(populationGroups)


        u.enter()
            .append('circle')
            .attr('class', 'populationCircle')
            .attr('r', function (d) {
                console.log("nothing")
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
    function createStickyNodes() {
        populationColors = ["#a6c8ff","#0f62fe"]
        populationLabelColors = ["black", "white"]
        numChildren = 1500000//1921908	
        numAdults =   5437988

        radiusScale = d3.scaleLinear().domain([0, numAdults]).range([0, 200]);

        populationGroups = [{ count : numChildren, approx: "1.5 M" }, { count: numAdults, approx: "5.4 M" }];

        simulation = d3.forceSimulation(populationGroups)
            .force('charge', d3.forceManyBody().strength(1000))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(function (d) {
                return radiusScale(d.count)
            }))
            .stop();
        //.on('tick', ticked)
        for (var i = 0; i < 1000; ++i) simulation.tick();

        var u = svg
            .selectAll('.populationCircle')
            .data(populationGroups)


        u.enter()
            .append('circle')
            .attr('class', 'populationCircle')
            .attr('r', function (d) {
                return 0
            })
            .style("fill", (d,i) => {return populationColors[i]})
            .merge(u)
            .attr('cx', function (d) {
                return d.x
            })
            .attr('cy', function (d) {
                return d.y
            })
            .transition()
            .duration(1000)
            .attr('r', function(d){
                return radiusScale(d.count)
            })

        u.exit().remove()

        labels = svg
            .selectAll("text")
            .data(populationGroups)
            .enter()
            .append('text')
            .attr("class", "populationText")
            .attr("fill", (d,i) => populationLabelColors[i])
            .attr("text-anchor", "middle")
            .attr('x', d=> {return d.x})
            .attr('y', d=> {return d.y})
            .transition()
            .delay(1000)
            .attr('x', d=> {return d.x})
            .attr('y', d=> {return d.y})
            
            .text(d=> {
                return d.approx
            })



    }
    createStickyNodes()
    //simulation.stop();
}