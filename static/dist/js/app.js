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
// These change to remote URLs for native app and web-embedded scenarios.
// @TODO: Put these into a local config so we can handle non-root basedirs.
var WEBAPP_BASEPATH = '/';
var API_BASEPATH = '/';
var MAP = null;

var WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL = 'https:';
var WEBAPP_BASE_URL_ABSOLUTE_HOST = 'maps.clevelandmetroparks.com';
var WEBAPP_BASE_URL_ABSOLUTE = WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL + '//' + WEBAPP_BASE_URL_ABSOLUTE_HOST + '/';

// Web (mobile and desktop) vs native iOS/Android
var NATIVE_APP = false;

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

var ELEVATION_PROFILE = null;

var SKIP_TO_DIRECTIONS = false;

var ctrlGeolocate;

var SETTINGS = [];
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
function latlng_formatted(latlng, coordinate_format) {
    if (coordinate_format != null) {
        format = coordinate_format;
    } else {
        format = SETTINGS.coordinate_format;
    }
    switch (format) {
        case 'dms':
            return latlng_as_dms(latlng);
        case 'ddm':
            return latlng_as_ddm(latlng);
        case 'dd':
            return latlng_as_dd(latlng);
        default:
            return latlng_as_dms(latlng);
    }
}

/**
 * Return lat/lng as Degrees Minutes Seconds (DMS) string.
 */
