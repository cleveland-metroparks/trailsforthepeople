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

var API_NEW_HOST = 'maps-api.clevelandmetroparks.com';
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

;
/**
 * common.js
 *
 * JS for common app functionality.
 *
 * Cleveland Metroparks
 */

var isMobile = /Mobi/.test(navigator.userAgent); // Simple mobile device detection.

// Markers
var MARKER_TARGET = new mapboxgl.Marker({ color: '#207FD0' });
var MARKER_START = new mapboxgl.Marker({ color: '#6BB03E' }); // Directions start
var MARKER_END = new mapboxgl.Marker({ color: '#FF7866' }); // Directions end

var SKIP_TO_DIRECTIONS = false;

var ctrlGeolocate;

var SETTINGS = [];
// We'll get this from localStorage on document ready
SETTINGS.coordinate_format = 'dms';

/**
 * Initialize the map
 *
 * @param mapOptions {object}: Custom map initialization options
 *   @TODO: Allow using any Mapbox GL native Map option.
 *   base {string}: 'photo' / 'map'
 *   trackUserLocation {boolean}: for geolocate control
 *   lat {float}
 *   lng {float}
 *   zoom {int}
 *   drop_marker {boolean}
 *   scrollZoom {boolean}
 */
function initMap(mapOptions) {
    // Base map type; URL param or map (vs photo/satellite) default
    var base = mapOptions.base || 'map';
    var basemap_style; // Mapbox base style layer

    switch (base) {
        case 'photo':
            basemap_style = STYLE_LAYER_CM_SAT;
            break;
        case 'map':
        default:
            basemap_style = STYLE_LAYER_CM_MAP;
            break;
    }

    // Map
    MAP = new mapboxgl.Map({
        container: 'map_canvas',
        style: basemap_style,
        center: START_CENTER,
        zoom: START_ZOOM,
        preserveDrawingBuffer: true // for printing in certain browsers
    });

    // Nav (zoom/tilt) Control
    var ctrlNav = new mapboxgl.NavigationControl();
    MAP.addControl(ctrlNav, 'bottom-right');

    // Geolocate control
    ctrlGeolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: (mapOptions.trackUserLocation == false) ? false : true,
    });
    MAP.addControl(ctrlGeolocate, 'bottom-right');

    // Scale control
    var ctrlScale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'imperial'
    });
    MAP.addControl(ctrlScale, 'bottom-left');

    // Zoom to the lat/lng/zoom given in the URL, or else to the max extent
    if (mapOptions.lat && mapOptions.lng && mapOptions.zoom) {
        var lat = parseFloat(mapOptions.lat);
        var lng = parseFloat(mapOptions.lng);
        var zoom = parseInt(mapOptions.zoom);
        MAP.setCenter([lng, lat]);
        MAP.setZoom(zoom);
        if (mapOptions.drop_marker) {
            MAP.addLayer(MARKER_TARGET);
            placeMarker(MARKER_TARGET, lng, lat);
        }
    } else {
        MAP.fitBounds(MAX_BOUNDS);
    }

    // Fire mapInitialized event
    $.event.trigger({
        type: 'mapInitialized',
    });
}

/**
 * Place marker
 */
function placeMarker(marker, lat, lng) {
    marker.setLngLat([lng, lat])
        .addTo(MAP);
}

/**
 * Clear marker
 */
function clearMarker(marker) {
    marker.remove();
}

/**
 * Show informational popup
 */
function showInfoPopup(message, type) {
    switch (type) {
        case 'warning':
            classes = 'info-popup warning';
            break;
        case 'error':
            classes = 'info-popup error';
            break;
        default:
            classes = 'info-popup';
    }
    var info_popup = new mapboxgl.Popup({
        closeOnClick: false,
        className: classes,
    });
    info_popup
        .setLngLat(MAP.getCenter())
        .setHTML(message)
        .addTo(MAP);
}

/**
 * Enable the given base map layer.
 *
 * @param layer_key: Must refer to the key of an available layer (in STYLE_LAYERS constant).
 */
function changeBasemap(layer_key) {
    active_layer = STYLE_LAYERS[layer_key];
    MAP.setStyle(active_layer);
}

/**
 *
 */
function getBasemap() {
    style = MAP.getStyle();
    return STYLE_NAMES[style.name];
}

/**
 * Return lat/lng as string in prescribed coordinate format.
 */
function formatCoords(lngLat, coordinate_format) {
    if (coordinate_format != null) {
        format = coordinate_format;
    } else {
        format = SETTINGS.coordinate_format;
    }
    switch (format) {
        case 'ddm':
            return formatCoordsDdm(lngLat);
        case 'dd':
            return formatCoordsDd(lngLat);
        case 'dms':
        default:
            return formatCoordsDms(lngLat);
    }
}

/**
 * Return lat/lng as Degrees Minutes Seconds (DMS) string.
 */
