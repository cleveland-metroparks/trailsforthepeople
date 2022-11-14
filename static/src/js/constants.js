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

// How we get to our app's base files and to the API.
// These change to remote URLs in main-site embedded maps.
// @TODO: Put these into a local config so we can handle non-root basedirs.
var WEBAPP_BASEPATH = '/';
var API_BASEPATH = '/';
var MAP = null;

var API_NEW_HOST = 'maps-api-dev2.clevelandmetroparks.com';
var API_NEW_PROTOCOL = 'https:';
var API_NEW_BASEPATH = '/api/v1/';
var API_NEW_BASE_URL = API_NEW_PROTOCOL + '//' + API_NEW_HOST + API_NEW_BASEPATH;

var WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL = 'https:';
var WEBAPP_BASE_URL_ABSOLUTE_HOST = 'maps.clevelandmetroparks.com';
var WEBAPP_BASE_URL_ABSOLUTE = WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL + '//' + WEBAPP_BASE_URL_ABSOLUTE_HOST + '/';

var CM_SITE_BASEURL = 'https://www.clevelandmetroparks.com/';

// the bounding box of the mappable area, for setting the initial view
// and potentially for restricting the map from zooming away (not enforced)
var MAX_BOUND_SW = new mapboxgl.LngLat(-82.08504, 41.11816);
var MAX_BOUND_NE = new mapboxgl.LngLat(-81.28029, 41.70009);
var MAX_BOUNDS = new mapboxgl.LngLatBounds(MAX_BOUND_SW, MAX_BOUND_NE);

// Default level for zooming in to POIs (when no zoom or bbox specified)
var DEFAULT_POI_ZOOM = 15;

// for focusing Bing's geocoder, so we don't find so we don't find Cleveland, Oregon
// tip: this doesn't in fact work; wishful thinking for when Bing does support it
var GEOCODE_BIAS_BOX = "41.202048178648, -81.9627793163304, 41.5885467839419, -81.386224018357";

// the URL to the MapFish Print system
//var PRINT_URL = "http://maps.clemetparks.com:48182/geoserver/pdf/create.json";
var PRINT_URL = "/pdf/create.json";
var PRINT_PICKUP_BASEURL = "/pdf/";

// our Bing Maps API key, used for the basemap, geocoding, and directions
var BING_API_KEY = "AjBuYw8goYn_CWiqk65Rbf_Cm-j1QFPH-gGfOxjBipxuEB2N3n9yACKu5s8Dl18N";

// For printing, the map size of each layout.
// Used to calculate a bounding box for printing the map, so it looks the same as on a monitor.
// These must match (or at least be very close) to the sizes given in MapFish Print's config.yaml.
var PRINT_SIZES = {
    'Letter portrait' : [ 580, 714 ],
    'Letter landscape' : [ 762, 526 ],
    'Ledger portrait' : [ 744, 1126 ],
    'Ledger landscape' : [ 1178, 690 ]
};

var START_CENTER = [-81.6730, 41.3953];
var START_ZOOM = 14;

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2xldmVsYW5kLW1ldHJvcGFya3MiLCJhIjoiWHRKaDhuRSJ9.FGqNSOHwiCr2dmTH2JTMAA';

// Mapbox styles (baselayers)
var STYLE_LAYER_CM_MAP = 'mapbox://styles/cleveland-metroparks/cisvvmgwe00112xlk4jnmrehn'; // Vector
var STYLE_LAYER_CM_SAT = 'mapbox://styles/cleveland-metroparks/cjcutetjg07892ro6wunp2da9'; // Satellite

var STYLE_LAYERS = {
    'map' : STYLE_LAYER_CM_MAP,
    'photo' : STYLE_LAYER_CM_SAT
};

var STYLE_NAMES = {
    'CM Light' : 'map',
    'CM-Aerial' : 'photo'
};