function latlng_as_dms(latlng, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 0;

    var ns = latlng.lat < 0 ? 'S' : 'N';
    var ew = latlng.lng < 0 ? 'W' : 'E';

    lat_dd = Math.abs(latlng.lat);
    lng_dd = Math.abs(latlng.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = parseInt(60 * (lat_dd - lat_d));
    var lat_s = ((lat_dd - lat_d - (lat_m / 60)) * 3600).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = parseInt(60 * (lng_dd - lng_d));
    var lng_s = ((lng_dd - lng_d - (lng_m / 60)) * 3600).toFixed(precision);;

    latlng_str = lat_d + '° ' + lat_m + '\' ' + lat_s + '" ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + lng_s + '" ' + ew;

    return latlng_str;
}

/**
 * Return lat/lng as Degrees Decimal Minutes (DDM) string.
 */
function latlng_as_ddm(latlng, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 2;

    var ns = latlng.lat < 0 ? 'S' : 'N';
    var ew = latlng.lng < 0 ? 'W' : 'E';

    var lat_dd = Math.abs(latlng.lat);
    var lng_dd = Math.abs(latlng.lng);

    var lat_d = parseInt(lat_dd);
    var lat_m = (60 * (lat_dd - lat_d)).toFixed(precision);

    var lng_d = parseInt(lng_dd);
    var lng_m = (60 * (lng_dd - lng_d)).toFixed(precision);

    latlng_str = lat_d + '° ' + lat_m + '\' ' + ns + ', ' + lng_d + '° ' + lng_m + '\' ' + ew;

    return latlng_str;
}

/**
 * Return lat/lng as Decimal Degrees (DD) string.
 */
function latlng_as_dd(latlng, precision) {
    // Default precision
    precision = (typeof precision !== 'undefined') ?  precision : 4;

    latlng_str = latlng.lat.toFixed(precision) + ', ' + latlng.lng.toFixed(precision);
    return latlng_str;
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

    $.each(params, function(index, value) {
        urlParams.set(index, value);
    });

    saveWindowURL(urlParams, pushState);
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
var LAST_KNOWN_LOCATION = new mapboxgl.LngLat.convert(START_CENTER);

var AUTO_CENTER_ON_LOCATION = false;

// sorting by distance, isn't always by distance
// what type of sorting do they prefer?
var DEFAULT_SORT = 'distance';

// Load sidebar when map has been initialized
$(document).on("mapInitialized", function () {
    if (!sidebar) {
        sidebar = $('#sidebar').sidebar();
    }

    // Open "Welcome" sidebar pane on startup if:
    //   User loads the app without a path or query string AND
    //   their screen is big enough that the sidebar won't cover the map.
    if (
        (window.location.pathname == '/' ||
         window.location.pathname.endsWith("index.html")) // For cordova
        &&
        window.location.search == '' &&
        !sidebarCoversMap()
    ) {
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

// @TODO: GLJS: Necessary?
/**
 * Refresh the map on resize or orientation change to prevent a flash/disappearance.
 */
$(document).on("mapInitialized", function () {
    $(window).bind('orientationchange pageshow resize', function() {
        MAP.resize();
    });
});

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

    // URL params query string: "type" and "name"
    // @TODO: Do we still have a way to get here?
    if (urlParams.get('type') && urlParams.get('name') ) {
        var params = {
            type: urlParams.get('type'),
            name: urlParams.get('name')
        };
        $.get(API_BASEPATH + 'ajax/exactnamesearch', params, function (reply) {
            if (!(reply && reply.s && reply.w && reply.n && reply.e)) {
                return alert("Cound not find that feature.");
            }

            // Zoom to the bbox
            MAP.fitBounds([[reply.w, reply.s], [reply.e, reply.n]]);

            // Lay down the WKT or a marker to highlight it
            if (reply.lat && reply.lng) {
                placeMarker(MARKER_TARGET, reply.lat, reply.lng);
            } else if (reply.wkt) {
                showWkt(reply.wkt);
            }
        }, 'json');
    }

    // URL params query string: "type" and "gid"
    if (urlParams.get('type') && urlParams.get('gid') ) {

        if (urlParams.get('type') == 'attraction') {
            // Attraction
            var params = {
                gid: urlParams.get('gid')
            };
            $.get(API_BASEPATH + 'ajax/get_attraction', params, function (reply) {
                if (!reply || ! reply.lat || ! reply.lng) {
                    return alert("Cound not find that feature.");
                }

                // Reformat reply as a "feature" with the properties necessary for zoomToFeature()
                var feature = reply;
                reply.type = 'attraction';

                zoomToFeature(reply);

                showAttractionInfo('attraction', reply);

            }, 'json');
        } else if (urlParams.get('type') == 'reservation_new') {
            // Reservation
            var params = {
                gid: urlParams.get('gid')
            };
            $.get(API_BASEPATH + 'ajax/get_reservation', params, function (reply) {
                if (!reply || !reply.lat || !reply.lng) {
                    return alert("Cound not find that reservation.");
                }
                // Reformat reply as a "feature" with the properties named as necessary for zoomToFeature()
                var feature = reply;
                feature.gid = reply.record_id;
                feature.w = reply.boxw;
                feature.n = reply.boxn;
                feature.e = reply.boxe;
                feature.s = reply.boxs;
                feature.type = 'reservation_new';

                zoomToFeature(feature);

                showAttractionInfo('reservation_new', reply);

            }, 'json');
        }

    }

    // URL params query string: "route"
    // Fill in the boxes and run it now
    if (urlParams.get('routefrom') && urlParams.get('routeto') && urlParams.get('routevia') ) {
        // split out the params
        var sourcelat = urlParams.get('routefrom').split(",")[0];
        var sourcelng = urlParams.get('routefrom').split(",")[1];
        var targetlat = urlParams.get('routeto').split(",")[0];
        var targetlng = urlParams.get('routeto').split(",")[1];
        var via       = urlParams.get('routevia');
        var tofrom    = 'to';

        // toggle the directions panel so it shows directions instead of Select A Destination
        sidebar.open('pane-getdirections');
        $('#getdirections_disabled').hide();
        $('#getdirections_enabled').show();

        // fill in the directions field: the title, route via, the target type and coordinate, the starting coordinates
        $('#directions_target_title').text(urlParams.get('routetitle'));
        $('#directions_via').val(urlParams.get('routevia'));
        $("#directions_via").selectmenu('refresh');
        $('#directions_type').val('geocode');
        $("#directions_type").selectmenu('refresh');
        $('#directions_type_geocode_wrap').show();
        $('#directions_address').val(urlParams.get('routefrom'));
        $('#directions_target_lat').val(targetlat);
        $('#directions_target_lng').val(targetlng);
        $('#directions_via').trigger('change');
        $('#directions_address').val( urlParams.get('fromaddr') );
        $('#directions_reverse').val( urlParams.get('whichway') );
        $('#directions_via_bike').val( urlParams.get('routevia_bike') );

        setTimeout(function () {
            $('#directions_reverse').trigger('change');
        },1000);
        $('#directions_type').val( urlParams.get('loctype') );

        // make the Directions request
        getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
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
 * Show Elevation
 */
function showElevation(url) {
    $('#elevation').prop('src',url);
    sidebar.open('pane-elevationprofile');
}

/**
 * Show Attraction Info
 *
 * Show attraction info in the sidebar pane.
 *
 * Starting to split up / improve upon zoomElementClick()
 * (Moving away from using a DOM element to pass info.)
 * We can generalize this for other types of POIs later.
 *
 * attraction.gid
 * attraction.title
 * attraction.lat
 * attraction.lng
 */
function showAttractionInfo(attractionType, attraction) {
    prepareInfoPaneForFeature(attraction);

    // Get more info via AJAX
    if (attraction.gid || attraction.record_id) {
        var params = {};
        params.type = attractionType;
        params.gid = attraction.gid || attraction.record_id;

        // Get and display the "more info" plain HTML
        $.get(API_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            $('#info-content').html(reply);
        }, 'html');
    }
}

/**
 * zoomElementClick
 * 
 * Given a .zoom element with {lon, lat, WSEN, type, gid},
 * fetch info about it and show it in a panel.
 */
function zoomElementClick(element) {
    var feature = getFeatureFromElement(element);

    prepareInfoPaneForFeature(feature);

    showOnMap(feature);

    // If the feature has a type and a gid, then we can fetch info about it
    // do some AJAX, fill in the page with the returned content
    // otherwise, fill in the title we were given and leave it at that
    if (feature.type && feature.gid) {
        var params = {};
        params.type = feature.type;
        params.gid  = feature.gid;
        params.lat  = LAST_KNOWN_LOCATION.lat;
        params.lng  = LAST_KNOWN_LOCATION.lng;
        $.get(API_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            // All set, the info is loaded
            // there's a special case where they only got the info for the purpose of routing there
            // handle that by clcking the Directions By Car button
            if (SKIP_TO_DIRECTIONS) {
                $('#directions_car').click();
                SKIP_TO_DIRECTIONS = false;
                return;
            }

            $('#info-content').html(reply);

            // If there's a <div class="wkt"> element in the HTML,
            //   (this happens in moreinfo_trail.phtml and moreinfo_loop.phtml)
            // it is vector data to be handled by zoomToFeature().
            // Display it, and move its data into the Show On Map button.
            var $wkt_el = $('#info-content').find('div.wkt');
            if ($wkt_el) {
                var wkt_data = $wkt_el.text();
                if (wkt_data) {
                    showWkt(wkt_data);
                    $('#show_on_map').data('wkt', wkt_data);
                    $wkt_el.remove();
                }
            }
        }, 'html');
    } else {
        // fill in the title since we have little else,
        // then presume that the person wants to route there by clicking the Directions By Car button
        $('#info-content').html( $('<h1></h1>').text(feature.title));
        $('#directions_car').click();
    }
}

/**
 * Set up info pane to populate.
 *
 * @param: {Object} feature
 */
function prepareInfoPaneForFeature(feature) {
    // Assign this feature to the Show On Map button, so it knows what to zoom to
    $('#show_on_map').data('zoomelement', feature);

    // Purge any vector data from the Show On Map button;
    // the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null);

    // Set up our directions target element so we can route to it.
    $('#directions_target_lat').val(feature.lat);
    $('#directions_target_lng').val(feature.lng);
    $('#directions_target_type').val(feature.type);
    $('#directions_target_gid').val(feature.gid);
    $('#directions_target_title').text(feature.title);

    // Change to the Info pane
    sidebar.open('pane-info');

    // Make the Back button link to the URL if specified, else to Browse
    if (!feature.back_url) {
        feature.back_url = '#pane-browse';
    }
    set_pane_back_button('#pane-info', feature.back_url);

    // Enable "Get Directions"
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

    $('#info-content').text("Loading...");
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
    if (feature.type=='reservation_new') {
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
 * Sort Lists
 * a unified interface to calculate distances of items in a list, then sort that list by distance
 * this ended up being so common a design pattern, putting it here saves a lot of repeat
 * look for the magic tag ul.distance_sortable and populate the .zoom_distance boxes within it, then sort the ul.distance_sortable
 */
function sortLists(target) {
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

    // finally, the sort!
    switch (DEFAULT_SORT) {
        case 'distance':
            target.children('li').sort(function (p,q) {
                return ( $(p).data('meters') > $(q).data('meters') ) ? 1 : -1;
            });
            break;
        case 'alphabetical':
            target.children('li').sort(function (p,q) {
                return ( $(p).attr('title') > $(q).attr('title') ) ? 1 : -1;
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
function zoomToAddress(searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $.get(API_BASEPATH + 'ajax/geocode', params, function (result) {
        if (!result) {
            return alert("We couldn't find that address or city.\nPlease try again.");
        }

        var lngLat = new mapboxgl.LngLat(result.lng, result.lat);

        // if this point isn't even in the service area, complain and bail
        // tip: "post office" finds Post Office, India
        if (!MAX_BOUNDS.contains(lngLat)) {
            return alert("The only results we could find are too far away to zoom the map there.");
        }

        // zoom the point location, nice and close, and add a marker
        switchToMap();

        placeMarker(MARKER_TARGET, result.lat, result.lng);
        MAP.flyTo({center: lngLat, zoom: DEFAULT_POI_ZOOM});
        // Place a popup at the location with geocoded interpretation of the address
        // and a pseudo-link (with data-holding attributes) that triggers zoomElementClick().
        var markup = '<h3 class="popup_title">' + result.title + '</h3>';
        markup += '<span class="fakelink zoom" title="'+result.title+'" lat="'+result.lat+'" lng="'+result.lng+'" w="'+result.w+'" s="'+result.s+'" e="'+result.e+'" n="'+result.n+'" onClick="zoomElementClick($(this));">Directions</span>';

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
            showOnMap(feature);
        }
    });
});

/**
 * Show on map
 *
 * Push feature info params to window history
 * and zoom/flyto.
 */
function showOnMap(feature) {
    // Push this state change onto window URL history stack
    if (feature.type && feature.gid && feature.gid != 0) {
        var params = {
            type: feature.type,
            gid: feature.gid
        };
        setWindowURLQueryStringParameters(params, false, true);
    }

    zoomToFeature(feature);
};

/**
 * Zoom to a feature on the map
 *
 * @param {Object} feature:
 *     w,s,e,n (optional)
 *     lat,lng (optional)
 *     type (optional)
 *     wkt (optional)
 */
function zoomToFeature(feature) {
    // Clear existing points & lines
    clearMarker(MARKER_TARGET);
    clearHighlightLine();

    // Switch to the map if necessary (close sidebar in mobile)
    switchToMap();

    // Zoom the map into the stated bbox, if we have one.
    if (    (feature.w && feature.s && feature.e && feature.n) &&
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
        update_user_latlon_display();
    });
});

/**
 * Get session-based coordinate format on pageload (and set user geolocation display).
 */
$(document).ready(function () {
    getSessionCoordinateFormat();
});

/**
 * Change the GPS coordinate format used in the interface.
 *
 * @param format: 'dms', 'ddm', or 'dd'.
 */
function changeCoordinateFormat(format) {
    SETTINGS.coordinate_format = format;
    setSessionCoordinateFormat(format);
}

/**
 * Get user's coordinate format setting from session config, and update UI.
 */
function getSessionCoordinateFormat() {
    $.get(API_BASEPATH + 'ajax/get_session_coordinate_format', {}, function (reply) {
        if (reply) {
            // Update UI setting and user location display.
            SETTINGS.coordinate_format = reply;
            update_user_latlon_display();
            return reply;
        } else {
            console.log('Error: get_session_coordinate_format: Could not get coordinate format.');
            return;
        }
    }, 'json');
}

/**
 * Set user's coordinate format setting from session config.
 */
function setSessionCoordinateFormat(format) {
    var params = {
        coordinate_format: format
    };

    $.get(API_BASEPATH + 'ajax/set_session_coordinate_format', params, function (reply) {
        if (!reply) {
            console.log('Error: set_session_coordinate_format: No reply.');
        }
    }, 'json');
}

/**
 * Map click handling
 *
 * Our version of a WMS GetFeatureInfo control:
 * A map click calls query.php to get JSON info, and we construct a bubble.
 * But, we only call this if a popup is not open: if one is open, we instead close it.
 */
$(document).on("mapReady", function() {
    MAP.on('click', function (event) {
        // Is there a popup currently visible?
        // If so, no query at all but close the popup and bail.
        // Sorry, Leaflet: closePopupOnClick doesn't work for this, as it clears the popup before we get the click.
        if ($('.leaflet-popup').length) {
            return MAP.closePopup();
        }

        // Made it here? Good, do a query.
        wmsGetFeatureInfoByPoint(event.point, event.lngLat);
    });
});

/**
 * Get WMS feature info by point
 */
function wmsGetFeatureInfoByPoint(point, lngLat) {
    var pixBuf = 20; // Pixel buffer; number of pixels to pad for the bounding box

    // unproject() changes pixel-based point locations to LngLats
    var sw = MAP.unproject([(point.x - pixBuf), (point.y + pixBuf)]);
    var ne = MAP.unproject([(point.x + pixBuf), (point.y - pixBuf)]);
    var bounds = new mapboxgl.LngLatBounds(sw, ne);

    wmsGetFeatureInfoByBbox(bounds, lngLat);
}

/**
 * Get WMS feature info by LngLat BBOX
 *
 * @param {LngLatBounds} bounds
 * @param {LngLat} lngLat
 */
function wmsGetFeatureInfoByBbox(bounds, lngLat) {
    var data = {
        w: bounds.getWest(),
        s: bounds.getSouth(),
        e: bounds.getEast(),
        n: bounds.getNorth(),
        zoom: MAP.getZoom()
    };

    $.get(API_BASEPATH + 'ajax/query', data, function (markup) {
        if (!markup) {
            return;
        }

        var popup = new mapboxgl.Popup()
            .setLngLat(lngLat)
            .setHTML(markup)
            .addTo(MAP);

    }, 'html');
}

;
/**
 * Sidebar
 */

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

    /*
     * Find pane (#pane-browse)
     */
    $('#pane-browse li a[href="#pane-activities"]').click(function() {
        set_pane_back_button('#pane-activities', '#pane-browse');
    });
    $('#pane-browse li a[href="#pane-trails"]').click(function() {
        set_pane_back_button('#pane-trails', '#pane-browse');
        // Perform trails search upon opening the pane.
        filterLoops();
    });

    /*
     * Nearby pane (#pane-nearby)
     */
    $('.sidebar-tabs li a[href="#pane-nearby"]').click(function() {
        updateNearYouNow();
    });

    /*
     * Activities pane (#pane-activities)
     */
    // When an Activity is clicked:
    $('#pane-activities li a').click(function() {
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

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(API_BASEPATH + 'ajax/get_attractions_by_activity', { activity_ids: activity_id }, function (reply) {
            display_attractions_results(pane_title, reply);
        }, 'json');
    });

    /*
     * Amenities pane (#pane-amenities)
     */
    // When an amenity is clicked:
    $('#pane-amenities li a').click(function() {
        // Get Amenity ID from query string param
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /amenity_id=(\d*)/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            amenity_id = matches[1];
        }

        pane_title = $(this).text().trim();
        set_pane_back_button('#pane-browse-results', '#pane-amenities');

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(API_BASEPATH + 'ajax/get_attractions_by_amenity', { amenity_ids: amenity_id }, function (reply) {
            display_attractions_results(pane_title, reply);
        }, 'json');
    });

    /*
     * Welcome pane (#pane-welcome)
     */
    // Visitor Centers button clicked
    $('#pane-welcome .welcome-pane-visitorcenters a').click(function() {
        pane_title = 'Visitor Centers';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(API_BASEPATH + 'ajax/get_visitor_centers', null, function (reply) {
            display_attractions_results(pane_title, reply);
        }, 'json');
    });
    // Parks button clicked
    $('#pane-welcome .welcome-pane-parks a').click(function() {
        pane_title = 'Parks';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(API_BASEPATH + 'ajax/get_reservations', null, function (reply) {
            display_attractions_results(pane_title, reply);
        }, 'json');
    });
    // Activities button clicked
    $('#pane-welcome .welcome-pane-activities a').click(function() {
        set_pane_back_button('#pane-activities', '#pane-welcome');
    });
    // Trails button clicked
    $('#pane-welcome .welcome-pane-trails a').click(function() {
        set_pane_back_button('#pane-trails', '#pane-welcome');
        // Perform trails search upon opening the pane.
        filterLoops();
    });

    /**
     * Display Attractions results from AJAX call.
     */
    display_attractions_results = function(pane_title, reply) {
        // Pane header title
        var header = $('#pane-browse-results h1.sidebar-header .title-text');
        header.text(pane_title);

        sidebar.open('pane-browse-results');

        var target = $('ul#browse_results');
        target.empty();

        // Iterate over fetched results and render them into the target
        for (var i=0, l=reply.results.length; i<l; i++) {
            var result = reply.results[i];

            // List item
            // A lot of attributes to set pertaining to .zoom handling
            var li = $('<li></li>')
                .addClass('zoom')
                .attr('title', result.name)
                .attr('gid',result.gid)
                .attr('record_id',result.record_id)
                .attr('type',result.type)
                .attr('w',result.w)
                .attr('s',result.s)
                .attr('e',result.e)
                .attr('n',result.n)
                .attr('lat',result.lat)
                .attr('lng',result.lng)
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
                    .text(result.name)
                );

            // Inner text
            if (result.note) {
                link.append(
                    $('<span></span>')
                        .addClass('ui-li-desc')
                        .html(result.note)
                    );
            }

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
    };

    /*
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
function geolocateSuccess(position) {
    // Update the user's last known location
    LAST_KNOWN_LOCATION.lng = position.coords.longitude;
    LAST_KNOWN_LOCATION.lat = position.coords.latitude;
}

/**
* If in Native app, trigger geolocation when Cordova's geolocation plugin has come online.
* @TODO: GLJS: Do we need to wait for this to enable ctrlGeolocate?
*/
(function() {
   document.addEventListener("deviceready", basicGeolocate, false);
});

/**
 * Update display of user's lat/lng in Settings pane.
 */
function update_user_latlon_display(latlng) {
    if (!latlng && LAST_KNOWN_LOCATION) {
        latlng = LAST_KNOWN_LOCATION;
    }
    if (latlng) {
        latlng_str = latlng_formatted(latlng)
    } else {
        latlng_str = 'unknown';
    }
    $('#gps_location').val(latlng_str);
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
            var meters = $('#nearby_radius').val();
            var categories = [];
            $('input[name="nearby_category"]:checked').each(
                function () {
                    categories[categories.length] = $(this).val()
                }
            );
            var current_location = mapboxgl.LngLat.convert([event.coords.longitude, event.coords.latitude]);
            placeCircle(current_location, meters);
            checkNearby(current_location, meters, categories);
        }

        // Update display of user lat/lng
        update_user_latlon_display(event.latlng);
    });

    // @TODO: Catch disabling of geolocation control
    //   (which Mapbox GL JS currently doesn't provide a handler for...
    //    see https://github.com/mapbox/mapbox-gl-js/issues/5136 --
    //    there's also a workaround there)
    // and then clearCirle() when we see it.

    // Start constant geolocation, which triggers all of the 'locationfound' events above,
    // unless the user is in the native app, in which case we trigger this when
    // Cordova's geolocation plugin has come online (see "deviceready", above).
    if (!NATIVE_APP) {
        basicGeolocate();
    }
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
 * Launch external app for directions
 * Uses launchnavigator [cordova] plugin.
 */
function launchNativeExternalDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps) {
    var source = [sourcelat, sourcelng],
        target = [targetlat, targetlng];
    // Or reverse
    if (tofrom == 'from') {
        source = [targetlat, targetlng];
        target = [sourcelat, sourcelng];
    }
    options = {
        enableDebug: true,
        transportMode: transportMode
    };
    if (!gps) {
        options.start = source;
    }
    // Car or Transit
    var transportMode = (via == 'bus') ? launchnavigator.TRANSPORT_MODE.TRANSIT : launchnavigator.TRANSPORT_MODE.DRIVING;

    // Launch app
    launchnavigator.navigate(target, options);
}

/**
 * Get directions
 *
 * Part of the Get Directions system:
 * Given lat,lng and lat,lng and route params, request directions from the server
 * then render them to the screen and to the map.
 */
function getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps) {
    // empty out the old directions and disable the button as a visual effect
    $('#directions_steps').empty();
    disableDirectionsButton();

    // store the source coordinates
    $('#directions_source_lat').val(sourcelat);
    $('#directions_source_lng').val(sourcelng);

    // do they prefer fast, short, or weighted?
    var prefer = $('#directions_prefer').val();

    // Launch external map app for native car/transit directions
    if (NATIVE_APP && (via=='car' || via=='bus')) {
        launchNativeExternalDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps);
        enableDirectionsButton();
        return;
    }

    // make up the params and run the request
    var params = {
        sourcelat: sourcelat,
        sourcelng: sourcelng,
        targetlat: targetlat,
        targetlng: targetlng,
        tofrom: tofrom,
        via: via,
        prefer: prefer,
        bing_key: BING_API_KEY
    };
    $.get(API_BASEPATH + 'ajax/directions', params, function (reply) {
        enableDirectionsButton();

        if (! reply || ! reply.wkt) {
            var message = "Could not find directions.";
            if (via != 'hike') message += "\nTry a different type of trail, terrain, or difficulty.";
            return alert(message);
        }
        renderDirectionsStructure(reply);
    }, 'json');
}

