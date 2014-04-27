///// constants about all maps, Desktop and Mobile as well as Admin and Contributor
///// The Admin and Contributor have their own versions too, which override the map URLs with SSL URLs
///// for Admin and Contributors maps, see admin.js and contributors.js

var MAP = null;

// the bounding box of the mappable area, for setting the initial view
// and potentially for restricting the map from zooming away (not enforced)
var BBOX_SOUTHWEST = L.latLng(41.11816, -82.08504);
var BBOX_NORTHEAST = L.latLng(41.70009, -81.28029);
var MAX_BOUNDS     = L.latLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST);

// the min and max zoom level: min (low) is further out and max (high) is further in
// level 11 covers the Cleveland region at full desktop size, level 18 is street level
var MIN_ZOOM = 11;
var MAX_ZOOM = 18;

// for focusing Bing's geocoder, so we don't find so we don't find Cleveland, Oregon
var GEOCODE_BIAS_BOX = "41.202048178648,-81.9627793163304,41.5885467839419,-81.386224018357";

// the URL to the MapFish Print system
//var PRINT_URL = "http://maps.clemetparks.com:48182/geoserver/pdf/create.json";
var PRINT_URL = "/pdf/create.json";
var PRINT_PICKUP_BASEURL = "/pdf/";

// our Bing Maps API key, used for the basemap, geocoding, and directions
var BING_API_KEY = "AjBuYw8goYn_CWiqk65Rbf_Cm-j1QFPH-gGfOxjBipxuEB2N3n9yACKu5s8Dl18N";

// for printing, the size of the map in each layout;
// used to calculate a bounding box for printing the map so it looks the same as on a monitor.
// These must match (or at least be very close) to the sizes given in MapFish Print's config.yaml
var PRINT_SIZES = {
    'Letter portrait' : [ 580, 714 ],
    'Letter landscape' : [ 762, 526 ],
    'Ledger portrait' : [ 744, 1126 ],
    'Ledger landscape' : [ 1178, 690 ]
};

// if either basemap changes, see also printMap() in common.js, to adjust the printing contrivances as needed
// This particularly applies to the MAPBASE if we change between a tiled layer (MapBox) and a WMS layer (GeoWebCache/GeoServer)
var PHOTOBASE = new L.TileLayer("http://{s}.tiles.mapbox.com/v3/greeninfo.map-zudfckcw/{z}/{x}/{y}.jpg");
//var PHOTOBASE = L.tileLayer.wms("http://maps1.clemetparks.com/gwc", { layers:'cm:Aerial_2011_OSIP_North', format:'image/jpeg' });

// the new TileStache-served ParkInfo-styled basemap
var MAPBASE   = new L.TileLayer("http://maps{s}.clemetparks.com/tilestache/tilestache.cgi/basemap/{z}/{x}/{y}.jpg", {subdomains:'123' });

// new list of layers: merged the 3 WMS layers into one.
// This effectively disables the ability to toggle layers individually, but improves load times
var OVERLAYS  = [];
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwms", { id:'closures', layers:'cm:closures,cm:markers_other,cm:markers_swgh', format:'image/png', transparent:'TRUE', subdomains:'123' });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'labels', layers:'group_overlays', format:'image/png', transparent:'TRUE', subdomains:'123' });
OVERLAYS[OVERLAYS.length] = L.TileLayer("http://{s}.sm.mapstack.stamen.com/(terrain-labels,$e7e7e5[hsl-color])/{z}/{x}/{y}.png", {subdomains:'abcd' });

/* OLD VERSION, separate layers for each type of marker, for labels, use areas, etc.
var OVERLAYS  = [];
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'mask', visibility:true, layers:'cm:parks_gradient', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'canopy', visibility:true, layers:'cm:canopy_coarse', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'use_areas', visibility:true, layers:'cm:use_areas', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'mask', visibility:true, layers:'cm:parks_gradient', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'trails', visibility:true, layers:'cm:trails', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/wms", { id:'closures', visibility:true, layers:'cm:closures', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'building_2006', visibility:true, layers:'cm:building_2006', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'road_shields', visibility:true, layers:'cm:road_shields', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
//OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'buildings', visibility:true, layers:'cm:buildings', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/wms", { id:'markers_other', visibility:true, layers:'cm:markers_other', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/wms", { id:'markers_swgh', visibility:true, layers:'cm:markers_swgh', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
OVERLAYS[OVERLAYS.length] = L.tileLayer.wms("http://maps{s}.clemetparks.com/gwc", { id:'labels', visibility:true, layers:'group_labels', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });
*/

/* to add route debugging into the map as it is running, paste this into the JavaScript console */
/*
var routedebug = L.tileLayer.wms("http://maps1.clemetparks.com/wms", { layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });
MAP.addLayer(routedebug);
*/
