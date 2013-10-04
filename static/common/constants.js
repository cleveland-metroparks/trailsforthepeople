///// constants about all maps, Desktop and Mobile as well as Admin and Contributor
///// The Admin and Contributor have their own versions too, which override the map URLs with SSL URLs
///// for Admin and Contributors maps, see admin.js and contributors.js

var MAP = null;

// the bounding box of the mappable area, for setting the initial view
// and potentially for restricting the map from zooming away (not enforced)
var BBOX_SOUTHWEST = new L.LatLng(41.11816, -82.08504);
var BBOX_NORTHEAST = new L.LatLng(41.70009, -81.28029);
var MAX_BOUNDS     = new L.LatLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST);

// the min and max zoom level: min (low) is further out and max (high) is further in
// level 11 covers the Cleveland region at full desktop size, level 18 is street level
var MIN_ZOOM = 11;
var MAX_ZOOM = 17;

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
//var PHOTOBASE = new L.TileLayer.WMS("http://maps1.clemetparks.com/gwc", { layers:'cm:Aerial_2011_OSIP_North', format:'image/jpeg' });

// the new TileStache-served ParkInfo-styled basemap
var MAPBASE   = new L.TileLayer("http://69.54.58.148/tilestache/tilestache.cgi/basemap/{z}/{x}/{y}.jpg", {subdomains:'123' });

// new list of layers: merged the 3 WMS layers into one.
// This effectively disables the ability to toggle layers individually, but improves load times
var OVERLAYS  = [];
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("http://69.54.58.148/wms", { id:'closures', layers:'cm:closures,cm:markers_other,cm:markers_swgh', format:'image/png', transparent:'TRUE', subdomains:'123' });
OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("http://69.54.58.148/gwc", { id:'labels', layers:'group_overlays', format:'image/png', transparent:'TRUE', subdomains:'123' });

