 /**
 * common.js
 *
 * JS for common app functionality.
 *
 * Cleveland Metroparks
 */

var isMobile = /Mobi/.test(navigator.userAgent); // Simple mobile device detection.

// Target marker
var markerTargetEl = document.createElement('div');
markerTargetEl.id = 'marker-target';
var markerTargetIconWidth = 25; // Must match sizing in CSS for #marker-target
var markerTargetIconHeight = 41; // Must match sizing in CSS for #marker-target
var MARKER_TARGET = new mapboxgl.Marker(markerTargetEl, {offset: [-markerTargetIconWidth/2, -markerTargetIconHeight]});

// Geolocation marker
var markerGpsEl = document.createElement('div');
markerGpsEl.id = 'marker-gps';
var markerGpsIconSize = 16; // Must match sizing in CSS for #marker-gps
var MARKER_GPS = new mapboxgl.Marker(markerGpsEl, {offset: [-markerGpsIconSize/2, -markerGpsIconSize/2]});

// "From" marker (for directions)
var markerFromEl = document.createElement('div');
markerFromEl.id = 'marker-from';
var markerFromIconWidth = 20; // Must match sizing in CSS for #marker-from
var markerFromIconHeight = 34; // Must match sizing in CSS for #marker-from
var MARKER_FROM = new mapboxgl.Marker(markerFromEl, {offset: [-markerFromIconWidth/2, -markerFromIconHeight]});

// "To" marker (for directions)
var markerToEl = document.createElement('div');
markerToEl.id = 'marker-to';
var markerToIconWidth = 20; // Must match sizing in CSS for #marker-to
var markerToIconHeight = 34; // Must match sizing in CSS for #marker-to
var MARKER_TO = new mapboxgl.Marker(markerToEl, {offset: [-markerToIconWidth/2, -markerToIconHeight]});

var ELEVATION_PROFILE = null;

var HIGHLIGHT_LINE = null;
var HIGHLIGHT_LINE_STYLE = { color:"#01B3FD", weight:6, opacity:0.75, clickable:false, smoothFactor:0.25 };

var ENABLE_MAPCLICK = true; // a flag indicating whether to allow click-query; on Mobile we disable it after switchToMap()

var SKIP_TO_DIRECTIONS = false; // should More Info skip straight to directions? usually not, but there is one button to make it so

var SETTINGS = [];
SETTINGS.coordinate_format = 'dms';

/**
 * Initialize the map
 *
 * The business. (And too much of it.)
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
         center: [START_LON, START_LAT],
         zoom: START_ZOOM
     });

    // Nav (zoom/tilt) Control
    var ctrlNav = new mapboxgl.NavigationControl();
    MAP.addControl(ctrlNav, 'bottom-right');

    // Geolocate control
    var ctrlGeolocate = new mapboxgl.GeolocateControl({
       positionOptions: {
           trackUserLocation: true,
           showUserLocation: true,
           enableHighAccuracy: true
       }
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
 * Line WKT to Feature
 *
 * decode a WKT geometry into a feature, e.g. LINESTRING(12 34, 56 78) to L.Polyline instance
 * params are the WKT string, and the other options to pass to the constructor (e.g. color style and other Path options)
 */
function lineWKTtoFeature(wkt, style) {
    var parser = new Wkt.Wkt();
    parser.read(wkt);
    return parser.toObject(style);
}

/**
 * Place "target" (normal) marker
 */
function placeTargetMarker(lat, lng) {
    MARKER_TARGET
        .setLngLat([lng, lat])
        .addTo(MAP);
}

/**
 * Clear "target" (normal) marker
 */
function clearTargetMarker() {
    MARKER_TARGET.remove();
}

/**
 * Place GPS (geolocated) marker
 */
function placeGPSMarker(lat, lng) {
    MARKER_GPS
        .setLngLat([lng, lat])
        .addTo(MAP);
}

/**
 * Clear GPS (geolocated) marker
 */
function clearGPSMarker() {
    MARKER_GPS.remove();
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
