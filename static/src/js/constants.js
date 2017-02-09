 /**
 * constants.js
 *
 * JS constants.
 *
 * Cleveland Metroparks
 */

///// constants about all maps, Desktop and Mobile as well as Admin and Contributor
///// The Admin and Contributor have their own versions too, which override the map URLs with SSL URLs
///// for Admin and Contributors maps, see admin.js and contributors.js

// How we get to our app's controllers (primarily ajax).
// @TODO: Put this into a local config so we can handle non-root basedirs.
var APP_BASEPATH = '/';

var MAP = null;

// the bounding box of the mappable area, for setting the initial view
// and potentially for restricting the map from zooming away (not enforced)
var BBOX_SOUTHWEST = L.latLng(41.11816, -82.08504);
var BBOX_NORTHEAST = L.latLng(41.70009, -81.28029);
var MAX_BOUNDS = L.latLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST);

// the min and max zoom level: min (low) is further out and max (high) is further in
// level 11 covers the Cleveland region at full desktop size, level 18 is street level
var MIN_ZOOM = 10;
var MAX_ZOOM = 18;
// Default level for zooming in to POIs (when no zoom or bbox specified)
var DEFAULT_POI_ZOOM = 15;

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
var LAYER_TILESTACHE_SAT = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/satphoto_mobilestack/{z}/{x}/{y}.jpg", { name:'photo', subdomains:'123' });
var LAYER_TILESTACHE_MAP = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/basemap_mobilestack/{z}/{x}/{y}.jpg", { name:'terrain', subdomains:'123' });

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xldmVsYW5kLW1ldHJvcGFya3MiLCJhIjoiWHRKaDhuRSJ9.FGqNSOHwiCr2dmTH2JTMAA';
L.mapbox.accessToken = MAPBOX_TOKEN;

// Mapbox map tiles baselayer
const MAPBOX_MAP_URL_FRAG = 'cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn';
var LAYER_MAPBOX_MAP = L.tileLayer(
    'https://api.mapbox.com/styles/v1/' + MAPBOX_MAP_URL_FRAG + '/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken, {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

// Mapbox satellite baselayer
const MAPBOX_SAT_URL_FRAG = 'cleveland-metroparks/ciy5w28va00322so4ymd2cqjm';
var LAYER_MAPBOX_SAT = L.tileLayer(
    'https://api.mapbox.com/styles/v1/' + MAPBOX_SAT_URL_FRAG + '/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken, {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

// Mapbox GL-Leaflet map tiles baselayer
// Experimental GL+Leaflet binding - https://github.com/mapbox/mapbox-gl-leaflet
var LAYER_MAPBOX_GL_MAP = L.mapboxGL({
    accessToken: MAPBOX_TOKEN,
    style: 'mapbox://styles/' + MAPBOX_MAP_URL_FRAG
});

const ALL_LAYERS = [
    //LAYER_TILESTACHE_MAP,
    //LAYER_TILESTACHE_SAT,
    LAYER_MAPBOX_MAP,
    LAYER_MAPBOX_SAT,
    LAYER_MAPBOX_GL_MAP
];

const AVAILABLE_LAYERS = {
    'map' : LAYER_MAPBOX_MAP,
    'photo' : LAYER_MAPBOX_SAT,
    'vector' : LAYER_MAPBOX_GL_MAP
};

/* to add route debugging into the map as it is running, paste this into the JavaScript console */
/*
var routedebug = L.tileLayer.wms("http://maps1.clemetparks.com/wms", { layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });
MAP.addLayer(routedebug);
*/