/**
 * Disable directions button
 */
function disableDirectionsButton() {
    var button = $('#directions_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text(button.attr('value0'));
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    var button = $('#directions_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text(button.attr('value1'));
}

/**
 * Process Get Directions form
 *
 * This wrapper checks the directions_type field and other Get Directions fields,
 * decides what to use for the address field and the other params,
 * then calls either getDirections() et al
 */
function processGetDirectionsForm() {
    var tofrom    = $('#directions_reverse').val();
    // Transportation mode
    var via       = $('#directions_via').val();

    if (via == 'bike') {
        // Ability level for bike
        via = $('#directions_via_bike').val();
    }

    // empty these fields because we probably don't need them
    // they will be repopulated in the 'feature' switch below if we're routing to a Park Feature
    $('#directions_source_gid').val('');
    $('#directions_source_type').val('');

    // Use synchronous AJAX so the location finding happens in the required order
    // @TODO: Synchronous XMLHttpRequest is deprecated
    $.ajaxSetup({ async:false });

    // figure out the source: address geocode, latlon already properly formatted, current GPS location, etc.
    // Done before the target is resolved (below) because resolving the target can mean weighting based on the starting point
    // e.g. directions to parks/reservations pick the closest entry point to our starting location
    var sourcelat, sourcelng;
    var addresstype = $('#directions_type').val();

    // If we're routing from the user's current location
    var gps = false;

    switch (addresstype) {
        case 'gps':
            gps = true;
            sourcelat = LAST_KNOWN_LOCATION.lat;
            sourcelng = LAST_KNOWN_LOCATION.lng;
            break;

        case 'geocode':
            var address  = $('#directions_address').val();
            if (! address) {
                return alert("Please enter an address, city, or landmark.");
            }
            // regional assumption in this regular expression: negative lng, positive lat:
            var is_coords = /^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(address);
            if (is_coords) {
                sourcelat = parseFloat(is_coords[1]);
                sourcelng = parseFloat(is_coords[2]);
                getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via);
            } else {
                disableDirectionsButton();
                var params = {};
                params.address  = address;
                params.bing_key = BING_API_KEY;
                params.bbox     = GEOCODE_BIAS_BOX;
                $.get(API_BASEPATH + 'ajax/geocode', params, function (result) {
                    enableDirectionsButton();
                    if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
                    sourcelat = result.lat;
                    sourcelng = result.lng;

                    // if the address is outside of our max bounds, then we can't possibly do a Trails
                    // search, and driving routing would still be goofy since it would traverse area well off the map
                    // in this case, warn them that they should use Bing Maps, and send them there
                    var sourceLngLat = new mapboxgl.LngLat(sourcelng, sourcelat);
                    if (!MAX_BOUNDS.contains(sourceLngLat)) {
                        var from = 'adr.' + address;
                        var to   = 'pos.' + targetlat + '_' + targetlng;
                        var params = {
                            rtp : from+'~'+to,
                        };
                        var gmapsurl = 'http://bing.com/maps/default.aspx' + '?' + $.param(params);
                        var target = $('#directions_steps');
                        target.empty();
                        target.append( $('<div></div>').html("The address you have chosen is outside of the covered area.<br/>Click the link below to go to Bing Maps for directions.") );
                        target.append( $('<a></a>').text("Click here for directions from Bing Maps").prop('href',gmapsurl).prop('target','_blank') );
                        return;
                    }
                },'json');
            }
            break;

        case 'features':
            disableDirectionsButton();
            var params = {};
            params.keyword = $('#directions_address').val();
            params.limit   = 30 ;
            params.lat     = LAST_KNOWN_LOCATION.lat;
            params.lng     = LAST_KNOWN_LOCATION.lng;
            params.via     = via;

            $.get(API_BASEPATH + 'ajax/keyword', params, function (reply) {
                enableDirectionsButton();
                if (! reply || !reply.length) return alert("We couldn't find any matching landmarks.");

                // go over the results and see if any have an exact match for this name; if so, then call that our one and only result
                // if there's still more than 1 match,  then multiple ambiguous results. print a Did You Mean listing
                var matchme = $('#directions_address').val().replace(/\W/g,'').toLowerCase();
                for (var i=0, l=reply.length; i<l; i++) {
                    var stripped = reply[i].name.replace(/\W/g,'').toLowerCase();
                    if (stripped == matchme) {
                        reply = [ reply[i] ];
                        break;
                    }
                }
                if (reply.length > 1) {
                    sourcelat = null;
                    sourcelng = null;
                    populateDidYouMean(reply);
                    return;
                }

                // great, one single match
                // swap out their stated location name for this one, so they know where we're taking them
                // then populate the location from the reply
                var placename = reply[0].name.replace(/^\s*/,'').replace(/\s*$/,'');
                $('#directions_address').val(placename);

                // fill in the GID and Type so we can do more intelligent routing, e.g. destination points for POIs
                $('#directions_source_gid').val(reply[0].gid);
                $('#directions_source_type').val(reply[0].type);

                sourcelat = parseFloat(reply[0].lat);
                sourcelng = parseFloat(reply[0].lng);
            },'json');
            if (! sourcelat || ! sourcelng) {
                return;
            }
            break;
    } // end addresstype switch

    // now get this: sometimes we don't actually route between these two points, but use the type & gid to
    // find the closest target points, e.g. the closest entry gate at a Reservation, or a parking lot for a POI
    // do this for both the Target (the chosen location before the Directions panel opened)
    // and for the Source (whatever address or park feature they entered/selected as the other endpoint)
    var targetlat = parseFloat( $('#directions_target_lat').val() );
    var targetlng = parseFloat( $('#directions_target_lng').val() );

    // Get the source location
    var source_gid  = $('#directions_source_gid').val();
    var source_type = $('#directions_source_type').val();
    if (source_type == 'poi'
        || source_type == 'attraction'
        || source_type == 'reservation'
        || source_type == 'trail')
    {
        var source_loc = geocodeLocationForDirections(source_type, source_gid, targetlat, targetlng, via, '#directions_source_lat', '#directions_source_lng');
        sourcelat = source_loc.lat;
        sourcelng = source_loc.lng;
    }

    // Get the target location
    var target_gid  = $('#directions_target_gid').val();
    var target_type = $('#directions_target_type').val();
    if (target_type == 'poi'
        || target_type == 'attraction'
        || target_type == 'reservation'
        || target_type == 'trail')
    {
        var target_loc = geocodeLocationForDirections(target_type, target_gid, sourcelat, sourcelng, via, '#directions_target_lat', '#directions_target_lng');
        targetlat = target_loc.lat;
        targetlng = target_loc.lng;
    }

    if (! targetlat || ! targetlng) {
        return alert("Please close the directions panel, and pick a location.");
    }

    // Re-enable asynchronous AJAX
    $.ajaxSetup({ async:true });

    getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps);
}

