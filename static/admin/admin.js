///// replace the map layers with our own version
///// This is identical to the public-facing version, except that we must use SSL
///// because Chrome and IE can't cope with mixing HTTP and HTTPS on the same page

var MAPBASE   = new L.TileLayer("https://maps1.clemetparks.com/tilestache/tilestache.cgi/basemap/{z}/{x}/{y}.jpg", { });

var OVERLAYS  = [];
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps2.clemetparks.com/wms", { id:'closures', visibility:true, layers:'cm:closures,cm:markers_other,cm:markers_swgh', format:'image/png', transparent:'TRUE' });
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps3.clemetparks.com/gwc", { id:'labels', visibility:true, layers:'group_overlays', format:'image/png', transparent:'TRUE' });

// almost identicval: we enable the Route Debugging layer for these maps
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("https://maps1.clemetparks.com/wms", { id:'routedebug', visibility:false, layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });



// on page load: start the map
function initAdminMap() {
    // start the map, add the basemap, zoom to the max extent
    MAP = new L.Map('map_canvas', {
        attributionControl: false, zoomControl: true, dragging: true,
        closePopupOnClick: true,
        crs: L.CRS.EPSG3857,
        maxZoom: 20,
        layers : [ MAPBASE ]
    });
    MAP.fitBounds(MAX_BOUNDS);
    L.control.scale().addTo(MAP);

    // add the overlay layers
    for (var i=0, l=OVERLAYS.length; i<l; i++) {
        var layer = OVERLAYS[i];
        if (layer.options.visibility) MAP.addLayer(layer);
    }

    // the layer picker
    MAP.addControl(new L.Control.Layers({
    },{
        'Route debugging' : OVERLAYS[OVERLAYS.length-1]
    }));

    // debugging: when the viewport changes, log the current bbox and zoom
    function debugOutput () {
        var DOTS_PER_INCH    = 72;
        var INCHES_PER_METER = 1.0 / 0.02540005080010160020;
        var INCHES_PER_KM    = INCHES_PER_METER * 1000.0;
        var sw       = MAP.getBounds().getSouthWest();
        var ne       = MAP.getBounds().getNorthEast();
        var halflng   = ( sw.lng + ne.lng ) / 2.0;
        var midBottom = new L.LatLng(sw.lat,halflng);
        var midTop    = new L.LatLng(ne.lat,halflng);
        var mheight   = midTop.distanceTo(midBottom);
        var pxheight  = MAP.getSize().x;
        var kmperpx   = mheight / pxheight / 1000.0;
        var scale    = Math.round( (kmperpx || 0.000001) * INCHES_PER_KM * DOTS_PER_INCH );
        scale *= 2.0; // no idea why but it's doubled
        scale = 1000 * Math.round(scale / 1000.0); // round to the nearest 100 so we can fit MapFish print's finite set of scales

        console.log([ 'zoom', MAP.getZoom() ]);
        console.log([ 'center', MAP.getCenter() ]);
        console.log([ 'bounds', MAP.getBounds() ]);
        console.log([ 'scale' , scale ]);
    }
    //MAP.on('moveend', debugOutput);
    //MAP.on('zoomend', debugOutput);
}