function formatCoordsDms(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ? precision : 0;

    var ns = lngLat.lat < 0 ? 'S' : 'N';
    var ew = lngLat.lng < 0 ? 'W' : 'E';

    lat_dd = Math.abs(lngLat.lat);
    lng_dd = Math.abs(lngLat.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = parseInt(60 * (lat_dd - lat_d));
    var lat_s = ((lat_dd - lat_d - (lat_m / 60)) * 3600).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = parseInt(60 * (lng_dd - lng_d));
    var lng_s = ((lng_dd - lng_d - (lng_m / 60)) * 3600).toFixed(precision);;

    coordsStr = lat_d + '° ' + lat_m + '\' ' + lat_s + '" ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + lng_s + '" ' + ew;

    return coordsStr;
}

/**
 * Return lat/lng as Degrees Decimal Minutes (DDM) string.
 */
function formatCoordsDdm(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ? precision : 2;

    var ns = lngLat.lat < 0 ? 'S' : 'N';
    var ew = lngLat.lng < 0 ? 'W' : 'E';

    var lat_dd = Math.abs(lngLat.lat);
    var lng_dd = Math.abs(lngLat.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = (60 * (lat_dd - lat_d)).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = (60 * (lng_dd - lng_d)).toFixed(precision);

    coordsStr = lat_d + '° ' + lat_m + '\' ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + ew;

    return coordsStr;
}

/**
 * Return lat/lng as Decimal Degrees (DD) string.
 */
function formatCoordsDd(lngLat, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ? precision : 4;

    coordsStr = lngLat.lat.toFixed(precision) + ', ' + lngLat.lng.toFixed(precision);
    return coordsStr;
}

/**
 * Shorten a string to a maximum character length, on a word/whitespace boundary.
 *
 * @param: {string} str
 * @param: {integer} maxLen
 * @param: {boolean} addEllipsis
 */
function shortenStr(str, maxLen, addEllipsis) {
    if (str.length <= maxLen) {
        return str;
    }
    var shortenedStr = str.substr(0, str.lastIndexOf(' ', maxLen));
    if (addEllipsis) {
        shortenedStr += '...';
    }
    return shortenedStr;
}

/**
 * Set query string parameters in window location.
 *
 * @param {URLSearchParams} urlParams
 * @param {Boolean} pushState: Whether to push the new URL onto the stack
 *        so that the back button can be used.
 */
function saveWindowURL(urlParams, pushState) {
    WINDOW_URL = decodeURIComponent(location.pathname + '?' + urlParams);
    WINDOW_URL_QUERYSTRING = urlParams.toString();
    if (pushState) {
        // Add this state to the window's history stack,
        // so the user can use the back button to get back to it.
        window.history.pushState(null, null, WINDOW_URL);
    } else {
        // Simply change the URL in the address bar,
        // not adding to the stack.
        window.history.replaceState(null, null, WINDOW_URL);
    }
}

/**
 * Set a bunch of query string parameters in window location.
 *
 * @param {object} params: 
 * @param {Boolean} reset: Whether to clear all existing parameters.
 * @param {Boolean} pushState: Whether to push the new URL onto the stack
 *        so that the back button can be used.
 */
function setWindowURLQueryStringParameters(params, reset, pushState) {
    var urlParams;
    if (reset) {
        urlParams = new URLSearchParams();
    } else {
        urlParams = new URLSearchParams(location.search);
    }

    $.each(params, function (index, value) {
        urlParams.set(index, value);
    });

    saveWindowURL(urlParams, pushState);
}

;
/**
 * data.js
 *
 * JS for basic maps/trails data management.
 *
 * Cleveland Metroparks
 */


//
// Create our global data object into which we'll pre-load necessary data from the API.
//
var CM = {
    activities : [],
    amenities : [],
    attractions : [],
    attractions_nearby : [],
    autocomplete_keywords : [],
    categories : [],
    reservations : [],
    trails : [],
    visitor_centers : []
};

//
// Initialize search index
//
var fuseOptions = {
    keys: ['title'],
    includeScore: true,
    // Don't set threshold on search pattern location in string
    // See:
    //   https://fusejs.io/api/options.html
    //   https://fusejs.io/concepts/scoring-theory.html
    ignoreLocation: true
};
var dummySearchItem = {
    title: 'title',
    gid: 'gid',
    type: 'type',
    w: 'boxw',
    s: 'boxs',
    e: 'boxe',
    n: 'boxn',
    lat: 'latitude',
    lng: 'longitude',
    drivingLat: 'drivingDestinationLatitude',
    drivingLng: 'drivingDestinationLongitude'
};
var fuse = new Fuse([dummySearchItem], fuseOptions);

//
// Get categories, and populate global object, CM.categories
//
$.get(API_NEW_BASE_URL + 'categories', null, function (reply) {
    // Key by categorytypeid
    for (var i = 0; i < reply.data.length; i++) {
        var id = reply.data[i].categorytypeid;
        CM.categories[id] = {
            name: reply.data[i].name
        };
    }

    $.event.trigger({
        type: 'dataReadyCategories',
    });
}, 'json');

//
// Get amenities, and populate global object, CM.amenities
//
$.get(API_NEW_BASE_URL + 'amenities', null, function (reply) {
    CM.amenities = reply.data;

    var amenity_icons = {
        '221': 'baseball',     // Ball Field
        '231': 'basketball',   // Basketball Court
        '280': 'boat_rental',  // Boat Rentals
        '14':  'drink',        // Drinking Fountain
        '243': 'playground',   // Play Area
        '13':  'restroom',     // Restrooms
        '28':  'gifts',        // Shopping/Souvenirs
        '240': 'volleyball'    // Volleyball Courts
    };

    // Add icons
    CM.amenities.forEach(function(amenity) {
        amenity.icon = amenity_icons[amenity.amenitytypeid];
    });

    $.event.trigger({
        type: 'dataReadyAmenities',
    });
}, 'json');

//
// Get visitor centers and populate global object, CM.visitor_centers
//
$.get(API_NEW_BASE_URL + 'visitor_centers', null, function (reply) {
    CM.visitor_centers = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.visitor_centers.forEach(function(visitor_center) {
        visitor_center.categories = visitor_center.categories ? visitor_center.categories.split('|').map(Number) : null;
        visitor_center.amenities = visitor_center.amenities ? visitor_center.amenities.split('|').map(Number) : null;
        visitor_center.activities = visitor_center.activities ? visitor_center.activities.split('|').map(Number) : null;
    });

    $.event.trigger({
        type: 'dataReadyVisitorCenters',
    });
}, 'json');

//
// Get reservations, and populate global object, CM.reservations
//
$.get(API_NEW_BASE_URL + 'reservations', null, function (reply) {
    CM.reservations = reply.data;

    // Add to Fuse search index
    CM.reservations.forEach(function(reservation) {
        searchItem = {
            title: reservation.pagetitle,
            gid: reservation.record_id,
            type: 'reservation_new',
            w: reservation.boxw,
            s: reservation.boxs,
            e: reservation.boxe,
            n: reservation.boxn,
            lat: reservation.latitude,
            lng: reservation.longitude,
            drivingLat: reservation.drivingdestinationlatitude,
            drivingLng: reservation.drivingdestinationlongitude
        };
        fuse.add(searchItem);
    });

    $.event.trigger({
        type: 'dataReadyReservations',
    });
}, 'json');

//
// Get attractions, and populate global object, CM.attractions
//
$.get(API_NEW_BASE_URL + 'attractions', null, function (reply) {
    CM.attractions = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.attractions.forEach(function(attraction) {
        attraction.categories = attraction.categories ? attraction.categories.split('|').map(Number) : null;
        attraction.amenities = attraction.amenities ? attraction.amenities.split('|').map(Number) : null;
        attraction.activities = attraction.activities ? attraction.activities.split('|').map(Number) : null;
    });

    // Add to Fuse search index
    CM.attractions.forEach(function(attraction) {
        searchItem = {
            title: attraction.pagetitle,
            gid: attraction.gis_id, // @TODO: record_id or gis_id ?
            type: 'attraction',
            w: null,
            s: null,
            e: null,
            n: null,
            lat: attraction.latitude,
            lng: attraction.longitude,
            drivingLat: attraction.drivingdestinationlatitude,
            drivingLng: attraction.drivingdestinationlongitude
        };
        fuse.add(searchItem);
    });
    $.event.trigger({
        type: 'dataReadyAttractions',
    });
}, 'json');

/**
 * Get and assemble activity icon file path from activity ID
 */
function activity_icon_filepath(activity_id) {
    var icons_dir = '/static/images/activities/'; // @TODO: Put in config and include basepath
    var activity_type_icons_by_id = {
         1: 'bike',      // Biking & Cycling
         2: 'swim',      // Swimming
         3: 'boat',      // Boating, Sailing & Paddlesports
         4: 'hike',      // Hiking & Walking
         5: 'fish',      // Fishing & Ice Fishing
         6: 'archery',   // Archery
         7: 'xcski',     // Cross-Country Skiing
         9: 'geocache',  // Geocaching
        11: 'horse',     // Horseback Riding
        12: 'mtnbike',   // Mountain Biking
        13: 'picnic',    // Picnicking
        14: '',          // Races & Competitions
        15: 'sled',      // Sledding
        16: 'snowshoe',  // Snowshoeing
        17: '',          // Tobogganing
        18: 'leafman',   // Rope Courses & Zip Lines
        19: 'geology',   // Exploring Nature
        20: 'history',   // Exploring Culture & History
        21: 'dine',      // Dining
        22: '',          // Classes, Workshops, & Lectures
        23: 'leafman',   // Special Events & Programs
        24: '',          // Concerts & Movies
        25: 'fitness',   // Fitness Circuit
        26: '',          // Disc Golf
        30: 'golf',      // Golfing
        39: 'fitness',   // Exercising
        41: '',          // FootGolf
    };
    var filename = activity_type_icons_by_id[activity_id];
    if (filename) {
        var icon_path = icons_dir + filename + '.svg';
        return icon_path;
    } else {
        return null;
    }
}

//
// Get activities, and populate global object, CM.activities
// Keyed by eventactivitytypeid.
//
$.get(API_NEW_BASE_URL + 'activities', null, function (reply) {
    // Key by eventactivitytypeid
    for (var i = 0; i < reply.data.length; i++) {
        var id = reply.data[i].eventactivitytypeid;
        CM.activities[id] = reply.data[i];
        CM.activities[id].icon = activity_icon_filepath(id);
    }

    $.event.trigger({
        type: 'dataReadyActivities',
    });
}, 'json');

//
// Get autocomplete keywords, and populate global object, CM.autocomplete_keywords
//
$.get(API_NEW_BASE_URL + 'autocomplete_keywords', null, function (reply) {
    for (var i = 0; i < reply.data.length; i++) {
        CM.autocomplete_keywords.push(reply.data[i].word);
    }

    $.event.trigger({
        type: 'dataReadyAutocompleteKeywords',
    });
}, 'json');

//
// Transform string interpretations of booleans into actual booleans.
// Really only need "Yes" and "No", but adding some extras for safety.
//
function str_to_bool(str) {
    switch (str) {
        case "Yes":
        case "yes":
        case "True":
        case "true":
        case "1":
        case 1:
        case true:
            return true;
        case "No":
        case "no":
        case "False":
        case "false":
        case "0":
        case 0:
        case false:
        case "":
        case null:
        default:
            return false;
    }
}

//
// Get trails, and populate global object, CM.trails
//
$.get(API_NEW_BASE_URL + 'trails', null, function (reply) {
    // Key by id
    for (var i = 0; i < reply.data.length; i++) {
        trail = reply.data[i];
        // Change string versions of "Yes" & "No" into booleans
        trail.bike = str_to_bool(trail.bike);
        trail.hike = str_to_bool(trail.hike);
        trail.bridle = str_to_bool(trail.bridle);
        trail.mountainbike = str_to_bool(trail.mountainbike);

        CM.trails[reply.data[i].id] = trail;
    }

    // Add to Fuse search index
    CM.trails.forEach(function(trail) {
        searchItem = {
            title: trail.name,
            gid: trail.id,
            type: 'loop',
            w: trail.boxw,
            s: trail.boxs,
            e: trail.boxe,
            n: trail.boxn,
            lat: trail.lat,
            lng: trail.lng
        };
        fuse.add(searchItem);
    });

    $.event.trigger({
        type: 'dataReadyTrails',
    });
}, 'json');

/**
 * Get reservation by record_id.
 * Because our data comes in ordered alphabetically,
 * because the db table has no primary key, and record_id
 * can't necessarily be relied upon.
 *
 * @param record_id
 *
 * @return reservation if found, or null
 */
CM.get_reservation = function(record_id) {
    for (var i = 0; i < CM.reservations.length; i++) {
        if (CM.reservations[i].record_id == record_id) {
            return CM.reservations[i];
        }
    }
}

/**
 * Get attraction by gis_id.
 * Because our data comes in ordered alphabetically,
 * because the db table has no primary key, and gis_id
 * is sometimes null.
 *
 * @param gis_id
 *
 * @return attraction if found, or null
 */
CM.get_attraction = function(gis_id) {
    for (var i = 0; i < CM.attractions.length; i++) {
        if (CM.attractions[i].gis_id == gis_id) {
            return CM.attractions[i];
        }
    }
}

/**
 * Get attractions that offer specified activities
 *
 * @param activity_ids
 */
CM.get_attractions_by_activity = function(activity_ids) {
    // Accept either a single Activity ID or an array of them.
    var activity_ids = Array.isArray(activity_ids) ? activity_ids : [activity_ids];
    // Strings to ints
    activity_ids = activity_ids.map(Number);

    var filtered_attractions = [];

    CM.attractions.forEach(function(attraction) {
        var found = true;

        // Check whether ALL searched-for activities are in this Attraction's list (ANDed)
        for (var i = 0; i < activity_ids.length; i++) {
            if (!attraction.activities || !attraction.activities.includes(activity_ids[i])) {
                found = false;
                break;
            }
        }

        if (found) {
            filtered_attractions.push(attraction);
        }
    });

    return filtered_attractions;
}

/**
 * Get attractions that have offer specified amenities
 *
 * @param amenity_ids
 */
CM.get_attractions_by_amenity = function(amenity_ids) {
    // Accept either a single Amenity ID or an array of them.
    var amenity_ids = Array.isArray(amenity_ids) ? amenity_ids : [amenity_ids];
    // Strings to ints
    amenity_ids = amenity_ids.map(Number);

    var filtered_attractions = [];

    CM.attractions.forEach(function(attraction) {
        var found = true;

        // Check whether ALL searched-for amenities are in this Attraction's list (ANDed)
        for (var i = 0; i < amenity_ids.length; i++) {
            if (!attraction.amenities || !attraction.amenities.includes(amenity_ids[i])) {
                found = false;
                break;
            }
        }

        if (found) {
            filtered_attractions.push(attraction);
        }
    });

    return filtered_attractions;
}

;
 /**
 * mobile.js
 *
 * Cleveland Metroparks
 *
 * JS for main app map.
 */

// Maintain the current window URL (it changes with most user actions) so we can use in sharing.
var WINDOW_URL = null;
// Keep track of the query string separately, too, for native
var WINDOW_URL_QUERYSTRING = null;

// App sidebar (sidebar-v2)
var sidebar = null;

// Used by Nearby: sound an alert only if the list has in fact changed
var LAST_BEEP_IDS = [];

// other stuff pertaining to our last known location and auto-centering
var LAST_KNOWN_LOCATION = mapboxgl.LngLat.convert(START_CENTER);

var AUTO_CENTER_ON_LOCATION = false;

// sorting by distance, isn't always by distance
// what type of sorting do they prefer?
var DEFAULT_SORT = 'distance';

// If TrailView is enabled
var TRAILVIEW_ENABLED = true;

// Load sidebar when map has been initialized
$(document).on("mapInitialized", function () {
    if (!sidebar) {
        sidebar = $('#sidebar').sidebar();
    }

    // Open "Welcome" sidebar pane on startup if:
    //   User loads the app without a path or query string AND
    //   their screen is big enough that the sidebar won't cover the map.
    if (window.location.pathname == '/' && window.location.search == '' && !sidebarCoversMap()) {
        sidebar.open('pane-welcome');
    } else {
        var startHereTooltip = createStartHereTooltip();
        setTimeout(startHereTooltip.show, 2500);
        // @TODO: Clear or don't show tooltip if user starts using sidebar
        setTimeout(startHereTooltip.dispose, 15000);
        $(document).click(function() {
            startHereTooltip.hide();
        });
    }
});

/**
 * Create the "Start here" tooltip.
 */
function createStartHereTooltip() {
    var welcomeTabEl = $('.sidebar-tabs ul li:first')[0];
    var pageEl = $('body > div.ui-page')[0];

    var tooltip = new Tooltip(welcomeTabEl, {
        title: "Start exploring here!",
        container: pageEl,
        placement: 'right',
        trigger: 'manual'
    });
    return tooltip;
}

/**
 * If the user has a small screen, close the sidebar to see the map.
 */
function switchToMap() {
    if (sidebarCoversMap()) {
        sidebar.close();
    }
}

/**
 * Load the map and process query string parameters on doc ready.
 */
$(document).ready(function () {
    loadMapAndStartingState();
    populateSidebarPanes();
    initTrailView();
});

/**
 * When the back button is clicked, re-load map and state.
 */
window.onpopstate = function() {
    loadMapAndStartingState();
};

/**
 * Load the map and process query string parameters to initiate state.
 */
function loadMapAndStartingState() {
    var urlParams = new URLSearchParams(location.search);

    // lat,lng,zoom params are appended to the user's URL from normal map movement
    // x,y,z are older/legacy forms of same
    var lat = urlParams.get('lat') || urlParams.get('y');
    var lng = urlParams.get('lng') || urlParams.get('x');
    var zoom = urlParams.get('zoom') || urlParams.get('z');

    var drop_marker = false;

    mapOptions = {
        base: urlParams.get('base'),
        lat: lat,
        lng: lng,
        zoom: zoom,
        drop_marker: drop_marker
    };

    // Initialize the map
    initMap(mapOptions);

    // URL params query string: "type" and "gid"
    if (urlParams.get('type') && urlParams.get('gid') ) {
        var featureType = urlParams.get('type');

        switch (featureType) {

            case 'attraction':
                // Wait to ensure we have the data
                $(document).on("dataReadyAttractions", function() {
                    var gis_id = urlParams.get('gid');
                    var feature = {};
                    if (attraction = CM.get_attraction(gis_id)) {
                        feature.gid   = attraction.gis_id;
                        feature.title = attraction.pagetitle;
                        feature.lat   = attraction.latitude;
                        feature.lng   = attraction.longitude;
                    }
                    if (feature.lat && feature.lng) {
                        zoomToFeature(feature);
                        showFeatureInfo(featureType, feature);
                    } else {
                        return alert("Cound not find that feature.");
                    }
                });
                break;

            case 'reservation_new':
                // Wait to ensure we have the data
                $(document).on("dataReadyReservations", function() {
                    var record_id = urlParams.get('gid');
                    var feature = {};
                    feature.type = 'reservation_new';
                    if (reservation = CM.get_reservation(record_id)) {
                        feature.gid   = reservation.record_id;
                        feature.w     = reservation.boxw;
                        feature.n     = reservation.boxn;
                        feature.e     = reservation.boxe;
                        feature.s     = reservation.boxs;
                        feature.lat   = reservation.latitude;
                        feature.lng   = reservation.longitude;
                    }

                    if ((feature.w && feature.n && feature.e && feature.s)
                            || (feature.lat && feature.lng)) {
                        zoomToFeature(feature);
                        showFeatureInfo(featureType, feature);
                    } else {
                        return alert("Cound not find that reservation.");
                    }
                });
                break;

            case 'loop':
                // Wait to ensure we have the data
                $(document).on("dataReadyTrails", function() {
                    var feature = {
                        type: 'loop',
                        gid: urlParams.get('gid')
                    };

                    // @TODO: Lookup loop feature.

                    showFeatureInfo(featureType, feature);
                });
                break;
        }
    }

    // URL params: Get Directions
    if (urlParams.get('action') == 'directions') {
        var via = urlParams.get('via');

        var sourceText = urlParams.get('sourceText');
        if (sourceText) {
            $('#source-input').val(sourceText);
        }

        var sourceLat = urlParams.get('sourceLatLng').split(",")[0];
        var sourceLng = urlParams.get('sourceLatLng').split(",")[1];
        var sourceLngLat = new mapboxgl.LngLat(sourceLng, sourceLat);
        setDirectionsInputLngLat($('#source-input'), sourceLngLat);

        var targetText = urlParams.get('targetText');
        if (targetText) {
            $('#target-input').val(targetText);
        }

        var targetLat = urlParams.get('targetLatLng').split(",")[0];
        var targetLng = urlParams.get('targetLatLng').split(",")[1];
        var targetLngLat = new mapboxgl.LngLat(targetLng, targetLat);
        setDirectionsInputLngLat($('#target-input'), targetLngLat);

        // Open directions pane
        sidebar.open('pane-directions');

        getDirections(sourceLngLat, targetLngLat, via);
    }

    // Set the appropriate basemap radio button in Settings
    var base = urlParams.get('base') || 'map';
    var satelliteButton = $('input[name="basemap"][value="photo"]');
    var defaultMapButton = $('input[name="basemap"][value="map"]');
    switch (base) {
        case 'photo':
            satelliteButton.prop('checked', true).checkboxradio('refresh');
            defaultMapButton.prop('checked', false).checkboxradio('refresh');
            break;
        case 'map':
        default:
            satelliteButton.prop('checked', false).checkboxradio('refresh');
            defaultMapButton.prop('checked', true).checkboxradio('refresh');
            break;
    }

    // Map is initialized and query strings handled.
    // Fire mapReady event.
    $.event.trigger({
        type: 'mapReady',
    });
}

/**
 * Basemap picker (on Settings pane) change handler
 */
$(document).ready(function () {
    $('input[type="radio"][name="basemap"]').change(function () {
        var which = $(this).val();
        changeBasemap(which);
    });
});

/*
 * Sort-by button click handler
 *
 * Use the sortpicker buttons to modify DEFAULT_SORT, then sortLists().
 */
$(document).ready(function () {
    $('div.sortpicker span').click(function () {
        DEFAULT_SORT = $(this).attr('value');
        sortLists();
    });
});

/**
 * Make image from pagethumbnail
 * (Was _transform_main_site_image_url in PHP)
 *
 * Take an image URL path (called pagethumbnail in the database) referring to an image on the main site, like:
 * ~/getmedia/6cb586c0-e293-4ffa-b6c2-0be8904856b2/North_Chagrin_thumb_01.jpg.ashx?width=1440&height=864&ext=.jpg
 * and turn it into an absolute URL, scaled proportionately to the width provided.
 *
 * We double the requested image size, for retina displays.
 *
 * @param url_str string
 * @param new_width int: New image width, in pixels
 *
 * @return object with src, width, and height (ready to become <img>)
 */
function make_image_from_pagethumbnail(url_str, new_width) {
    var main_site_url = 'https://www.clevelandmetroparks.com/';
    url_str = url_str.replace('~/', main_site_url);

    var url = new URL(url_str);

    var orig_width = url.searchParams.get('width');
    var orig_height = url.searchParams.get('height');

    var newParams = url.searchParams;
    new_height = parseInt(orig_height / (orig_width / new_width));
    // Doubled, for retina displays
    newParams.set('width', 2 * new_width);
    newParams.set('height', 2 * new_height);

    var new_url = url.protocol +
                '//' +
                url.hostname +
                url.pathname +
                '?' +
                newParams.toString();

    return {
        src: new_url,
        width: new_width,
        height: new_height,
    };
}

/**
 * Make list of activity icon img objects
 */
function make_activity_icons_list(activity_ids) {
    var imgs_list = [];
    activity_ids.forEach(function(activity_id) {
        // Object with image details for template
        if (CM.activities[activity_id]) {
            imgs_list.push({
                src: CM.activities[activity_id].icon,
                title: CM.activities[activity_id].pagetitle,
                alt: CM.activities[activity_id].pagetitle
            });
        } else {
            console.error('Error in make_activity_icons_list(): Activity ' + activity_id + ' does not exist.');
        }
    });
    return imgs_list;
}

/**
 * Show "Attraction Info" content
 */
function showFeatureInfoContent(attractionType, id) {
    var max_img_width = 320;

    switch(attractionType) {
        case 'attraction':
            var attraction = CM.get_attraction(id);
            var template = CM.Templates.info_attraction;

            var activity_icons = [];
            if (attraction.activities) {
                activity_icons = make_activity_icons_list(attraction.activities);
            }

            var img_props = [];
            if (attraction.pagethumbnail) {
               img_props = make_image_from_pagethumbnail(attraction.pagethumbnail, max_img_width);
            }

            if (attraction.latitude && attraction.longitude) {
                var lngLat = new mapboxgl.LngLat(attraction.longitude, attraction.latitude);
                attraction.coords_formatted = formatCoords(lngLat)
            }

            if (attraction.cmp_url) {
                var urlPath = attraction.cmp_url;
                const regex = /^\//; // Trim leading slash
                attraction.main_site_url = CM_SITE_BASEURL + urlPath.replace(regex, '');
            }

            var template_vars = {
                feature: attraction,
                activity_icons: activity_icons,
                img: img_props
            };

            $('#info-content').html(template(template_vars));

            break;

        case 'reservation_new':
            var reservation = CM.get_reservation(id);
            var template = CM.Templates.info_reservation;

            if (reservation.pagethumbnail) {
               img_props = make_image_from_pagethumbnail(reservation.pagethumbnail, max_img_width);
            }

            var template_vars = {
                feature: reservation,
                img: img_props,
            };

            $('#info-content').html(template(template_vars));

            break;

        case 'loop': // "Blessed trail"
            if (id in CM.trails) {
                // Query API for trail geometry
                $.get(API_NEW_BASE_URL + 'trail_geometries/' + id, null, function (reply) {
                    if (reply.data.geom_geojson) {
                        var geom_geojson = JSON.parse(reply.data.geom_geojson);
                        drawHighlightLine(geom_geojson);
                    }
                });
                // Query API for trail elevation profile
                $.get(API_NEW_BASE_URL + 'trail_profiles/' + id, null, function (reply) {
                    if (reply.data.elevation_profile) {
                        makeElevationProfileChart(reply.data.elevation_profile, 'elevation-profile-trail');
                    }
                });
                var trail = CM.trails[id];
                var template = CM.Templates.info_trail;
                var template_vars = {
                    feature: trail,
                    img_src: 'static/images/loops/' + trail.id + '.jpg'
                };
                $('#info-content').html(template(template_vars));
            } else {
                console.error("Error: loop id: " + id + " does not exist in CM.trails (app_view_trails).");
            }

            break;
    }
}

/**
 * Make elevation profile chart.
 *
 * For both Directions and Trails.
 */
function makeElevationProfileChart(elevationProfileData, elementId) {
    if (!elevationProfileData) {
        // Storing profile data in our global object
        // so it can be fetched async after directions
        if (!CM.elevationProfileData) {
            return;
        }
        elevationProfileData = CM.elevationProfileData;
    }

    var pointData = [];
    for (var i=0, l=elevationProfileData.length; i<l; i++) {
        pointData.push({
            x: elevationProfileData[i].x / 5280, // Feet to miles
            y: elevationProfileData[i].y
        });
    }

    if (!elementId) {
        elementId = 'elevation-profile';
    }
    var chartContext = document.getElementById(elementId).getContext('2d');
    var profileChart = new Chart(chartContext, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Elevation Profile',
                data: pointData,
                pointRadius: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false,
                },
            },
            responsive: true,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Elevation (feet)',
                        color: '#000'
                    }
                },
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Distance (miles)',
                        color: '#000'
                    },
                    ticks: {
                        min: 0,
                        precision: 2
                    },
                },
            }
        }
    });
}