/**
 * Geocode location for directions
 * For type: poi, attraction, reservation, and trail
 */
function geocodeLocationForDirections(loc_type, loc_gid, lat, lng, via, lat_el_id, lng_el_id) {
    var output_location = new Object();
    var params = {
        type : loc_type,
        gid : loc_gid,
        // If this data source uses weighting, this will pick the closest one to our starting location
        lat : lat,
        lng : lng,
        via : via
    };
    $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
        output_location.lat = reply.lat;
        output_location.lng = reply.lng;

        // Save them into the input fields too, so they'd get shared
        $(lat_el_id).val(reply.lat);
        $(lng_el_id).val(reply.lng);
    }, 'json');
    return output_location;
}

/**
 * Populate "Did you mean:?"
 */
function populateDidYouMean(results) {
    var target = $('#directions_steps');
    target.empty();

    // Item 0 is not a result, but the words "Did you mean:"
    var item = $('<li></li>')
        //.append( $('<span></span>')
        .addClass('did-you-mean')
        .text("Did you mean:");
    target.append(item);

    // add the results as a list; each item has a click handler, to populate the address box with the proper name
    for (var i=0, l=results.length; i<l; i++) {
        var result = results[i];
        var placename = result.name.replace(/^\s*/,'').replace(/\s*$/,'');

        var item = $('<li></li>');
        item.append( $('<span></span>').addClass('ui-li-heading').text(placename) ).attr('type',result.type).attr('gid',result.gid);

        var tapToFill = function () {
            $('#directions_address').val( $(this).text() );
            $('#directions_source_gid').val( $(this).attr('gid') );
            $('#directions_source_type').val( $(this).attr('type') );
            $('#directions_button').click();
        };
        item.click(tapToFill);

        item.css({ cursor:'pointer' }); // more for Desktop

        target.append(item);
    }

    target.listview('refresh');
}

