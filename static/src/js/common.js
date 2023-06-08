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
    if (TRAILVIEW_ENABLED === true) {
        MAP.on('style.load', () => {
            addTrailViewMapLayer();
        })
    }
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