/**
 * zoomElementClick
 *
 * Given a .zoom element with {lon, lat, WSEN, type, gid},
 * fetch info about it and show it in a panel.
 */
function zoomElementClick(element) {
    var feature = getFeatureFromElement(element);
    showFeatureInfo(feature.type, feature);
    showOnMap(feature);
}

/**
 * Set up the directions target element so we can route to it.
 */
function setUpDirectionsTarget(feature) {
    // $('#directions_target_lat').val(feature.lat);
    // $('#directions_target_lng').val(feature.lng);
    // $('#directions_target_type').val(feature.type);
    // $('#directions_target_gid').val(feature.gid);
    // $('#directions_target_title').text(feature.title);
}

/**
 * Show Attraction Info
 *
 * Show attraction info in the sidebar pane.
 *
 * Starting to split up / improve upon zoomElementClick()
 * (Don't use a DOM element to pass info.)
 * We can generalize this for other types of POIs later.
 *
 * attraction.gid
 * attraction.title
 * attraction.lat
 * attraction.lng
 */
function showFeatureInfo(attractionType, attraction) {
    // Assign this feature to the Show On Map button, so it knows what to zoom to
    $('#show_on_map').data('zoomelement', attraction);

    // Purge any vector data from the Show On Map button;
    // the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null);

    setUpDirectionsTarget(attraction);

    // Open the Info pane
    sidebar.open('pane-info');

    // Make the Back button link to the URL if specified, else to Browse
    if (!attraction.back_url) {
        attraction.back_url = '#pane-browse';
    }
    set_pane_back_button('#pane-info', attraction.back_url);

    $('#info-content').text("Loading...");

    // Get more info via AJAX
    var id = attraction.gid || attraction.record_id;
    if (id) {
        showFeatureInfoContent(attractionType, id);
    }
}

/**
 * Given a DOM element, extract/assemble "feature" object data.
 */
function getFeatureFromElement(element) {
    var feature = {};

    feature.title = element.attr('title');

    feature.w   = element.attr('w');
    feature.s   = element.attr('s');
    feature.e   = element.attr('e');
    feature.n   = element.attr('n');

    feature.lat   = element.attr('lat');
    feature.lng   = element.attr('lng');

    feature.type  = element.attr('type');
    if (feature.type=='reservation_new' && element.attr('record_id')) {
        feature.gid  = element.attr('record_id');
    } else {
        feature.gid   = element.attr('gid');
    }

    feature.back_url = element.attr('backbutton');

    return feature;
}

/**
 * Zoom button handlers
 *
 * Click it to bring up info window, configure the Show On Map button.
 */
$(document).ready(function () {
    $('.zoom').click(function () {
        zoomElementClick($(this));
    });
});

/**
 *
 */
function getListDistances(target) {
    // if no target was specified, get the first (only) ul.distance_sortable on the currently visible page
    // if there isn't one there, bail
    if (! target) {
        target = $(".sidebar-pane.active ul.distance_sortable").eq(0);
        if (! target.length) {
            return;
        }
    }

    // okay, so we have our target UL, find all .zoom_distance tags under it,
    // and know that the grandparent of that span is a DIV element with lat and lng, cuz we follow that protocol when we lay down elements; see also zoomelement
    // calculate the distance and fill in the box with a human-friendly version
    // yes, even if we don't want to sort by distance, because this is the time when they switched to
    // this listing or received a location change event, so the best time to at least make sure the distances are accurate
    target.find('.zoom_distance').each(function () {
        var element   = $(this).parent().parent();
        var destpoint = new mapboxgl.LngLat(element.attr('lng'), element.attr('lat'));

        var meters    = distanceTo(LAST_KNOWN_LOCATION, destpoint);
        var bearing   = bearingToInNESW(LAST_KNOWN_LOCATION, destpoint);

        var miles    = meters / 1609.344;
        var feet     = meters * 3.2808399;
        var distext  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        distext += ' ' + bearing;

        $(this).text(distext);
        element.data('meters',meters);
    });
}

/**
 * Sort Lists
 *
 * a unified interface to calculate distances of items in a list, then sort that list by distance
 * look for the magic tag ul.distance_sortable and populate the .zoom_distance boxes within it, then sort the ul.distance_sortable
 *
 * @param target
 * @param sortType: 'distance' or 'alphabetical'
 */
function sortLists(target, sortType) {
    // if no target was specified, get the first (only) ul.distance_sortable on the currently visible page
    // if there isn't one there, bail
    if (! target) {
        target = $(".sidebar-pane.active ul.distance_sortable").eq(0);
        if (!target.length) {
            return;
        }
    }

    getListDistances(target);

    if (!sortType) {
        sortType = DEFAULT_SORT;
    }

    switch (sortType) {
        case 'distance':
            target.children('li').sort(function (p,q) {
                return ($(p).data('meters') > $(q).data('meters') ) ? 1 : -1;
            });
            break;
        case 'alphabetical':
            target.children('li').sort(function (p,q) {
                return ($(p).text() > $(q).text()) ? 1 : -1;
            });
            break;
    }

    // Re-set .ui-first-child and .ui-last-child on appropriate elements
    target.children('li.ui-first-child').removeClass('ui-first-child');
    target.children('li').first().addClass('ui-first-child');

    // Re-set .ui-last-child on appropriate element
    target.children('li.ui-last-child').removeClass('ui-last-child');
    target.children('li').last().addClass('ui-last-child');
}

/**
 * Geocoder event handlers
 */
$(document).ready(function () {
    var thisCallback = function () {
        var address = $('#geocode_text').val();
        zoomToAddress(address);
    };
    $('#geocode_button').click(thisCallback);

    $('#geocode_text').keydown(function (key) {
        if(key.keyCode == 13) $('#geocode_button').click();
    });
});

/**
 * Show WKT data
 *
 * @param wkt_data
 */
function showWkt(wkt_data) {
    var wkt = new Wkt.Wkt(wkt_data);
    drawHighlightLine(wkt.toJson());
}

/**
 * Draw highlight line
 *
 * @param linestring {geojson}
 */
function drawHighlightLine(linestring) {
    clearHighlightLine();

    MAP.addLayer({
        'id': 'highlightLine',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': linestring,
        },
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#01B3FD',
            'line-width': 6,
            'line-opacity': 0.75
            // smoothFactor: 0.25
        }
    });
}

/**
 * Clear highlight line
 */
function clearHighlightLine() {
    if (MAP.getLayer('highlightLine')) {
        MAP.removeLayer('highlightLine');
    }
    if (MAP.getSource('highlightLine')) {
        MAP.removeSource('highlightLine');
    }
}

/**
 * [Geocode and] Zoom to Address
 */
function zoomToAddress(addressSearchText) {
    if (!addressSearchText) return false;

    $.get(API_NEW_BASE_URL + 'geocode/' + addressSearchText, null, function (reply) {
        if (!reply.data) {
            return alert("We couldn't find that address or city.\nPlease try again.");
        }

        var lngLat = new mapboxgl.LngLat(reply.data.lng, reply.data.lat);

        // if this point isn't even in the service area, complain and bail
        // tip: "post office" finds Post Office, India
        if (!MAX_BOUNDS.contains(lngLat)) {
            return alert("The only results we could find are too far away to zoom the map there.");
        }

        // Zoom to the point location, and add a marker.
        switchToMap();

        placeMarker(MARKER_TARGET, reply.data.lat, reply.data.lng);
        MAP.flyTo({center: lngLat, zoom: DEFAULT_POI_ZOOM});
        // Place a popup at the location with geocoded interpretation of the address
        // and a pseudo-link (with data-holding attributes) that triggers zoomElementClick().
        var markup = '<h3 class="popup_title">'+reply.data.title+'</h3>';
        markup += '<span class="fakelink zoom" title="'+reply.data.title+'" lat="'+reply.data.lat+'" lng="'+reply.data.lng+'" w="'+reply.data.w+'" s="'+reply.data.s+'" e="'+reply.data.e+'" n="'+reply.data.n+'" onClick="zoomElementClick($(this));">Directions</span>';

        var popup = new mapboxgl.Popup()
            .setLngLat(lngLat)
            .setHTML(markup)
            .addTo(MAP);
    }, 'json');
};

/**
 * "Show on Map" button handler
 *
 * When the "Show on Map" button is clicked (in a details pane),
 * gather its associated data from the DOM element, and call showOnMap().
 */
$(document).ready(function () {
    $('#show_on_map').click(function() {
        var feature = $(this).data('zoomelement');
        if (feature) {
            feature.wkt = $(this).data('wkt');
            showOnMap(feature, true);
        }
    });
});

/**
 * Show on map
 *
 * Push feature info params to window history, and zoom/flyto.
 */
function showOnMap(feature, closeSidebarInMobile) {
    // Push this state change onto window URL history stack
    if (feature.type && feature.gid && feature.gid != 0) {
        var params = {
            type: feature.type,
            gid: feature.gid
        };
        setWindowURLQueryStringParameters(params, false, true);
    }

    zoomToFeature(feature, closeSidebarInMobile);
};

/**
 * Zoom/fly to a feature on the map
 *
 * @param {Object} feature:
 *     w,s,e,n (optional)
 *     lat,lng (optional)
 *     type (optional)
 *     wkt (optional)
 */
function zoomToFeature(feature, closeSidebarInMobile) {
    // Clear existing points & lines
    clearMarker(MARKER_TARGET);
    clearHighlightLine();

    // Switch to the map if necessary (close sidebar in mobile)
    if (closeSidebarInMobile) {
        switchToMap();
    }

    // Zoom the map into the stated bbox, if we have one.
    if ((feature.w && feature.s && feature.e && feature.n) &&
        (feature.w != 0 && feature.s != 0 && feature.e != 0 && feature.n != 0)  ) {
        var sw = new mapboxgl.LngLat(feature.w, feature.s);
        var ne = new mapboxgl.LngLat(feature.e, feature.n);
        var bounds = new mapboxgl.LngLatBounds(sw, ne);
        MAP.fitBounds(bounds, {padding: 10});
    } else {
        if (feature.lng && feature.lat) {
            // Or, zoom to a lat/lng
            MAP.flyTo({center: [feature.lng, feature.lat], zoom: DEFAULT_POI_ZOOM});
        }
    }

    // Drop a marker if this is a point feature
    if (feature.type == 'poi' || feature.type == 'attraction' || feature.type == 'loop') {
        placeMarker(MARKER_TARGET, feature.lat, feature.lng);
    }

    // Draw the line geometry if this is a line feature.
    if (feature.wkt) {
        showWkt(feature.wkt);
    }
}

/**
 * Trigger window URL changes on map movements.
 */
function setupWindowURLUpdates() {
    MAP.on('zoomend', updateWindowURLZoom);
    MAP.on('moveend', updateWindowURLCenter);
    MAP.on('layerremove', updateWindowURLLayer);
    MAP.on('layeradd', updateWindowURLLayer);
}
$(document).on("mapReady", setupWindowURLUpdates);

/**
 * Update the window URL with center lat/lng params.
 */
function updateWindowURLCenter() {
    var center = MAP.getCenter();
    var lat = center.lat.toFixed(7);
    var lng = center.lng.toFixed(7);
    invalidateWindowURL();
    params = {
        lat: lat,
        lng: lng
    }
    setWindowURLQueryStringParameters(params, false, false);
}