/**
 * Render directions structure
 */
function renderDirectionsStructure(directions, target, options) {
    // no options, no problem
    if (! options) options = {};

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
    if (! target) {
        target = $('#directions_steps');
    }
    target.empty();

    for (var i=0, l=directions.steps.length; i<l; i++) {
        var step     = directions.steps[i];
        var li       = $('<li></li>');
        var title    = step.stepnumber ? step.stepnumber + '. ' + ( step.turnword ? step.turnword : '') + ' ' + step.text : step.turnword + ' ' + step.text;
        li.append( $('<span></span>').addClass('ui-li-heading').text(title) );
        if (step.distance && step.duration && step.distance.substr(0,1)!='0') {
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

    var directionsFunctions = $('<div></div>').addClass('directions_functions');

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
                openElevationProfileBySegments();
            });

        directionsFunctions.append(elevationProfileBtn);
    }

    // Clear button
    var clearMapBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .text('Clear');
    clearMapBtn.click(function () {
        $('#directions_steps').empty();
        clearDirectionsLine();
        $('.directions_functions').empty();
    });
    directionsFunctions.append(clearMapBtn);

    // Share button
    var shareRouteBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .prop('id','share_route_button')
        .text('Share');
    shareRouteBtn.click(function () {
        updateWindowURLWithDirections();
        makeAndShowShortURL();
        sidebar.open('pane-share');
    });
    directionsFunctions.append(shareRouteBtn);

    // Print button
    if (! NATIVE_APP) {
        var printMeBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .text('Print');
        printMeBtn.click(function () {
            $('#button_print').click();
        });
        directionsFunctions.append(printMeBtn);
    }
    target.after(directionsFunctions);

    // phase 3: save the elevation profile given, if any, so it can be recalled later
    ELEVATION_PROFILE = [];
    if (directions.elevationprofile) {
        ELEVATION_PROFILE = directions.elevationprofile;
    }

    // phase 4: any additional postprocessing
    // give the list that jQuery Mobile magic
    target.listview('refresh');
    // jQM assigns this class, screwing up the position & size of the first button IMG:
    $('.directions_functions img:first').removeClass('ui-li-thumb');
}

