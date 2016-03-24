///// constants about all maps, Desktop and Mobile as well as Admin and Contributor
///// The Admin and Contributor have their own versions too, which override the map URLs with SSL URLs
///// for Admin and Contributors maps, see admin.js and contributors.js

var MAP = null;

// the bounding box of the mappable area, for setting the initial view
// and potentially for restricting the map from zooming away (not enforced)
var BBOX_SOUTHWEST = L.latLng(41.11816, -82.08504);
var BBOX_NORTHEAST = L.latLng(41.70009, -81.28029);
var MAX_BOUNDS = L.latLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST);

// the min and max zoom level: min (low) is further out and max (high) is further in
// level 11 covers the Cleveland region at full desktop size, level 18 is street level
var MIN_ZOOM = 11;
var MAX_ZOOM = 18;

// for focusing Bing's geocoder, so we don't find so we don't find Cleveland, Oregon
// tip: this doesn't in fact work; wishful thinking for when Bing does support it
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

// these basemaps are really basemaps WITH baked-in labels and features, so the map can function with only one overlay visible
var PHOTOBASE = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/satphoto_mobilestack/{z}/{x}/{y}.jpg", { name:'photo', subdomains:'123' });
var MAPBASE   = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/basemap_mobilestack/{z}/{x}/{y}.jpg", { name:'terrain', subdomains:'123' });

/* to add route debugging into the map as it is running, paste this into the JavaScript console */
/*
var routedebug = L.tileLayer.wms("http://maps1.clemetparks.com/wms", { layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });
MAP.addLayer(routedebug);
*/