/**
 * Update the window URL with zoom param.
 */
function updateWindowURLZoom() {
    var zoom = MAP.getZoom().toFixed(1);
    invalidateWindowURL();
    setWindowURLQueryStringParameters({zoom: zoom}, false);
}

/**
 * Update the window URL with baselayer param.
 */
function updateWindowURLLayer() {
    // Default is vector/map layer
    var layer = 'map';
    // Else, satellite ("photo")
    if (getBasemap() == 'photo') {
        layer = 'photo';
    }
    invalidateWindowURL();
    setWindowURLQueryStringParameters({base: layer}, false);
}

/**
 * Invalidate Map URL
 */
function invalidateWindowURL() {
    hideShareURL();
}

/**
 * Coordinate Format picker (on Settings pane) change handler
 */
$(document).ready(function () {
    $('input[type="radio"][name="coordinate_format"]').change(function () {
        var which = $(this).val();
        changeCoordinateFormat(which);
        updateUserCoordsDisplay();
    });
});

/**
 * Get session-based coordinate format on pageload (and set user geolocation display).
 */
$(document).ready(function () {
    getSessionCoordinateFormat();
});

/**
 * Change the GPS coordinate format used in the interface, and store in localStorage.
 *
 * @param format: 'dms', 'ddm', or 'dd'.
 */
function changeCoordinateFormat(format) {
    SETTINGS.coordinate_format = format;
    localStorage.setItem('coordinateFormat', format);
}

/**
 * Get user's coordinate format setting from localStorage, and update UI.
 */
function getSessionCoordinateFormat() {
    var format = localStorage.getItem('coordinateFormat');
    if (format == 'dms' || format == 'ddm' || format == 'dd') {
        SETTINGS.coordinate_format = format;

        // Unset all radio buttons
        $('#coordinate_format input[name=coordinate_format]')
            .prop('checked', false)
            .checkboxradio('refresh');

        // Set the chosen radio button
        $('#coordinate_format input[name=coordinate_format][value=' + format + ']')
            .prop('checked', true)
            .checkboxradio('refresh');

        updateUserCoordsDisplay();
    }
}

/**
 * Show Mapbox features info in debug pane.
 */
$(document).on("mapReady", function() {
    MAP.on('mousemove', function (e) {
        var features = MAP.queryRenderedFeatures(e.point);
        document.getElementById('debug-features').innerHTML = JSON.stringify(features, null, 2);
    });
});

;
/**
 * sidebar.js
 *
 * JS for app sidebar functionality.
 *
 * Cleveland Metroparks
 */


/**
 * Populate the sidebar panes with data.
 */
function populateSidebarPanes() {
    // Activities pane
    $(document).on("dataReadyActivities", function() {
        populatePaneActivities();
    });

    // Amenities pane
    // @TODO: We don't have data or API endpoint here yet?
    $(document).on("dataReadyAmenities", function() {
        populatePaneAmenities();
    });

    // Reservations in Trails pane
    $(document).on("dataReadyReservations", function() {
        populatePaneTrails();
    });
}

/**
 * Populate the Activities sidebar pane.
 */
function populatePaneActivities() {
    var template = CM.Templates.pane_activities_item;

    CM.activities.forEach(function(activity) {
        if (activity.icon) {
            var link_param_category = 'pois_usetype_' + encodeURIComponent(activity.pagetitle);
            activity.link_url = "#browse-results?id="
                                + activity.eventactivitytypeid
                                + "&category="
                                + link_param_category;
            var template_vars = {
                activity: activity
            };
            $('#activities-list').append(template(template_vars));
        }
    });

    $('#activities-list').listview('refresh');
    sortLists($('#activities-list'), 'alphabetical');

    /**
     * Set click event
     */
    $('#activities-list li a').click(function() {
        // Get Activity ID from query string params
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /id=(\d*)/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            activity_id = matches[1];
        }

        sidebar.open('pane-browse-results');

        pane_title = $(this).text().trim();
        set_pane_back_button('#pane-browse-results', '#pane-activities');

        // Render to UL.zoom in the #pane-browse-results pane, and display it
        var filtered_attractions = CM.get_attractions_by_activity(activity_id);
        CM.display_attractions_results(pane_title, filtered_attractions, 'attraction');
    });
}

/**
 * Populate the Activities sidebar pane.
 */
function populatePaneAmenities() {
    var template = CM.Templates.pane_amenities_item;
    CM.amenities.forEach(function(amenity) {
        amenity.link_url = '#browse-results?amenity_id=' + amenity.amenitytypeid;
        var template_vars = {
            amenity: amenity,
        };
        $('#amenities-list').append(template(template_vars));
    });

    $('#amenities-list').listview('refresh');
    sortLists($('#amenities-list'), 'alphabetical');

    /**
     * Set click event
     */
    $('#amenities-list li a').click(function() {
        // Get Amenity ID from query string param
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /amenity_id=(\d*)/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            amenity_id = matches[1];
        }

        pane_title = $(this).text().trim();
        set_pane_back_button('#pane-browse-results', '#pane-amenities');

        // Render to UL.zoom in the #pane-browse-results pane, and display it
        var filtered_attractions = CM.get_attractions_by_amenity(amenity_id);
        CM.display_attractions_results(pane_title, filtered_attractions, 'attraction');
    });
}

/**
 * Populate the Trails sidebar pane's reservations dropdown.
 */
function populatePaneTrails() {
    var template = CM.Templates.pane_trails_reservation_filter_option;
    CM.reservations.forEach(function(reservation) {
        var template_vars = {
            reservation: reservation,
        };
        $('#loops_filter_reservation').append(template(template_vars));
    });
}

/**
 * Handle clicks on various sidebar elements
 */
$(document).ready(function () {

    // To make links that open new sidebar panes,
    // give them the class ".sidebar-pane-link"
    // and make the href an anchor with the pane name, (#panename)
    $('.sidebar-pane-link').click(function() {
        link = $(this).attr('href');
        if (link.charAt(0) == '#') {
            pane = link.substr(1);
        }
        sidebar.open(pane);
    });

    /**
     * Find pane (#pane-browse)
     */
    $('#pane-browse li a[href="#pane-activities"]').click(function() {
        set_pane_back_button('#pane-activities', '#pane-browse');
    });
    $('#pane-browse li a[href="#pane-trails"]').click(function() {
        set_pane_back_button('#pane-trails', '#pane-browse');
        // Perform trails search upon opening the pane.
        doTrailSearch();
    });

    /**
     * Nearby pane (#pane-nearby)
     */
    $('.sidebar-tabs li a[href="#pane-nearby"]').click(function() {
        updateNearYouNow();
    });

    /**
     * Welcome pane (#pane-welcome)
     */

    // Visitor Centers button clicked
    $('#pane-welcome .welcome-pane-visitorcenters a').click(function() {
        pane_title = 'Visitor Centers';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Display visitor centers from pre-loaded data.
        CM.display_attractions_results(pane_title, CM.visitor_centers, 'attraction');
    });

    // Parks button clicked
    $('#pane-welcome .welcome-pane-parks a').click(function() {
        pane_title = 'Parks';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Display visitor centers from pre-loaded data.
        CM.display_attractions_results(pane_title, CM.reservations, 'reservation_new');
    });

    // Activities button clicked
    $('#pane-welcome .welcome-pane-activities a').click(function() {
        set_pane_back_button('#pane-activities', '#pane-welcome');
    });

    // Trails button clicked
    $('#pane-welcome .welcome-pane-trails a').click(function() {
        set_pane_back_button('#pane-trails', '#pane-welcome');
        // Perform trails search upon opening the pane.
        doTrailSearch();
    });

    /**
     * Share pane (#pane-share)
     */

    //// Build a new short URL for the current map state.
    //$('.sidebar-tabs a[href="#pane-share"]').click(function() {
    //    populateShareBox();
    //    setShareURLBoxWidth();
    //});

    // Use current URL for Twitter and Facebook share links
    // @TODO: Update on map change when share bar is open
    $('#share_facebook').click(function () {
        var url = $('#share_url').val();
            url = 'http://www.facebook.com/share.php?u=' + encodeURIComponent(url);
        $('#share_facebook').prop('href', url);
        return true;
    });
    $('#share_twitter').click(function () {
        var url = $('#share_url').val();
            url = 'http://twitter.com/home?status=' + encodeURIComponent(url);
        $('#share_twitter').prop('href', url);
        return true;
    });
});

/**
 * Display Attractions results from API call.
 *
 * @param pane_title
 * @param data
 * @param attraction_type
 */
CM.display_attractions_results = function(pane_title, data, attraction_type) {
    // Pane header title
    var header = $('#pane-browse-results h1.sidebar-header .title-text');
    header.text(pane_title);

    sidebar.open('pane-browse-results');

    var target = $('ul#browse_results');
    target.empty();

    // Iterate over fetched results and render them into the target
    for (var i=0, l=data.length; i<l; i++) {
        var result = data[i];

        // List item
        // A lot of attributes to set pertaining to .zoom handling
        var li = $('<li></li>')
            .addClass('zoom')
            .attr('title', result.pagetitle)
            .attr('gid', result.gis_id)
            .attr('record_id', result.record_id)
            .attr('type', attraction_type)
            .attr('w', result.boxw)
            .attr('s', result.boxs)
            .attr('e', result.boxe)
            .attr('n', result.boxn)
            .attr('lat', result.latitude)
            .attr('lng', result.longitude)
            .attr('backbutton', "#pane-browse-results");

        // Link (fake, currently)
        link = $('<a></a>');
        link.attr('class', 'ui-btn ui-btn-text');
        li.append(link);

        // On click: center the map and load More Info
        li.click(function () {
            zoomElementClick($(this));
        });

        // Title
        link.append(
            $('<span></span>')
                .addClass('ui-li-heading')
                .text(result.pagetitle)
            );

        // @TODO:API: Still necessary?
        //// Inner text
        //if (result.note) {
        //    link.append(
        //        $('<span></span>')
        //            .addClass('ui-li-desc')
        //            .html(result.note)
        //        );
        //}

        // Distance placeholder, to be populated later
        link.append(
            $('<span></span>')
                .addClass('zoom_distance')
                .addClass('ui-li-count')
                .addClass('ui-btn-up-c')
                .addClass('ui-btn-corner-all')
                .text('0 mi')
            );

        // Add to the list
        li.append(link);
        target.append(li);
    }

    // Finalize the list,
    // have jQuery Mobile do its styling magic on the newly-loaded content,
    // then calculate the distances and sort.
    target.listview('refresh');
    sortLists(target);
}

///**
// * Resize the Share URL box if the size of the sidebar has potentially changed.
// */
//$(window).bind('orientationchange pageshow resize', function() {
//    if ($('#pane-share').hasClass('active')) {
//        setShareURLBoxWidth();
//    }
//});

/**
 * Would the sidebar [when expanded] obscure the whole map?
 */
function sidebarCoversMap() {
    window_width = $(window).width();

    // Can't rely on this because we want to know what it /would/ be when expanded
    // sidebar_width = $(sidebar._sidebar).width();

    return window_width <= 768;
}

/**
 * Set the back button URL on a pane
 */
set_pane_back_button = function(pane_id, back_url) {
    $('.sidebar-back', $(pane_id)).prop('href', back_url);
}

/**
 * @TODO: Bind this to sidebar tab button clicks AND
 * clicks inside sidebar panes that generate/load new data
 *
 * mobile-specific: on any page change, after the changeover,
 * update the distance readouts in any ul.dstance_sortable which was just now made visible
 */
$(document).bind('pagechange', function(e,data) {
    //sortLists();
});

/**
 * Use FastClick lib to get a more responsive touch-click on mobile.
 *
 * click() incurs a ~300ms delay on many mobile browsers.
 * touchstart() only works on mobile, and there are hazards of combining the two
 *
 * And we want to get rid of ghost clicks on longer taps, when an element is
 * touchstart()ed but then the click() event fires for an element beneath it.
 *
 * (And we're phasing out tap() as we get rid of jQm.)
 */
$(document).ready(function(){
    $(function() {
        FastClick.FastClick.attach(
            // Only attach it to the sidebar so we don't mess with the map.
            document.getElementById('sidebar')
        );
    });
});

;
 /**
 * geolocate.js
 *
 * JS for geolocation functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */


/**
 * Attempt to locate the user using the browser's native geolocation.
 *
 * We don't use ctrlGeolocate here because it is set up to follow, whereas
 * we just want a single check here.
 */
function basicGeolocate() {
    navigator.geolocation.getCurrentPosition(geolocateSuccess, null, { enableHighAccuracy: true });
}

/**
 * Callback for geolocation success, whether via basicGeolocate() or ctrlGeolocate.
 */
function geolocateSuccess(event) {
    // Update the user's last known location
    LAST_KNOWN_LOCATION.lng = event.coords.longitude;
    LAST_KNOWN_LOCATION.lat = event.coords.latitude;
}

/**
 * Update display of user's lat/lng in Settings pane.
 */
function updateUserCoordsDisplay() {
    var coordsStr = LAST_KNOWN_LOCATION ? formatCoords(LAST_KNOWN_LOCATION) : 'unknown';
    $('#gps_location').val(coordsStr);
}

/**
 * Handle geolocation update
 *
 * Update our last-known location, then do more calculations regarding it.
 */
$(document).on("mapInitialized", function () {
    ctrlGeolocate.on("geolocate", function(event) {
        // Update the user's last known location
        geolocateSuccess(event);

        // Sort any visible distance-sorted lists
        // @TODO: Let's identify all such lists and see if there's a cleaner way.
        //sortLists();

        // Adjust the Near You Now listing
        // @TODO: Why do we do this again when opening the panel?
        // @TODO: Also, should this be mobile only?
        updateNearYouNow();

        // Check the Nearby alerts to see if anything relevant is within range
        if ( $('#nearby_enabled').is(':checked') ) {
            var meters = $('#nearby-radius').val();
            var categories = [];
            $('input[name="nearby-category"]:checked').each(
                function () {
                    categories[categories.length] = $(this).val()
                }
            );
            var current_location = mapboxgl.LngLat.convert([event.coords.longitude, event.coords.latitude]);
            placeCircle(current_location, meters);
            checkNearby(current_location, meters, categories);
        }

        // Update display of user lat/lng
        updateUserCoordsDisplay();
    });

    // @TODO: Catch disabling of geolocation control
    //   (which Mapbox GL JS currently doesn't provide a handler for...
    //    see https://github.com/mapbox/mapbox-gl-js/issues/5136 --
    //    there's also a workaround there)
    // and then clearCirle() when we see it.

    basicGeolocate();
});
;
 /**
 * directions.js
 *
 * JS for directions functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Get directions
 *
 * Part of the Get Directions system:
 * Given source (lat,lng) and target (lat,lng) and other route options,
 * request directions from the API
 * and render them to the screen and to the map.
 *
 * @param sourceLat {float}
 * @param sourceLng {float}
 * @param targetLat {float}
 * @param targetLng {float}
 * @param via {string}
 * @param isFromGeolocation {boolean}
 */
function getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation) {
    disableDirectionsButton();

    var data = {
        sourcelat = parseFloat(sourceLngLat.lat),
        sourcelng = parseFloat(sourceLngLat.lng),
        targetlat = parseFloat(targetLngLat.lat),
        targetlng = parseFloat(targetLngLat.lng)
    }

    switch (via) {
        // Driving directions from Bing, by way of our API
        case 'car':
                $.get(API_NEW_BASE_URL + 'directions_driving', data, function (reply) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                },'json')
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Error getting driving directions.", 'error');
                    console.error(textStatus + ': ' + errorThrown);
                })
                .always(function() {
                    enableDirectionsButton();
                });

            break;

        // Transit directions from Bing, by way of our API
        case 'bus':
                $.get(API_NEW_BASE_URL + 'directions_transit', data, function (reply) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                },'json')
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Error getting transit directions.", 'error');
                    console.error(textStatus + ': ' + errorThrown);
                })
                .always(function() {
                    enableDirectionsButton();
                });

            break;

        // Directions over trails from our API
        default:
            data.via = via;

            $.get(API_NEW_BASE_URL + 'directions_trails', data, function (reply) {
                if (reply.data && reply.data.wkt) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                } else {
                    var message = "Could not find directions over trails for this start and endpoint.";
                    if (via != 'hike') {
                        message += "\nTry a different type of trail, terrain, or difficulty.";
                    }
                    showInfoPopup(message, 'error');
                }
            },'json')
            .fail(function(jqXHR, textStatus, errorThrown) {
                showInfoPopup("Error getting directions.", 'error');
                console.error(textStatus + ': ' + errorThrown);
            })
            .always(function() {
                enableDirectionsButton();
            });

            break;
    }
}

/**
 * Disable directions button
 */
function disableDirectionsButton() {
    $('#get-directions').prop('disabled', true);
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    $('#get-directions').prop('disabled', false);
}

/**
 * Set the lng and lat inside a directions input element,
 * then place marker and do zoom.
 *
 * Can optionally set the trail-specific location and the
 * driving destination/location so that they can be switched
 * when choosing "via" transport method.
 *
 * @param $input
 * @param lngLat
 * @param trailLngLat (optional)
 * @param drivingLngLat (optional)
 */
function setDirectionsInputLngLat($input, lngLat, trailLngLat, drivingLngLat) {
    $input.data('lat', lngLat.lat);
    $input.data('lng', lngLat.lng);

    if (trailLngLat) {
        $input.data('trail-lat', trailLngLat.lat);
        $input.data('trail-lng', trailLngLat.lng);
    } else {
        $input.removeData('trail-lat');
        $input.removeData('trail-lng');
    }

    if (drivingLngLat) {
        $input.data('driving-lat', drivingLngLat.lat);
        $input.data('driving-lng', drivingLngLat.lng);
    } else {
        $input.removeData('driving-lat');
        $input.removeData('driving-lng');
    }

    var marker;
    if (getSourceTargetInputId($input) == 'target') {
        marker = MARKER_END;
    } else {
        marker = MARKER_START;
    }
    placeMarker(marker, lngLat.lat, lngLat.lng);
    zoomToDirectionsBounds();
}

/**
 * Set the location of the source/target input to either the driving destination
 * or the trail destination (of the given feature);
 * whichever's appropriate based on transport method (via).
 *
 * These specific destinations must already be set in the input;
 * this is just a switcher.
 */
function setAppropriateDestination($input) {
    if (useDrivingDestination()) {
        if ($input.data('driving-lat') && $input.data('driving-lat')) {
            $input.data('lat', $input.data('driving-lat'));
            $input.data('lng', $input.data('driving-lng'));
        }
    } else {
        if ($input.data('trail-lat') && $input.data('trail-lat')) {
            $input.data('lat', $input.data('trail-lat'));
            $input.data('lng', $input.data('trail-lng'));
        }
    }
}

/**
 * Should we use the driving destination for the location?
 *
 * @return boolean
 *   Check via setting:
 *     If hiking, FALSE: (normal trail lat/lng)
 *     If driving, bicycling, or transit: TRUE (use driving destination lat/lng)
 */
function useDrivingDestination() {
    return $('#directions-via').attr('data-value') != 'hike';
}

/**
 * Get directions input lng and lat
 */
function getDirectionsInputLngLat($input) {
    var lat = $input.data('lat');
    var lng = $input.data('lng');

    if (lat && lng) {
        return new mapboxgl.LngLat(lng, lat);
    }
}

/**
 * Clear data saved in directions input.
 *
 * When the user starts entering something new,
 * remove old data saved in the input.
 */
function clearDirectionsInputData($input, lngLat) {
    $input.removeData('lat');
    $input.removeData('lng');
    $input.removeData('isFromGeolocation');
}

/**
 * Geolocate user for directions input
 */
function geolocateUserForDirectionsInput($input) {
    basicGeolocate();
    isFromGeolocation = true;
    var userLocation = LAST_KNOWN_LOCATION;
    $input.val(userLocation.lat + ', ' + userLocation.lng);
    setDirectionsInputLngLat($input, userLocation);
}

/**
 *
 */
function zoomToDirectionsBounds() {
    var bounds = new mapboxgl.LngLatBounds();

    var sourceCoords = getDirectionsInputLngLat($('#source-input'));
    if (sourceCoords) {
        bounds.extend(sourceCoords);
    }

    var targetCoords = getDirectionsInputLngLat($('#target-input'));
    if (targetCoords) {
        bounds.extend(targetCoords);
    }

    if (sourceCoords || targetCoords) {
        MAP.fitBounds(bounds, {padding: 100});
    }
}

/**
 * Geocode directions form input
 *
 * @return: (promise)
 */
function geocodeDirectionsInput($input) {
    var inputText = ($input).val();

    var geocodeResponse = $.ajax({
        url: API_NEW_BASE_URL + 'geocode/' + inputText,
        dataType: 'json',
        success: function (reply) {
            if (reply && reply.data.lng && reply.data.lat) {
                var lngLat = new mapboxgl.LngLat(reply.data.lng, reply.data.lat);
                setDirectionsInputLngLat($input, lngLat)
            } else {
                // Geocode failed
                console.error('geocodeDirectionsInput(): failure');

                var message;
                var sourceOrTarget = getSourceTargetInputId($input);
                if (sourceOrTarget == 'source') {
                    message = "Can't find the source (\"From:\") address.\nPlease try again.";
                } else {
                    message = "Can't find the target (\"To:\") address.\nPlease try again.";
                }

                showInfoPopup(message, 'error');
            }
        }
    });

    return geocodeResponse;
}

/**
 * Show notes about directions, such as Bing provenance.
 *
 * @example: setRoutingNotes('Directions from Bing');
 */
function setRoutingNotes(notes) {
    $('#directions-notes').text(notes);
}

/**
 * Check directions input
 */
function checkDirectionsInput($input) {
    var inputText = $input.val();

    if (inputText.length == 0) {
        return false;
    }

    // If lat & lng are set - stored in input.
    if ($input.data('lat') && $input.data('lng')) {
        return true;
    }

    // If text looks like lat & lng (ex: "41.30230166, -81.80350554")
    // Parse with regex:
    var latLngStr = /(^[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?))\s*,\s*([-+]?(?:180(?:\.0+)?|(?:(?:1[0-7]\d)|(?:[1-9]?\d))(?:\.\d+)?))$/.exec(inputText);
    if (latLngStr) {
        var lngLat = new mapboxgl.LngLat(latLngStr[2], latLngStr[1]);
        setDirectionsInputLngLat($input, lngLat);
        return true;
    }

    // Check for exact text match from search DB (but not autocompleted)
    var fuseResults = fuse.search(inputText);
    if (fuseResults.length) {
        // If it's exact it should already be the first choice in the list
        // ... but we could potentially go through all results
        var firstResult = fuseResults[0].item;
        var firstResultTitle = firstResult.title;
        if (simplifyTextForMatch(firstResultTitle) == simplifyTextForMatch(inputText)) {
            setInputToKnownFeature(
                $input,
                firstResult.title,
                firstResult.lng,
                firstResult.lat,
                firstResult.drivingLng,
                firstResult.drivingLat
            );
            return true;
        }
    }

    // Otherwise, make a geocode API call with the text data
    // and return the promise
    var geocodeResponse = geocodeDirectionsInput($input)
        .fail(function() {
            console.error('geocode failure');
        });

    return geocodeResponse;
}

/**
 * Process "Get Directions" action.
 *
 * checkDirectionsInput() returns a promise
 */
async function processGetDirectionsForm() {
    clearDirectionsLine();
    clearDirectionsSteps();

    var sourceIsRoutable = checkDirectionsInput($('#source-input'));
    var targetIsRoutable = checkDirectionsInput($('#target-input'));

    $.when(sourceIsRoutable, targetIsRoutable).done(function() {
        processDirectionsInputsWithLatLngs();
    });
}

/**
 * Process directions inputs that have the lats & lngs set.
 * Run "get directions" on the given data.
 */
function processDirectionsInputsWithLatLngs() {
    var sourceLat = parseFloat($('#source-input').data('lat'));
    var sourceLng = parseFloat($('#source-input').data('lng'));
    var sourceLngLat = new mapboxgl.LngLat(sourceLng, sourceLat);

    var targetLat = parseFloat($('#target-input').data('lat'));
    var targetLng = parseFloat($('#target-input').data('lng'));
    var targetLngLat = new mapboxgl.LngLat(targetLng, targetLat);

    var isFromGeolocation = $('#target-input').data('isFromGeolocation') ? true : false;

    var via = $('#directions-via').attr('data-value');

    getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation);
}

/**
 * Simplify text string for matching.
 *
 * Remove whitespace and convert to lowercase.
 */
function simplifyTextForMatch(str) {
    return str.replace(/\W/g, '').toLowerCase();
}

/**
 * Render directions structure
 */
function renderDirectionsStructure(directions) {
    // Draw the route on the map
    var startPoint = new mapboxgl.LngLat(directions.start.lng, directions.start.lat);
    var endPoint = new mapboxgl.LngLat(directions.end.lng, directions.end.lat);
    var wkt = new Wkt.Wkt(directions.wkt);
    var polyline = wkt.toJson();
    drawDirectionsLine(polyline, startPoint, endPoint);

    var sw = new mapboxgl.LngLat(directions.bounds.west, directions.bounds.south);
    var ne = new mapboxgl.LngLat(directions.bounds.east, directions.bounds.north);
    var bounds = new mapboxgl.LngLatBounds(sw, ne);
    MAP.fitBounds(bounds, {padding: 10});

    // phase 2: put the directions into the panel
    var target = $('#directions-steps');
    target.empty();

    for (var i=0, l=directions.steps.length; i<l; i++) {
        var step     = directions.steps[i];
        var li       = $('<li></li>');
        var title    = (i+1) + '. ' + (step.step_action ? step.step_action : '') + ' ' + step.text;
        li.append( $('<span></span>').addClass('ui-li-heading').text(title) );
        if (step.distance && step.duration) {
            var subtitle = step.distance + ', ' + step.duration;
            li.append( $('<span></span>').addClass('ui-li-desc').text(subtitle) );
        }
        target.append(li);
    }

    // phase 2b: the final part of the direction steps: a total, link to elevation profile, note about the route quality
    var note = $('<span></span>').addClass('ui-li-desc').html('');
    if (directions.retries && directions.retries > 3) {
        note.html("Route may be approximated.");
    }
    var total = $('<span></span>').addClass('ui-li-heading').html('<b>Total:</b> ' + directions.totals.distance + ', ' + directions.totals.duration);
    target.append( $('<li></li>').append(total).append(note) );

    // Add buttons to the bottom of the steps
    var directionsFunctions = $('<div></div>').addClass('directions-functions');

    // Elevation Profile button
    if (directions.elevationprofile) {
        var elevationProfileBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .prop('id','elevationprofile_button')
            .text('Elevation Profile');
        elevationProfileBtn
            .attr('value1', 'Elevation Profile')
            .attr('value0', 'Loading');
        elevationProfileBtn
            .click(function () {
                makeElevationProfileChart();
                sidebar.open('pane-elevationprofile');
            });

        directionsFunctions.append(elevationProfileBtn);
    }

    // Clear (Directions) button
    var clearDirectionsBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .text('Clear');
    clearDirectionsBtn.click(function () {
        clearDirectionsLine();
        clearDirectionsMarkers();
        clearDirectionsSteps();
    });
    directionsFunctions.append(clearDirectionsBtn);

    // Share button
    var shareRouteBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .prop('id','share_route_button')
        .text('Share');
    shareRouteBtn.click(function () {
        makeAndShowShortURL();
        sidebar.open('pane-share');
    });
    directionsFunctions.append(shareRouteBtn);

    // Print button
    var printMeBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .text('Print');
    printMeBtn.click(function () {
        $('#button_print').click();
    });
    directionsFunctions.append(printMeBtn);
    target.after(directionsFunctions);

    // phase 3: save the elevation profile given, if any, so it can be recalled later
    CM.elevationProfileData = [];
    if (directions.elevationprofile) {
        CM.elevationProfileData = directions.elevationprofile;
    }

    // phase 4: any additional postprocessing
    // give the list that jQuery Mobile magic
    target.listview('refresh');
}

/**
 * Update window URL with directions
 */
function updateWindowURLWithDirections() {
    var params = {};

    params.base = (getBasemap() == 'photo') ? 'photo' : 'map';

    params.action = 'directions';

    var via = $('#directions-via').attr('data-value');
    params.via = via ? via : 'hike';

    params.sourceText = $('#source-input').val();
    var sourceLat = parseFloat($('#source-input').data('lat'));
    var sourceLng = parseFloat($('#source-input').data('lng'));
    if (sourceLat && sourceLng) {
        params.sourceLatLng = sourceLat + ',' + sourceLng;
    }

    params.targetText = $('#target-input').val();
    var targetLat = parseFloat($('#target-input').data('lat'));
    var targetLng = parseFloat($('#target-input').data('lng'));
    if (targetLat && targetLng) {
        params.targetLatLng = targetLat + ',' + targetLng;
    }

    setWindowURLQueryStringParameters(params, true, true);
}

/**
 * Draw directions line
 *
 * @param polyline {geojson}
 */