/**
 * Draw directions line
 *
 * @param polyline {geojson}
 */
function drawDirectionsLine(polyline, from, to) {
    clearDirectionsLine();

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

    placeMarker(MARKER_START, from.lat, from.lng);
    placeMarker(MARKER_END, to.lat, to.lng);
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

    clearMarker(MARKER_START);
    clearMarker(MARKER_END);

    // @TODO: Check this...
    // and both the Directions and Measure need their content erased, so they aren't confused with each other
    // don't worry, clearDirectionsLine() is always a prelude to repopulating one of these
    //
    $('#directions_steps').empty();
    $('#measure_steps').empty();
}

/**
 * Event handlers for the directions subsystem
 */
$(document).ready(function () {
    // The 4 icons launch the Get Directions panel
    // selecting the appropriate transport method
    $('#directions_hike').click(function () {
        launchGetDirections('hike');
    });
    $('#directions_bike').click(function () {
        launchGetDirections('bike');
    });
    $('#directions_bridle').click(function () {
        launchGetDirections('bridle');
    });
    $('#directions_car').click(function () {
        launchGetDirections('car');
    });
    $('#directions_bus').click(function () {
        launchGetDirections('bus');
    });

    /**
     * Launch Get Directions
     */
    function launchGetDirections(transport_method) {
        $('#directions_via').val(transport_method);
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        // $('#pane-getdirections').page(); // @TODO: GLJS. Still necessary?
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        sidebar.open('pane-getdirections');
    }

    // the directions-type picker (GPS, address, POI, etc) mostly shows and hides elements
    // its value is used in processGetDirectionsForm() for choosing how to figure out which element to use
    $('#directions_type').change(function () {
        var which  = $(this).val();
        var target = $('#directions_type_geocode_wrap');
        if (which == 'gps') {
            target.hide();
        } else {
            target.show();
        }
    });

    // The To/From selector should update all of the selector options to read To XXX and From XXX
    $('#directions_reverse').change(function () {
        var tofrom = $(this).val() == 'to' ? 'from' : 'to';
        $('#directions_type option').each(function () {
            var text = $(this).text();
            text = tofrom + ' ' + text.replace(/^to /i, '').replace(/^from /i, '');
            $(this).text(text);
        });
        $('#directions_type').selectmenu('refresh', true)
    });

    // This button triggers a geocode and directions, using the common.js interface
    $('#directions_button').click(function () {
        $('#directions_steps').empty();
        $('.directions_functions').remove();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    // The Change Directions buttons switch to the Find pane, so the user can choose a destination
    $('.change_directions_link').click(function () {
        sidebar.open('pane-browse');
        // Set this flag to make zoomElementClick() skip showing the feature info,
        // simply injecting it into directions.
        SKIP_TO_DIRECTIONS = true;
    });
});

/**
 * Open elevation profile by segments
 */
function openElevationProfileBySegments() {
    if (! ELEVATION_PROFILE) return;

    // The vertices have horizontal and vertical info (feet and elev). make a pair of arrays
    var x = [];
    var y = [];
    for (var i=0, l=ELEVATION_PROFILE.length; i<l; i++) {
        x[x.length] = ELEVATION_PROFILE[i].x;
        y[y.length] = ELEVATION_PROFILE[i].y;
    }
    x = x.join(',');
    y = y.join(',');

    $.post(API_BASEPATH + 'ajax/elevationprofilebysegments', { 'x':x, 'y':y }, function (url) {
        if (url.indexOf('http') != 0) return alert(url);
        showElevation(url);
    });
}

/**
 * the directions button does an async geocode on the address,
 * then an async directions lookup between the points,
 * then draws the polyline path and prints the directions
 */
$(document).ready(function () {
    $('#getdirections_clear').click(function () {
        clearDirectionsLine();
        $('#directions_steps').empty();
    });

    // Selecting "By Trail", "By Car", etc. shows & hides the second filter, e.g. paved/unpaved for "By foot" only
    $('#directions_via').change(function () {
        // hide all secondaries
        $('#directions_via_bike_wrap').hide();

        // now show the appropriate one (if any, only for Bike: basic/advanced; formerly Hike had paved status as a picker)
        var which = $(this).val();
        switch (which) {
            case 'bike':
                $('#directions_via_bike_wrap').show();
                break;
            case 'hike':
                break;
            case 'car':
                break;
            default:
                break;
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
 * - At a later time, when the user opens up the share panel, an AJAX request
 *   is made to save the long URL and get a short URL in return.
 * - This short URL is displayed in the #share_url panel for the end user.
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
    var baseUrl = '/';
    var queryString;

    if (NATIVE_APP) {
        // WINDOW_URL includes a lot of extra stuff in the basepath in native,
        // so we also keep track of just the query string
        queryString = WINDOW_URL_QUERYSTRING;
    } else {
        queryString = WINDOW_URL;
        // Remove leading '/?'
        if (queryString.charAt(0) == '/') {
            queryString = queryString.substr(1);
        }
        if (queryString.charAt(0) == '?') {
            queryString = queryString.substr(1);
        }
    }

    // submit the long URL param string to the server, get back a short param string
    var params = {
        uri : baseUrl,
        querystring : queryString
    };
    $.get(API_BASEPATH + 'ajax/make_shorturl', params, function(shortURLString) {
        if (!shortURLString) {
            return alert("Unable to fetch a short URL.\nPlease try again.");
        }

        // In native mobile, our URL structure is not as in web
        var url = new URL(location.href);
        var protocol =
            (url.protocol != 'file:')
            ? url.protocol
            : WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL;
        var host = (url.host)
            ? url.host
            : WEBAPP_BASE_URL_ABSOLUTE_HOST;

        var shareUrl = protocol + '//' + host + '/url/' + shortURLString;

        $('#share_url').val(shareUrl);
        showShareURL();
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
 * Update Share URL by Directions
 *
 * Directions form: processes the directions form and fills in the Share to recreate the route
 */
function updateWindowURLWithDirections() {
    // If the directions aren't filled in, we can't do this.
    if (! $('#directions_source_lat').val() ) return;

    // Compose the params to bring up this route at page load:
    // route title, to and from coordinates, via type, etc.
    var params = {};

    if (getBasemap() == 'photo') {
        params.base = 'photo';
    } else {
        params.base = 'map';
    }
    params.routevia        = $('#directions_via').val();
    params.routevia_bike   = $('#directions_via_bike').val();
    params.routefrom       = $('#directions_source_lat').val() + ',' + $('#directions_source_lng').val();
    params.routeto         = $('#directions_target_lat').val() + ',' + $('#directions_target_lng').val();
    params.routetitle      = $('#directions_target_title').text();
    params.whichway        = $('#directions_reverse').val();
    params.loctype         = $('#directions_type').val();
    params.fromaddr        = $('#directions_address').val();
    if (params.routevia == 'trail') {
        params.routevia = $('#directions_via_trail').val();
    }

    setWindowURLQueryStringParameters(params, true, true);
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

        if (!NATIVE_APP) {
            // focus() and select() the input
            $textInput.focus();
            $textInput.select();
            // setSelectionRange() for readonly inputs on iOS
            $textInput[0].setSelectionRange(0, 9999);
            // Copy
            document.execCommand("copy");
        } else {
            cordova.plugins.clipboard.copy($textInput.val());
        }

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

    $.get(API_BASEPATH + 'ajax/keyword', { keyword:keyword, limit:100 }, function (reply) {
        enableKeywordButton();
        $('#pane-search .sortpicker').show();

        if (! reply.length) {
            // No matches. Pass on to an address search, and say so.
            $('<li></li>').text('No Cleveland Metroparks results found. Trying an address search.').appendTo(target);
            zoomToAddress(keyword);
            return;
        }

        for (var i=0, l=reply.length; i<l; i++) {
            var result = reply[i];

            var li = $('<li></li>')
                .addClass('zoom')
                .addClass('ui-li-has-count');

            li.attr('title', result.name)
                .attr('gid', result.gid)
                .attr('type', result.type)
                .attr('w', result.w)
                .attr('s', result.s)
                .attr('e', result.e)
                .attr('n', result.n)
                .attr('lat', result.lat)
                .attr('lng', result.lng);

            li.attr('backbutton', '#pane-search');

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
            // Subtitle: type
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .text(result.description)
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

        // finally, have jQuery Mobile do its magic, then trigger distance calculation and sorting
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}

/**
 * Load autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
 */
$(document).ready(function () {
    $.get(API_BASEPATH + 'ajax/autocomplete_keywords', {}, function (words) {

        $.each(words, function(index, value) {
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

    },'json');
});

;
/*********************************************
 * Nearby
 *********************************************/

// ALL_POIS:
//
// Used by "Near You Now" and then later by Nearby, a structure of all POIs
// we cannot render them all into the Nearby pane at the same time, but we can store them in memory
//
// Each item within has:
//     from DB:
//         lat, lng, title, categories, n, s, e, w
//     and computed:
//         meters, miles, feet, range, bearing
var ALL_POIS = [];

/**
 * Load all POIs via AJAX on window load,
 *
 * but don't render them into the DOM yet.
 * Rendering to DOM is done later by updateNearYouNow() to do only the
 * closest few POIs, so we don't overload.
 */
$(document).ready(function () {
    $.get(API_BASEPATH + 'ajax/load_pois', {}, function (pois) {
        for (var i=0, l=pois.length; i<l; i++) {
            ALL_POIS[ALL_POIS.length] = pois[i];
        }
        updateNearYouNow();
    }, 'json');
});

/**
 * Convert from Turf.js point to Mapbox GL JS LngLat
 *
 * @param {turf.point} point
 *
 * @return {mapboxgl.LngLat}
 */
function turfPointToLngLat(point) {
    return new mapboxgl.LngLat.convert(point.geometry.coordinates);
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
 * Update Near You Now
 *
 * update the Near You Now listing from ALL_POIS; called on a location update
 * this is a significant exception to the sortLists() system,
 * as we need to do the distance and sorting BEFORE rendering, an unusual case
 */
function updateNearYouNow() {
    var target = $('#alerts');

    // iterate over ALL_POIS and calculate their distance from our last known location
    // poi.meters   poi.miles   poi.feet   poi.range
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi       = ALL_POIS[i];
        var destpoint = new mapboxgl.LngLat(poi.lng, poi.lat);

        poi.meters    = distanceTo(LAST_KNOWN_LOCATION, destpoint);
        poi.miles     = poi.meters / 1609.344;
        poi.feet      = poi.meters * 3.2808399;
        poi.range     = (poi.feet > 900) ? poi.miles.toFixed(1) + ' mi' : poi.feet.toFixed(0) + ' ft';

        poi.bearing   = bearingToInNESW(LAST_KNOWN_LOCATION, destpoint);
    }

    // sort ALL_POIS by distance, then take the first (closest) few
    ALL_POIS.sort(function (p,q) {
        return p.meters - q.meters;
    });
    var render_pois = ALL_POIS.slice(0,25);

    // go over the rendering POIs, and render them to DOM
    target.empty();
    for (var i=0, l=render_pois.length; i<l; i++) {
        var poi = render_pois[i];

        var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
        li.attr('title', poi.title);
        li.attr('category', poi.categories);
        li.attr('type', 'poi').attr('gid', poi.gid);
        li.attr('w', poi.w).attr('s', poi.s).attr('e', poi.e).attr('n', poi.n);
        li.attr('lat', poi.lat).attr('lng', poi.lng);
        li.attr('backbutton', '#pane-nearby');

        var div = $('<div></div>').addClass('ui-btn-text');
        div.append( $('<h2></h2>').text(poi.title) );
        div.append( $('<p></p>').text(poi.categories) );
        div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(poi.range + ' ' + poi.bearing) );

        // On click, call zoomElementClick() to load more info
        li.click(function () {
            zoomElementClick( $(this) );
        });

        li.append(div);
        target.append(li);
    }

    // done loading POIs, refresh the styling magic
    target.listview('refresh');
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

    // iterate over ALL_POIS and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi = ALL_POIS[i];
        var poiLngLat = new mapboxgl.LngLat(poi.lng, poi.lat);
        var meters = distanceTo(lngLat, poiLngLat);

        // filter: distance
        if (meters > maxMeters) continue;

        // filter: category
        if (categories) {
            var thesecategories = poi.categories.split("; ");
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
        alerts[alerts.length] = { gid:poi.gid, title:poi.title, range:range };
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
        enabled ? $('#nearby_config').show() : $('#nearby_config').hide();

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
 * loopsandroutes.js
 *
 * JS for loops and routes functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Event handlers for Loops listing and filtering
 *
 * @see also filterLoops() below
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
        filterLoops();
    //}).first().click();
    });

    // Reservation <select>
    $('#loops_filter_reservation').change(function () {
        // Perform search
        filterLoops();
    })

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();
    $('#loops_filter_duration_min').change();
    $('#loops_filter_duration_max').change();

    // the loop type selector doesn't filter immediately,
    // but it does show/hide the time slider and the time estimates for each loop,
    // since the estimate of time is dependent on the travel mode
    $('#loops_filter_type').change(function () {
        var type = $(this).val();

        // show/hide the time filter slider
        /* May 2014 we never show this
        var timeslider = $('#loops_filter_duration');
        type ? timeslider.show() : timeslider.hide();
        */

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
        filterLoops();
    });
});

/**
 * Featured Routes list
 */
function filterLoops() {
    $('#loops_list li').show();

    var params = {};
    params.filter_type  = $('#loops_filter_type').val();
    params.filter_paved = $('#loops_filter_paved').val();
    params.minseconds   = 60 * parseInt( $('#loops_filter_duration_min').val() );
    params.maxseconds   = 60 * parseInt( $('#loops_filter_duration_max').val() );
    params.minfeet      = 5280 * parseInt( $('#loops_filter_distance_min').val() );
    params.maxfeet      = 5280 * parseInt( $('#loops_filter_distance_max').val() );
    params.reservation  = $('#loops_filter_reservation').val();

    $.get(API_BASEPATH + 'ajax/search_loops', params, function (results) {
        // find and empty the target UL
        var target = $('#loops_list');
        target.empty();

        // No results text
        $('.results-notes').remove();
        if (! results || ! results.length) {
            var markup = '<p class="results-notes">No results.</p>';
            target.after(markup);
        }

        // iterate over the results, add them to the output
        for (var i=0, l=results.length; i<l; i++) {
            var result = results[i];

            var li = $('<li></li>')
                .addClass('zoom')
                .addClass('ui-li-has-count');

            li.attr('title', result.title)
                .attr('gid', result.gid)
                .attr('type','loop')
                .attr('w', result.w)
                .attr('s', result.s)
                .attr('e', result.e)
                .attr('n', result.n)
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
                    .text(result.title)
            );
            // Inner text
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .html(result.distance + ' &nbsp;&nbsp; ' + result.duration)
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
    }, 'json');
}
