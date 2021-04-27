leafletScrollDown = true;
function georgiaServices() {
    if(!leafletScrollDown){
        d3.select("#leafletMap").style("display", "block");
        return;
    }
    leafletScrollDown = !leafletScrollDown;

    svg.select(".cartogram").style("display", "none");
    svg.select(".unitVisGroup").style("display", "none");

    d3.select("#leafletMap").style("display", "block");

    var mymap = L.map('leafletMap').setView([33.247875, -83.44116], 8);
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
        filteredData = data.filter(d=>{
            return d["source"] == "p2p"
        })
        myCircleMarker = L.CircleMarker.extend({
            options: {
                name: "",
                age: ""
            }
        })
        filteredData.forEach((loc, i) => {
            var marker = new myCircleMarker([loc['lat'], loc['lon']],{
                radius: 5,
                fill: true,
                fillColor: "red",
                fillOpacity: 0.5,
                color: "red",
                name: loc["name"],
                age: loc["ages"]
            }
            )
            marker.id = i
            marker.addTo(mymap);
            marker.on("click", onClick)
            //console.log(marker.getRadius())
            //marker.setRadius(5);
            
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
        function onClick(e){
            // console.log(this)
            popup
                .setLatLng(this._latlng)
                .setContent(this.options.name)
                .openOn(mymap);
        }
    })
}