function drawDirectionsLine(polyline, from, to) {
    clearDirectionsLine();
    clearDirectionsMarkers();

    placeMarker(MARKER_START, from.lat, from.lng);
    placeMarker(MARKER_END, to.lat, to.lng);

    MAP.addLayer({
        'id': 'directionsLine',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': polyline,
        },
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#0000FF',
            'line-width': 6,
            'line-opacity': 0.50
        }
    });
}

/**
 * Clear directions line
 */
function clearDirectionsLine() {
    if (MAP.getLayer('directionsLine')) {
        MAP.removeLayer('directionsLine');
    }
    if (MAP.getSource('directionsLine')) {
        MAP.removeSource('directionsLine');
    }
}

/**
 * Clear directions line
 */
function clearDirectionsMarkers() {
    clearMarker(MARKER_START);
    clearMarker(MARKER_END);
}

/**
 * Clear directions steps & functions
 */
function clearDirectionsSteps() {
    $('#directions-steps').empty();
    $('.directions-functions').remove();
}

/**
 * Launch "Get Directions" from the info pane
 */
function launchGetDirections(via) {
    // Set "via" to the correct transport mode
    $("#directions-via a[data-value='" + via + "']").click();

    // @TODO: Put the destination in the directions target box.
    // $("#pane-info")

    sidebar.open('pane-directions');
}

/**
 * Return whether the given input element is our directions "source" or "target".
 *
 * @return: "source", "target", or null
 */
function getSourceTargetInputId($input) {
    if ($input.attr('data-value-sourcetarget')) {
        return $input.attr('data-value-sourcetarget');
    }
}

/**
 * Set an input's data to a feature.
 * We do this when autocompleting from search results.
 */
function setInputToKnownFeature($input, title, lng, lat, drivingLng, drivingLat) {
    $input.val(title);

    var trailLngLat = new mapboxgl.LngLat(lng, lat);

    var drivingLngLat;
    if (drivingLng && drivingLat) {
        drivingLngLat = new mapboxgl.LngLat(drivingLng, drivingLat);
    }

    // Choose the appropriate destination (driving or trail).
    var lngLat = (useDrivingDestination() && drivingLngLat) ? drivingLngLat : trailLngLat;

    // Set those locations inside the element, place marker and zoom.
    setDirectionsInputLngLat($input, lngLat, trailLngLat, drivingLngLat);
}

/**
 * Misc handlers
 */
$(document).ready(function () {

    // For launching "Get Directions" from other (feature) panes,
    // by clicking a transport mode button:
    $('#directions_hike').click(function () {
        launchGetDirections('hike');
    });
    $('#directions_bike').click(function () {
        launchGetDirections('bike');
    });
    $('#directions_car').click(function () {
        launchGetDirections('car');
    });
    $('#directions_bus').click(function () {
        launchGetDirections('bus');
    });


    // Source geolocation click
    $('#source-geolocate-btn').click(function () {
        geolocateUserForDirectionsInput($('#source-input'));
    });

    // Get Directions click
    $('#get-directions').click(function () {
        processGetDirectionsForm();
    });

    /**
     * Directions "Via" button clicks
     */
    $('.via-buttons a').click(function () {
        $(this).parent().attr('data-value', $(this).attr('data-value'));
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');

        // Switch to driving/trails destinations if appropriate
        setAppropriateDestination($('#source-input'));
        setAppropriateDestination($('#target-input'));

        processGetDirectionsForm();
    });

    /**
     * Autocomplete for to/from inputs
     */
    $(".feature-search-autocomplete").on("filterablebeforefilter", function(e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            listItems = "";

        $ul.html("");

        clearDirectionsInputData($input);

        if (value && value.length > 2) {
            var fuseResults = fuse.search(value);
            if (fuseResults) {
                // Provide search results as autocomplete options
                $.each(fuseResults, function (i, val) {
                    var li = '';
                    li += '<li>';
                    li += '<a href="#" data-transition="fade" class="ui-btn"';
                    li += 'data-value-lat="' + val.item.lat + '" ';
                    li += 'data-value-lng="' + val.item.lng + '" ';
                    li += 'data-value-drivinglat="' + val.item.drivingLat + '" ';
                    li += 'data-value-drivinglng="' + val.item.drivingLng + '" ';
                    li += '>' + val.item.title + '</a>';
                    li += '</li>';
                    listItems += li;
                });
                $ul.html(listItems);
                $ul.show();
                $ul.listview("refresh").trigger("updatelayout");
                $ul.children().each(function() {
                    // Handle click on autocomplete option:
                    $(this).click(function() {
                        setInputToKnownFeature(
                            $input,
                            $(this).text(),
                            $(this).children('a').attr('data-value-lng'),
                            $(this).children('a').attr('data-value-lat'),
                            $(this).children('a').attr('data-value-drivinglng'),
                            $(this).children('a').attr('data-value-drivinglat')
                        );
                        $ul.hide();
                    });
                });
            }
        }

    });
});

;
 /**
 * share.js
 *
 * Cleveland Metroparks
 *
 * Sharing functionality; the Share box and RESTful params for loading map state.
 *
 * (Included into app.js.)
 *
 * Basic workflow is:
 * - Map movements/events trigger calls to updateWindowURL[...]() functions.
 * - which call setWindowURLQueryStringParameters() to set the browser's location bar
 *   as well as the WINDOW_URL variable.
 * - If-and-when the user opens the share panel, an API request is made:
 *   to save the long URL and get a short URL in return.
 * - This short URL is displayed in the #share_url panel for the user to copy.
 *
 * We don't request a short URL with every map movement/change.
 */

/*
 *  Sharing handlers
 */
$(document).ready(function() {
    // Initially
    hideShareURL();

    // Highlight/select the share box URL when it is clicked.
    $('#share_url').click(function() {
        $(this).select();
    });

    // "Make Short URL" button click
    $('#make_share_url_btn').click(function() {
        makeAndShowShortURL();
    });
});

/**
 * Show Share URL
 */
function showShareURL() {
    $('#share_url_controls').show();
    $('#make_share_url_controls').hide();
    setShareURLBoxWidth();
}

/**
 * Hide Share URL
 */
function hideShareURL() {
    $('#share_url_controls').hide();
    $('#make_share_url_controls').show();
}

/**
 * Populate Share box
 *
 * Request [from the back-end] a shortened version of the current URL,
 * and put this into the share box.
 */
function makeAndShowShortURL() {
    var queryString = WINDOW_URL;
    // Remove leading '/?'
    if (queryString.charAt(0) == '/') {
        queryString = queryString.substr(1);
    }
    if (queryString.charAt(0) == '?') {
        queryString = queryString.substr(1);
    }

    // Re-prepend with '/?'
    queryString = '/?' + queryString;

    // submit the long URL param string to the server, get back a short param string
    var data = {
        querystring : queryString
    }
    $.post(API_NEW_BASE_URL + 'shorturls', data, function(reply) {
        // In native mobile, the URL structure is different than in web
        var url = new URL(location.href);
        var protocol =
            (url.protocol != 'file:')
            ? url.protocol
            : WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL;
        var host = (url.host)
            ? url.host
            : WEBAPP_BASE_URL_ABSOLUTE_HOST;

        var shareUrl = protocol + '//' + host + '/url/' + reply.data.shortcode;

        $('#share_url').val(shareUrl);
        showShareURL();
    })
    .fail(function() {
        alert("Unable to fetch a short URL.\nPlease try again.");
    });
}

/**
 * Set the Share URL box width
 * so that it and the copy-to-clipboard button fill the pane.
 */
function setShareURLBoxWidth() {
    var paneWidth = $('#share_url_controls').width();
    var clipboardBtnWidth = $('#pane-share .copy-to-clipboard').outerWidth();
    var $textInput = $('#share_url_controls .ui-input-text');
    // Account for padding & border
    var textInputExtraWidth = $textInput.outerWidth() - $textInput.width();
    // Calculate and set new width
    var textInputWidth = paneWidth - clipboardBtnWidth - textInputExtraWidth;
    $textInput.width(textInputWidth);
}

/**
 * "Copy to clipboard" button handler
 */
$(document).ready(function () {
    $('.copy-to-clipboard').click(function() {
        // Element ID to be copied is specified in the link's data-copy-id attribute
        var copyElId = $(this).attr('data-copy-id');
        var containerPane = $(this).closest('.sidebar-pane')[0];
        var $textInput = $('#' + copyElId);

        // focus() and select() the input
        $textInput.focus();
        $textInput.select();
        // setSelectionRange() for readonly inputs on iOS
        $textInput[0].setSelectionRange(0, 9999);
        // Copy
        document.execCommand("copy");

        // Show a "Copied to clipboard" tooltip
        var copiedTooltip = createCopiedToClipboardTooltip($textInput[0], containerPane);
        copiedTooltip.show();
        // Hide tooltip on subsequent click
        $(document).on('click', function(event) {
            // Make sure not to catch the original copy click
            if (!$(event.target).closest('.copy-to-clipboard').length) {
                copiedTooltip.hide();
            }
        });
    });
});

/**
 * Create a "Copied to clipboard" tooltip.
 */
function createCopiedToClipboardTooltip(textInputEl, container) {
    var tooltip = new Tooltip(textInputEl, {
        title: "Copied to clipboard.",
        container: container,
        placement: 'bottom',
        trigger: 'manual'
    });
    return tooltip;
}

;
 /**
 * search.js
 *
 * JS for search functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Enable "Keyword Search" subsystem event handlers 
 */
$(document).ready(function () {
    // Keyword Search text search in the initial "Find" (/Browse) pane
    // is just a shell over the one in #search
    $('#browse_keyword_button').click(function () {
        // Change to the Search pane
        sidebar.open('pane-search');

        // Fill in the Search keyword and click the button to do the search (if any).
        // It's up to #search_keyword to detect it being blank
        $('#search_keyword').val( $('#browse_keyword').val() );
        $('#search_keyword_button').click();
    });

    // Catch "Enter" keypress on Find pane search field
    $('#browse_keyword').keydown(function (key) {
        if (key.keyCode == 13) {
            $('#browse_keyword_button').click();
        }
    });

    // Keyword Search: the keyword box and other filters
    $('#search_keyword_button').click(function () {
        var keyword = $('#search_keyword').val();
        searchByKeyword(keyword);
    });

    // Catch "Enter" keypress on Search pane search field
    $('#search_keyword').keydown(function (key) {
        if(key.keyCode == 13) {
            $('#search_keyword_button').click();
        }
    });
});

/**
 * Disable keyword button
 */
function disableKeywordButton() {
    var button = $('#search_keyword_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
}

/**
 * Enable keyword button
 */
function enableKeywordButton() {
    var button = $('#search_keyword_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
}

/**
 * String to Lat/Long
 *
 * Given a string, try to parse it as coordinates and return a LngLat object.
 *
 * Currently supports these formats:
 *      N 44 35.342 W 123 15.669
 *      44.589033 -123.26115
 */
function strToLngLat(text) {
    var text = text.replace(/\s+$/,'').replace(/^\s+/,'');

    // Simplest format is decimal numbers and minus signs and that's about it.
    // One of them must be negative, which means it's the longitude here in North America
    if (text.match(/^[\d\.\-\,\s]+$/)) {
        var dd = text.split(/[\s\,]+/);
        if (dd.length == 2) {
            dd[0] = parseFloat(dd[0]);
            dd[1] = parseFloat(dd[1]);
            if (dd[0] && dd[1]) {
                var lat,lng;
                if (dd[0] < 0) {
                    lat = dd[1];
                    lng = dd[0];
                } else {
                    lat = dd[0];
                    lng = dd[1];
                }
                return new mapboxgl.LngLat(lng, lat);
            }
        }
    }

    // Okay, how about GPS/geocaching format: N xx xx.xxx W xxx xx.xxx
    var gps = text.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);
    if (gps) {
        var latd = parseInt(gps[1]);
        var latm = parseInt(gps[2]);
        var lond = parseInt(gps[3]);
        var lonm = parseInt(gps[4]);

        var lat = latd + (latm/60);
        var lng = -lond - (lonm/60);

        return new mapboxgl.LngLat(lng, lat);
    }

    // Nothing matched; bail
    return null;
}

/**
 * Search by Keyword
 *
 * A common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
 */
function searchByKeyword(keyword) {
    // Surprise bypass:
    // If the search word "looks like coordinates" then zoom the map there
    var lnglat = strToLngLat(keyword);
    if (lnglat) {
        MAP.flyTo({
            center: lnglat,
            zoom: 16
        });
        placeMarker(MARKER_TARGET, lnglat.lat, lnglat.lng);
        return;
    }

    // guess we go ahead and do a text search
    var target = $('#keyword_results');
    target.empty();

    disableKeywordButton();
    $('#pane-search .sortpicker').hide();

    var results = fuse.search(keyword);

    enableKeywordButton();
    $('#pane-search .sortpicker').show();

    var maxSearchScore = .5;
    var filteredResults = results.filter(result => result.score < maxSearchScore);

    if (!filteredResults.length) {
        // No matches. Pass on to an address search, and say so.
        $('<li></li>').text('No Cleveland Metroparks results found. Trying an address search.').appendTo(target);
        zoomToAddress(keyword);
        return;
    }

    for (var i=0, l=filteredResults.length; i<l; i++) {
        var result = filteredResults[i];

        // Skip any results that don't have a location
        if (!result.item.lat || !result.item.lng) {
            continue;
        }

        var li = $('<li></li>')
            .addClass('zoom')
            .addClass('ui-li-has-count');

        li.attr('title', result.item.title)
            .attr('gid', result.item.gid)
            .attr('type', result.item.type)
            .attr('w', result.item.w)
            .attr('s', result.item.s)
            .attr('e', result.item.e)
            .attr('n', result.item.n)
            .attr('lat', result.item.lat)
            .attr('lng', result.item.lng);

        li.attr('backbutton', '#pane-search');

        // Fake link
        link = $('<a></a>');
        link.attr('class', 'ui-btn ui-btn-text');

        // On click: center the map and load More Info
        li.click(function () {
            zoomElementClick($(this));
        });

        li.append(link);

        // Title
        link.append(
            $('<h4></h4>')
                .addClass('ui-li-heading')
                .text(result.item.title)
        );
        // Subtitle: Result type
        if (resultTypeNames[result.item.type]) {
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .text(resultTypeNames[result.item.type])
            );
        }
        // // @DEBUG: Search score
        // if (result.score) {
        //     link.append(
        //         $('<div></div>')
        //             .addClass('ui-li-desc')
        //             .text(result.score)
        //     );
        // }
    
        // Distance placeholder, to be populated later (in sortLists())
        link.append(
            $('<span></span>')
                .addClass('zoom_distance')
                .addClass('ui-li-count')
                .addClass('ui-btn-up-c')
                .addClass('ui-btn-corner-all')
                .text('0 mi')
        );

        // Add to the list
        li.append(link);
        target.append(li);
    }

    // Have jQuery turn into a proper listview
    target.listview('refresh');

    // Do distance calculations on list
    getListDistances(target);
}

