function georgiaServices(){
    svg.selectAll("*").remove()

    d3.select("#leafletMap").style("display","block");

    var mymap = L.map('leafletMap').setView([33.247875, -83.44116], 7);
    accessToken = 'pk.eyJ1Ijoic2hyaXNodGlhayIsImEiOiJja243cG55dzMwMXFkMnBxeGE0aTdzdzhhIn0.FwMnMNXY1bhjWrLKPVyUxw'
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 12,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

    d3.csv('data/geoLocations.csv', function (geoLocations) {
            geoLocations.forEach((loc,i) => {
                var marker = L.circle([loc['Latitude'], loc['Longitude']]).addTo(mymap);
                marker.id = i
            })
    
            var popup = L.popup();
    
            function onMapClick(e) {
                console.log(e.id);
                popup
                    .setLatLng(e.latlng)
                    .setContent("You clicked the map at " + e.latlng.toString())
                    .openOn(mymap);
            }
    
            mymap.on('click', onMapClick);
        })
}