/**
 *
 */
var resultTypeNames = {
    'attraction': 'Attraction',
    // 'trail': 'Trail',
    'loop': 'Trail',
    'reservation': 'Reservation',
    'reservation_new': 'Reservation',
};

/**
 * Load autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
 */
$(document).on("dataReadyAutocompleteKeywords", function() {
    $.each(CM.autocomplete_keywords, function(index, value) {
        var li = '';
        li += '<li data-icon="arrow-r">';
        li += '<a href="#" data-transition="fade" class="ui-btn ui-btn-icon-right ui-icon-arrow-r">' + value + '</a>';
        li += '</li>';
        $('#browse_keyword_autocomplete').append(li);
        $('#search_keyword_autocomplete').append(li);
    });

    // Make sure the newly-added items get hidden
    $('#browse_keyword_autocomplete').listview("refresh").trigger("updatelayout");
    $('#search_keyword_autocomplete').listview("refresh").trigger("updatelayout");

    $('#browse_keyword_autocomplete li').click(function () {
        $('#browse_keyword').val('').trigger("change"); // Clear the autocomplete list
        $('#browse_keyword').val($(this).text()); // Put the selected word in the text input
        $('#browse_keyword_button').click(); // Trigger search
    });

    $('#search_keyword_autocomplete li').click(function () {
        $('#search_keyword').val('').trigger("change"); // Clear the autocomplete list
        $('#search_keyword').val($(this).text()); // Put the selected word in the text input
        $('#search_keyword_button').click(); // Trigger search
    });
});

;
/*********************************************
 * Nearby
 *********************************************/


/**
 * CM.attractions_nearby:
 *
 * Copy of CM.attractions, but each item within has computed:
 *     meters, miles, feet, range, bearing
 * and are ordered
 */
$(document).on("dataReadyAttractions", function() {
    CM.attractions_nearby = CM.attractions.slice(0); // Copy array
    updateNearYouNow();
});

/**
 * Convert from Turf.js point to Mapbox GL JS LngLat
 *
 * @param {turf.point} point
 *
 * @return {mapboxgl.LngLat}
 */
function turfPointToLngLat(point) {
    return mapboxgl.LngLat.convert(point.geometry.coordinates);
}

/**
 * Distance (Haversine) from one point to another.
 *
 * @param fromLngLat {mapboxgl.LngLat}: From location
 * @param toLngLat {mapboxgl.LngLat}: To location
 *
 * @return Distance in meters
 */
function distanceTo(fromLngLat, toLngLat) {
    var turfFrom = turf.point(fromLngLat.toArray());
    var turfTo = turf.point(toLngLat.toArray());
    var options = {units: 'meters'};

    return turf.distance(turfFrom, turfTo, options);
}

/**
 * Bearing from one point to another, in decimal degrees
 *
 * @param fromLngLat {mapboxgl.LngLat}: From location
 * @param toLngLat {mapboxgl.LngLat}: To location
 *
 * @return {number} Final bearing in decimal degrees, between 0 and 360
 */
function bearingTo(fromLngLat, toLngLat) {
    var turfFrom = turf.point(fromLngLat.toArray());
    var turfTo = turf.point(toLngLat.toArray());
    var options = {final: true};

    return turf.bearing(turfFrom, turfTo, options);
}

/**
 * Bearing from one point to another, in NESW directional letters
 *
 * @param {mapboxgl.LngLat} from: From location
 * @param {mapboxgl.LngLat} to: To location
 *
 * @return {string} Bearing in NESW
 */
function bearingToInNESW(from, to) {
    var bearing = bearingTo(from, to);

    if      (bearing >= 22  && bearing <= 67)  return 'NE';
    else if (bearing >= 67  && bearing <= 112) return 'E';
    else if (bearing >= 112 && bearing <= 157) return 'SE';
    else if (bearing >= 157 && bearing <= 202) return 'S';
    else if (bearing >= 202 && bearing <= 247) return 'SW';
    else if (bearing >= 247 && bearing <= 292) return 'W';
    else if (bearing >= 292 && bearing <= 337) return 'NW';
    else if (bearing >= 337 || bearing <= 22)  return 'N';
};

/**
 * Add activity types options to the Nearby pane
 */
function addActivityTypesToNearby() {
    var optionsMarkup = '<fieldset id="nearby-activities" data-role="controlgroup">';
    $.each(CM.activities, function(index, value) {
        if (value && value.pagetitle) {
            optionsMarkup += '<label><input type="checkbox" name="nearby-category" value="' + value.pagetitle + '">' + value.pagetitle + '</label>';
        }
    });
    optionsMarkup += '</fieldset>';
    $('.form-group-wrapper').append(optionsMarkup).enhanceWithin();
}
// Populate DOM elements
$(document).on("dataReadyAttractions", function() {
    addActivityTypesToNearby();
});

/**
 * Update Near You Now
 *
 * update the Near You Now listing from CM.attractions_nearby;
 * called on a location update
 * this is a significant exception to the sortLists() system,
 * as we need to do the distance and sorting BEFORE rendering, an unusual case
 */
function updateNearYouNow() {
    var target_el = $('#alerts');

    // Iterate over CM.attractions_nearby and calculate distance from our last known location
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=CM.attractions_nearby.length; i<l; i++) {
        var attraction       = CM.attractions_nearby[i];
        var destpoint = new mapboxgl.LngLat(attraction.longitude, attraction.latitude);

        attraction.meters    = distanceTo(LAST_KNOWN_LOCATION, destpoint);
        attraction.miles     = attraction.meters / 1609.344;
        attraction.feet      = attraction.meters * 3.2808399;
        attraction.range     = (attraction.feet > 900) ? attraction.miles.toFixed(1) + ' mi' : attraction.feet.toFixed(0) + ' ft';

        attraction.bearing   = bearingToInNESW(LAST_KNOWN_LOCATION, destpoint);
    }

    // Sort CM.attractions_nearby by distance
    CM.attractions_nearby.sort(function (p,q) {
        return p.meters - q.meters;
    });
    // Take the closest few
    var closest_attractions = CM.attractions_nearby.slice(0,25);

    // Go over the closest attractions and render them to the DOM
    target_el.empty();
    for (var i=0, l=closest_attractions.length; i<l; i++) {
        var attraction = closest_attractions[i];

        var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
        li.attr('title', attraction.pagetitle);
        li.attr('category', attraction.categories);
        li.attr('type', 'attraction').attr('gid', attraction.gis_id);
        // li.attr('w', attraction.w).attr('s', attraction.s).attr('e', attraction.e).attr('n', attraction.n);
        li.attr('lat', attraction.latitude).attr('lng', attraction.longitude);
        li.attr('backbutton', '#pane-nearby');

        var div = $('<div></div>').addClass('ui-btn-text');
        div.append($('<h2></h2>').text(attraction.pagetitle));

        // Build a semicolon-separated string of the attraction's categories
        var categories_str = '';
        if (Array.isArray(attraction.categories)) {
            attraction.categories.forEach(function(category_id, index) {
                if (index > 0) {
                    categories_str += '; ';
                }
                categories_str += CM.categories[category_id].name;
            }); 
        };

        div.append($('<p></p>').text(categories_str));
        div.append($('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(attraction.range + ' ' + attraction.bearing));

        // On click, call zoomElementClick() to load more info
        li.click(function () {
            zoomElementClick( $(this) );
        });

        li.append(div);
        target_el.append(li);
    }

    // Done loading attractions; refresh the styling magic
    target_el.listview('refresh');
}

/**
 * Place circle
 *
 * @param {mapboxgl.LngLat} center
 * @param {number} meters
 */
function placeCircle(center, meters) {
    clearCircle();

    var radius = meters / 1000;
    var options = {units: 'kilometers'};
    var circle = turf.circle(turf.point(center.toArray()), radius, options);

    MAP.addLayer({
        'id': 'circle',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': circle,
        },
        'layout': {},
        'paint': {
            'fill-color': '#21A1F3',
            'fill-opacity': 0.3
        }
    });
}

/**
 * Clear circle
 */
function clearCircle() {
    if (MAP.getLayer('circle')) {
        MAP.removeLayer('circle');
    }
    if (MAP.getSource('circle')) {
        MAP.removeSource('circle');
    }
}

/**
 * Check Nearby
 *
 * @param {mapboxgl.LngLat} lngLat
 * @param {number} maxMeters
 * @param {} categories
 */
function checkNearby(lngLat, maxMeters, categories) {
    // 1: go over the Near You Now entries, find which ones are within distance and matching the filters
    maxMeters = parseFloat(maxMeters); // passed in as a .attr() string sometimes

    // Iterate over CM.attractions_nearby and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=CM.attractions_nearby.length; i<l; i++) {
        var attraction = CM.attractions_nearby[i];
        var poiLngLat = new mapboxgl.LngLat(attraction.longitude, attraction.latitude);
        var meters = distanceTo(lngLat, poiLngLat);

        // filter: distance
        if (meters > maxMeters) continue;

        // filter: category
        if (categories) {
            var thesecategories = attraction.categories.split("; ");
            var catmatch = false;
            for (var ti=0, tl=thesecategories.length; ti<tl; ti++) {
                for (var ci=0, cl=categories.length; ci<cl; ci++) {
                    if (categories[ci] == thesecategories[ti]) { catmatch = true; break; }
                }
            }
            if (! catmatch) continue;
        }

        // if we got here, it's a match for the filters; add it to the list
        var miles  = meters / 1609.344;
        var feet   = meters * 3.2808399;
        var range  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        alerts[alerts.length] = { gid:attraction.gid, title:attraction.title, range:range };
    }

    // 2: go over the alerts, see if any of them are not in LAST_BEEP_IDS
    // if so, then we beep and make an alert
    var beep = false;
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        if (LAST_BEEP_IDS.indexOf(key) == -1 ) { beep = true; break; }
    }

    // 3: rewrite LAST_BEEP_IDS to be only the IDs in sight right now
    // this is done regardless of whether we in fact beep, so we can re-beep for the same feature if we leave and then re-enter its area
    LAST_BEEP_IDS = [];
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        LAST_BEEP_IDS[LAST_BEEP_IDS.length] = key;
    }
    LAST_BEEP_IDS.sort();

    // 3: play the sound and compose an alert of what they just stumbled upon
    // the alert() is async otherwise it may block the beep from playing
    if (beep) {
        document.getElementById('alert_beep').play();
        var lines = [];
        for (var i=0, l=alerts.length; i<l; i++) {
            lines[lines.length] = alerts[i].title + ", " + alerts[i].range;
        }
        setTimeout(function () {
            alert( lines.join("\n") );
        }, 1000);
    }
}

// On page load: install event handlers for the Find and Nearby panels
$(document).ready(function () {
    $('#nearby_enabled').change(function () {
        // toggle the nearby config: category pickers, distance selector, etc.
        var enabled = $(this).is(':checked');
        enabled ? $('#nearby-config').show() : $('#nearby-config').hide();

        // if it's not checked, unfilter the results listing to show everything, and remove the circle
        if (! enabled) {
            $('#alerts li').slice(0,25).show();
            $('#alerts li').slice(25).hide();
            clearCircle();
        }
    });
});

;
/**
 * trails.js
 *
 * JS for "blessed" trails (AKA loops) functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Event handlers for Loops listing and filtering
 *
 * @see also doTrailSearch() below
 */
$(document).ready(function () {
    // the event handlers below are for the sliders and textboxes within #pane-loops,
    // so trigger a DOM rendering of the page now so the elements exist
    // $('#pane-trails').page(); // @TODO: GLJS. Still necessary?

    // the #loops_filter_type selector is invisible, and we have a set of icons to set its value when they're clicked
    $('#loops_typeicons img').click(function () {
        // uncheck all of the invisible checkboxes, then check the one corresponding to this image
        var $this = $(this);
        var value = $this.attr('data-value');
        $('#loops_filter_type').val(value).trigger('change');

        // adjust the images: change the SRC to the _off version, except this one which gets the _on version
        $('#loops_typeicons img').each(function () {
            var src = $(this).prop('src');
            if ( $(this).is($this) ) {
                if (!src.includes('-on.svg')) {
                    src  = src.replace('.svg', '-on.svg');
                }
            } else {
                src  = src.replace('-on.svg', '.svg');
            }
            $(this).prop('src', src);
        });
    }).first().click();

    // #loops_filter_distance_min & max are invisible,
    // with filter buttons linked
    $('#loops_filter_distancepicker a').click(function () {
        // set the min & max in the inputs
        var $this = $(this);
        var min_mi = $this.attr('data-min');
        var max_mi = $this.attr('data-max');
        $('#loops_filter_distance_min').val(min_mi);
        $('#loops_filter_distance_max').val(max_mi);

        // Toggle button active state
        $('#loops_filter_distancepicker a').each(function () {
            if ($(this).is($this)) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });

        // ready, now trigger a search
        doTrailSearch();
    //}).first().click();
    });

    // Reservation <select>
    $('#loops_filter_reservation').change(function () {
        // Perform search
        doTrailSearch();
    })

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();

    // the loop type selector doesn't filter immediately,
    // but it does show/hide the time slider and the time estimates for each loop,
    // since the estimate of time is dependent on the travel mode
    $('#loops_filter_type').change(function () {
        var type = $(this).val();

        // show only .time_estimate entries matching this 'type'
        switch (type) {
            case 'hike':
            case 'exercise':
                $('.time_estimate').hide();
                $('.time_hike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bridle':
                $('.time_estimate').hide();
                $('.time_bridle').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike':
            case 'bike_Novice':
            case 'bike_Beginner':
            case 'bike_Intermediate':
            case 'bike_Advanced':
            case 'mountainbike':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            default:
                $('.time_estimate').show();
                $('.time_estimate_prefix').show();
                break;
        }

        // then trigger a search
        doTrailSearch();
    });
});

/**
 * Filter trails
 *
 * @param activity {string} 'hike', 'bike*', 'bridle', or 'mountainbike'
 * @param reservation {string}
 * @param minDist: in feet
 * @param maxDist: in feet
 *
 * @return {array}
 */
function filterTrails(activity, reservation, minDist, maxDist) {
    results = [];

    // Change 'bike_Advanced', etc, to 'bike'
    if (activity.substr(0,4) == 'bike') {
        activity = 'bike';
    }

    var results = CM.trails.filter(function(trail) {
        // Filter by activity
        if (activity) {
            if (!trail[activity]) {
                return false;
            }
        }

        // Filter by reservation
        if (reservation) {
            if (trail['res'] != reservation) { // @TODO: if in reservation
                return false;
            }
        }

        // Filter by distance
        if ((typeof minDist !== 'undefined') && maxDist) {
            if (trail.distance_feet < minDist || trail.distance_feet > maxDist) {
                return false;
            }
        }

        return true;
    });

    // Note that results are no longer keyed by id.
    // filter() turns it in to a normal array.
    return results;
}

/**
 * Featured Routes list
 */
function doTrailSearch() {
    $('#loops_list li').show();

    // Filters
    var activity    = $('#loops_filter_type').val();
    var reservation = $('#loops_filter_reservation').val();
    var minDist     = 5280 * parseInt($('#loops_filter_distance_min').val());
    var maxDist     = 5280 * parseInt($('#loops_filter_distance_max').val());

    var results = filterTrails(activity, reservation, minDist, maxDist);

    // Find and empty the target UL
    var target = $('#loops_list');
    target.empty();

    // No results text
    $('.results-notes').remove();
    if (!results || !results.length) {
        var markup = '<p class="results-notes">No results.</p>';
        target.after(markup);
    }

    // Iterate over the results, add them to the output
    for (var i=0; i<results.length; i++) {
        var result = results[i];

        var li = $('<li></li>')
            .addClass('zoom')
            .addClass('ui-li-has-count');

        li.attr('title', result.name)
            .attr('gid', result.id)
            .attr('type','loop')
            .attr('w', result.boxw)
            .attr('s', result.boxs)
            .attr('e', result.boxe)
            .attr('n', result.boxn)
            .attr('lat', result.lat)
            .attr('lng', result.lng);

        li.attr('backbutton', '#pane-trails');

        // Link (fake, currently)
        link = $('<a></a>');
        link.attr('class', 'ui-btn ui-btn-text');
        //link.attr('href', 'javascript:zoomElementClick(this)');

        // On click: center the map and load More Info
        li.click(function () {
            zoomElementClick( $(this) );
        });
        li.append(link);

        // Title
        link.append(
            $('<h4></h4>')
                .addClass('ui-li-heading')
                .text(result.name)
        );

        // Select duration value based on chosen activity, defaulting to hike
        var duration;
        switch (activity) {
            case 'mountainbike':
            case 'bike_Advanced':
                duration = result.durationtext_bike;
                break;
            case 'bridle':
                duration = result.durationtext_bridle;
                break;
            case 'hike':
            default:
                duration = result.durationtext_hike;
        }

        // Inner text: distance and duration
        link.append(
            $('<span></span>')
                .addClass('ui-li-desc')
                .html(result.distancetext + ' &nbsp;&nbsp; ' + duration)
        );

        // Distance placeholder, to be populated later
        link.append(
            $('<span></span>')
                .addClass('zoom_distance')
                .addClass('ui-li-count')
                .addClass('ui-btn-up-c')
                .addClass('ui-btn-corner-all')
                .text('0 mi')
        );

        // Add to the list
        li.append(link);
        target.append(li);
    }

    // sort it by distance and have jQuery Mobile refresh it
    $('#pane-trails .sortpicker').show();
    target.listview('refresh');
    sortLists(target);
}

;
this["CM"] = this["CM"] || {};
this["CM"]["Templates"] = this["CM"]["Templates"] || {};

this["CM"]["Templates"]["info_attraction"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <h4>Activities:</h4>\n    <ul class=\"activities-icon-list\">\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"activity_icons") : depth0),{"name":"each","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":6,"column":8},"end":{"line":8,"column":17}}})) != null ? stack1 : "")
    + "    </ul>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <li><img src=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"src") : depth0), depth0))
    + "\" title=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\" alt=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\"></li>\n";
},"4":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"6":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <div class=\"feature-description\">"
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</div>\n";
},"8":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <ul class=\"nobull\">\n        <li><a href=\""
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"main_site_url") : stack1), depth0))
    + "\" target=\"_blank\">More info</a></li>\n    </ul>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"activities") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":10,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(4, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":0},"end":{"line":14,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1),{"name":"if","hash":{},"fn":container.program(6, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":16,"column":0},"end":{"line":18,"column":7}}})) != null ? stack1 : "")
    + "\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"cmp_url") : stack1),{"name":"if","hash":{},"fn":container.program(8, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":20,"column":0},"end":{"line":24,"column":7}}})) != null ? stack1 : "")
    + "\n<h4>GPS coordinates:</h4>\n<div class=\"small-light\">\n    "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"coords_formatted") : stack1), depth0))
    + "\n</div>";
},"useData":true});

this["CM"]["Templates"]["info_reservation"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"src") : stack1), depth0))
    + "\" width=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"width") : stack1), depth0))
    + "\" height=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"img") : depth0)) != null ? lookupProperty(stack1,"height") : stack1), depth0))
    + "\" alt=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	<h4>Phone</h4>\n	<a title=\"Call "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\" href=\"tel:"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1), depth0))
    + "</a>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</h2>\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,(depth0 != null ? lookupProperty(depth0,"img") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":3,"column":0},"end":{"line":5,"column":7}}})) != null ? stack1 : "")
    + "\n<p>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"descr") : stack1), depth0))
    + "</p>\n\n<h4>Hours of Operation</h4>\n"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"hoursofoperation") : stack1), depth0))
    + "\n\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"phone") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":12,"column":0},"end":{"line":15,"column":7}}})) != null ? stack1 : "")
    + "\n<div class=\"lat_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlatitude") : stack1), depth0))
    + "</div>\n<div class=\"lng_driving\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"drivingdestinationlongitude") : stack1), depth0))
    + "</div>";
},"useData":true});

this["CM"]["Templates"]["info_trail"] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, walking: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_hike") : stack1), depth0))
    + "<br/>\n";
},"3":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, bicycle: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_bike") : stack1), depth0))
    + "<br/>\n";
},"5":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "	Est time, horseback: "
    + container.escapeExpression(container.lambda(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"durationtext_bridle") : stack1), depth0))
    + "<br/>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<h2>"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "</h2>\n\n<p>\nLength: "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"distancetext") : stack1), depth0))
    + "<br/>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"hike") : stack1),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":0},"end":{"line":7,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"bike") : stack1),{"name":"if","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":8,"column":0},"end":{"line":10,"column":7}}})) != null ? stack1 : "")
    + ((stack1 = lookupProperty(helpers,"if").call(alias3,((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"bridle") : stack1),{"name":"if","hash":{},"fn":container.program(5, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":11,"column":0},"end":{"line":13,"column":7}}})) != null ? stack1 : "")
    + "</p>\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"feature") : depth0)) != null ? lookupProperty(stack1,"description") : stack1), depth0)) != null ? stack1 : "")
    + "\n\n<div class=\"elevationprofileimage\" style=\"text-align:center;\">\n    <canvas id=\"elevation-profile-trail\" alt=\"Elevation profile\"></canvas>\n</div>\n";
},"useData":true});

this["CM"]["Templates"]["pane_activities_item"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<li>\n    <a href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"link_url") : stack1), depth0))
    + "\">\n        <img class=\"ui-li-icon\" src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\" /> <span class=\"title\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"activity") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</span>\n    </a>\n</li>\n";
},"useData":true});

this["CM"]["Templates"]["pane_amenities_item"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<li>\n    <a href=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"link_url") : stack1), depth0))
    + "\">\n        <i class=\"cm-icon cm-icon-"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"icon") : stack1), depth0))
    + "\"></i>\n        "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"amenity") : depth0)) != null ? lookupProperty(stack1,"name") : stack1), depth0))
    + "\n    </a>\n</li>\n";
},"useData":true});

this["CM"]["Templates"]["pane_trails_reservation_filter_option"] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<option value=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"reservation") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "\">"
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"reservation") : depth0)) != null ? lookupProperty(stack1,"pagetitle") : stack1), depth0))
    + "</option>\n";
},"useData":true});
;
let trailviewToggled = false;

/** @type {import('@cmparks/trailviewer/dist/trailviewer-base'.TrailViewerBase) | null} */
let trailviewViewer = null;

/** @type {mapboxgl.Marker | null} */
let trailviewMapMarker = null;

let trailviewMouseOnDot = false;

/** @type {'map' | 'viewer'} */
let trailviewFocusedElement = 'map';

let lastMapResize = new Date();

function initTrailView() {
    const trailviewIcon = document.querySelector("#trailviewIcon");
    if (trailviewIcon === null) {
        throw new Error("trailviewIcon id not found");
    }
    trailviewIcon.addEventListener('click', () => {
        toggleTrailView();
    })

    const mapCanvas = document.querySelector('#map_canvas')
    new ResizeObserver(() => {
        if (new Date().valueOf() - lastMapResize.valueOf() > 80) {
            MAP.resize();
            lastMapResize = new Date();
        }
    }).observe(mapCanvas);
    mapCanvas.addEventListener('transitionend', () => {
        MAP.resize();
        if (trailviewMapMarker !== null) {
            MAP.easeTo({
                center: trailviewMapMarker.getLngLat(),
                duration: 500,
            });
        }
    });
}

function toggleTrailView() {
    if (trailviewToggled === false) {
        trailviewToggled = true;
        addTrailViewMapLayer();
        $('#trailviewViewer').fadeIn();
        if (trailviewViewer === null) {
            const options = trailviewer.defaultBaseOptions;
            options.target = 'trailviewViewer';
            trailviewViewer = new trailviewer.TrailViewerBase(options);
            trailviewViewer.on('image-change', (image) => {
                if (MAP !== null && trailviewMapMarker !== null) {
                    trailviewMapMarker.setLngLat([image.longitude, image.latitude]);
                    MAP.easeTo({
                        center: trailviewMapMarker.getLngLat(),
                        duration: 500,
                    });
                }
            });
        }
        addTrailViewExpandButton();
    } else {
        trailviewToggled = false;
        removeTrailViewMapLayer();
        $('#trailviewViewer').fadeOut();
        trailviewViewer.destroy();
        trailviewViewer = null;
    }
}

function removeTrailViewMapLayer() {
    if (MAP.getSource('dots')) {
        MAP.removeLayer('dots');
        MAP.removeSource('dots');
    }
}

function addTrailViewExpandButton() {
    const button = document.createElement('button');
    button.type = "button";
    button.id = 'trailviewExpandIcon';
    button.classList.add('trailview-button');
    button.setAttribute('data-role', 'none');
    const span = document.createElement('span');
    span.classList.add('cm-icon-expand');
    button.appendChild(span);
    document.querySelector('#trailviewViewer').appendChild(button);
    button.addEventListener('click', () => {
        toggleTrailViewFocus();
    });
}

function toggleTrailViewFocus() {
    if (trailviewFocusedElement === 'map') {
        trailviewFocusedElement = 'viewer';
        document.querySelector('#map_canvas').classList.add('trailview-map-small');
        document.querySelector('#trailviewViewer').classList.remove('trailviewer-small');
        document.querySelector('#trailviewViewer').classList.add('trailviewer-focus');
        document.querySelector('#map_canvas').addEventListener('transitionend', () => {
            MAP.resize();
        }, { once: true })
    } else if (trailviewFocusedElement === 'viewer') {
        trailviewFocusedElement = 'map';
        document.querySelector("#map_canvas").classList.remove('trailview-map-small');
        document.querySelector('#trailviewViewer').classList.remove('trailviewer-focus');
        document.querySelector('#trailviewViewer').classList.add('trailviewer-small');
        MAP.resize();
    }

}

function addTrailViewMapLayer() {
    if (MAP === null) {
        return;
    }
    removeTrailViewMapLayer();
    const layerData = {
        type: 'vector',
        format: 'pbf',
        tiles: ['https://trailview.cmparks.net/api/tiles/{z}/{x}/{y}/standard'],
    };

    MAP.addSource('dots', layerData);

    MAP.addLayer({
        id: 'dots',
        'source-layer': 'geojsonLayer',
        source: 'dots',
        type: 'circle',
        paint: {
            'circle-radius': 10,
            'circle-color': [
                'case',
                ['==', ['get', 'visible'], true],
                '#00a108',
                '#db8904',
            ],
        },
    });
    MAP.setPaintProperty('dots', 'circle-radius', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        3,

        16,
        5,

        17,
        7,

        20,
        8,
    ]);
    MAP.setPaintProperty('dots', 'circle-opacity', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        0.05,

        15,
        0.1,

        17,
        0.25,

        20,
        1,
    ]);

    MAP.on('mouseenter', 'dots', () => {
        trailviewMouseOnDot = true;
        if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'pointer';
        }
    });

    MAP.on('mouseleave', 'dots', () => {
        trailviewMouseOnDot = false;
        if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'grab';
        }
    });

    MAP.on('mousedown', () => {
        if (MAP !== null && !trailviewMouseOnDot) {
            MAP.getCanvas().style.cursor = 'grabbing';
        }
    });

    MAP.on('mouseup', () => {
        if (MAP !== null && trailviewMouseOnDot) {
            MAP.getCanvas().style.cursor = 'pointer';
        } else if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'grab';
        }
    });

    createTrailviewMapMarker();

    MAP.on('click', 'dots', (event) => {
        if (
            event.features === undefined ||
            event.features[0].properties === null
        ) {
            console.warn('Features is undefiend or properties are null');
            return;
        }
        trailviewViewer.goToImageID(event.features[0].properties.imageID);
    });
}

function createTrailviewMapMarker() {
    const currentMarkerWrapper = document.createElement('div');
    currentMarkerWrapper.classList.add('trailview-current-marker-wrapper');
    const currentMarkerDiv = document.createElement('div');
    currentMarkerDiv.classList.add('trailview-current-marker');
    const currentMarkerViewDiv = document.createElement('div');
    currentMarkerViewDiv.classList.add('trailview-marker-viewer');
    currentMarkerWrapper.appendChild(currentMarkerDiv);
    currentMarkerWrapper.appendChild(currentMarkerViewDiv);
    trailviewMapMarker = new mapboxgl.Marker(currentMarkerWrapper)
        .setLngLat([-81.682665, 41.4097766])
        .addTo(MAP)
        .setRotationAlignment('map');

    updateTrailViewMarkerRotation();
}

function updateTrailViewMarkerRotation() {
    if (trailviewViewer !== null && trailviewMapMarker !== null) {
        const angle = trailviewViewer.getBearing();
        if (angle !== undefined) {
            trailviewMapMarker.setRotation((angle + 225) % 360);
        }
    }
    if (trailviewToggled !== false) {
        requestAnimationFrame(updateTrailViewMarkerRotation);
    } else {
        trailviewMapMarker.remove();
    }
}