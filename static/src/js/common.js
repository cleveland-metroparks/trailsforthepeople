 /**
 * common.js
 *
 * JS for common app functionality.
 *
 * Cleveland Metroparks
 */

var isMobile = /Mobi/.test(navigator.userAgent); // Simple mobile device detection.

var ICON_TARGET = L.icon({
    iconUrl: WEBAPP_BASEPATH + 'static/images/markers/marker-target.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ],
    popupAnchor: [ 0, -41 ]
});
var MARKER_TARGET = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_TARGET });

var ICON_GPS = L.icon({
    iconUrl: WEBAPP_BASEPATH + 'static/images/markers/marker-gps.svg',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ],
    popupAnchor: [ 0, -41 ]
});
var MARKER_GPS     = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_GPS });

var ICON_FROM = L.icon({
    iconUrl: WEBAPP_BASEPATH + 'static/images/markers/measure1.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var ICON_TO = L.icon({
    iconUrl: WEBAPP_BASEPATH + 'static/images/markers/measure2.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var MARKER_FROM  = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_FROM });
var MARKER_TO    = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_TO });

var INFO_POPUP_OPTIONS = {
    'className' : 'info-popup'
};
var INFO_POPUP = L.popup(INFO_POPUP_OPTIONS);

var CIRCLE = new L.Circle(L.latLng(0,0), 1);

var ELEVATION_PROFILE = null;

var HIGHLIGHT_LINE = null;
var HIGHLIGHT_LINE_STYLE = { color:"#1F6ABD", weight:3, opacity:0.75, clickable:false, smoothFactor:0.25 };

var ENABLE_MAPCLICK = true; // a flag indicating whether to allow click-query; on Mobile we disable it after switchToMap()

var SKIP_TO_DIRECTIONS = false; // should More Info skip straight to directions? usually not, but there is one button to make it so

var SETTINGS = [];
SETTINGS.coordinate_format = 'dms';

/**
 * Initialize the map
 *
 * The business. (And too much of it.)
 */
function initMap (mapOptions) {
    // URL param: the base map; defaults to map (vs satellite)
    var base = mapOptions.base || 'map';

    var basemap; // which L.TileLayer instance to use?
    switch (base) {
        case 'photo':
            basemap = LAYER_MAPBOX_SAT;
            break;
        case 'map':
        default:
            // Use raster tiles on mobile for now, until we sort out Leaflet-GL zooming and marker issues.
            if (isMobile) {
                basemap = LAYER_MAPBOX_MAP;
            } else {
                basemap = LAYER_MAPBOX_GL_MAP;
            }
            break;
    }

    // start the map, only the basemap for starters
    // do some detection of browser to find Android 4+ and override the animation settings, hoping to enable pinch-zoom without breaking the app entirely
    // this is specifically contraindicated by Leaflet's own feature detection
    var options = {
        attributionControl: false,
        zoomControl: false, // add manually, below
        dragging: true,
        closePopupOnClick: false,
        crs: L.CRS.EPSG3857,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomSnap: 0, // fractional zoom
        layers : [ basemap ]
    };
    var android4 = navigator.userAgent.match(/Android (4|5)/);
    if (android4) {
        options.fadeAnimation       = true;
        options.zoomAnimation       = true;
        options.markerZoomAnimation = true;
    }

    MAP = new L.Map('map_canvas', options);
    new L.Control.Zoom({ position: 'bottomright' }).addTo(MAP);

    // zoom to the XYZ given in the URL, or else to the max extent
    if (mapOptions.x && mapOptions.y && mapOptions.z) {
        var x = parseFloat(mapOptions.x);
        var y = parseFloat(mapOptions.y);
        var z = parseInt(mapOptions.z);
        MAP.setView(L.latLng(y,x),z);

        MAP.addLayer(MARKER_TARGET);
        MARKER_TARGET.setLatLng(L.latLng(y,x));
    } else {
        MAP.fitBounds(MAX_BOUNDS);
    }

    // additional Controls
    L.control.scale().addTo(MAP);

    // Fire mapInitialized event
    $.event.trigger({
        type: 'mapInitialized',
    });

    // debugging: when the viewport changes, log the current bbox and zoom
    function debugBoundsOutput() {
        console.log([ 'zoom', MAP.getZoom() ]);
        console.log([ 'center', MAP.getCenter() ]);
        console.log([ 'bounds', MAP.getBounds() ]);
    }
    function debugScaleZoomOutput() {
        var DOTS_PER_INCH    = 72;
        var INCHES_PER_METER = 1.0 / 0.02540005080010160020;
        var INCHES_PER_KM    = INCHES_PER_METER * 1000.0;
        var sw       = MAP.getBounds().getSouthWest();
        var ne       = MAP.getBounds().getNorthEast();
        var halflng   = ( sw.lng + ne.lng ) / 2.0;
        var midBottom = L.latLng(sw.lat,halflng);
        var midTop    = L.latLng(ne.lat,halflng);
        var mheight   = midTop.distanceTo(midBottom);
        var pxheight  = MAP.getSize().x;
        var kmperpx   = mheight / pxheight / 1000.0;
        var scale    = Math.round( (kmperpx || 0.000001) * INCHES_PER_KM * DOTS_PER_INCH );
        scale *= 2.0; // no idea why but it's doubled
        scale = 1000 * Math.round(scale / 1000.0); // round to the nearest 100 so we can fit MapFish print's finite set of scales
        console.log([ 'zoom & scale' , MAP.getZoom(), scale ]);
    }
    //MAP.on('moveend', debugBoundsOutput);
    //MAP.on('zoomend', debugBoundsOutput);
    //MAP.on('moveend', debugScaleZoomOutput);
    //MAP.on('zoomend', debugScaleZoomOutput);

    // our version of a WMS GetFeatureInfo control: a map click calls query.php to get JSON info, and we construct a bubble
    // BUT, we only call this if a popup is not open: if one is open, we instead close it
    MAP.on('click', function (event) {
        // are we ignoring click behaviors for the moment?
        if (! ENABLE_MAPCLICK) return;

        // is there a popup currently visible? If so, no query at all but close the popup and bail
        // sorry, Leaflet: closePopupOnClick doesn't work for this cuz it clears the popup before we get the click
        if ($('.leaflet-popup').length) {
            return MAP.closePopup();
        }

        // got here? good, do a query
        wmsGetFeatureInfoByPoint(event.layerPoint);
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
function placeTargetMarker(lat, lon) {
    MAP.addLayer(MARKER_TARGET);
    MARKER_TARGET.setLatLng(L.latLng(lat,lon));
}

/**
 * Clear "target" (normal) marker
 */
function clearTargetMarker() {
    if (MAP.hasLayer(MARKER_TARGET)) {
        MAP.removeLayer(MARKER_TARGET);
    }
}

/**
 * Place GPS (geolocated) marker
 */
function placeGPSMarker(lat, lon) {
    MAP.addLayer(MARKER_GPS);
    MARKER_GPS.setLatLng(L.latLng(lat,lon));
}

/**
 * Clear GPS (geolocated) marker
 */
function clearGPSMarker() {
    MAP.removeLayer(MARKER_GPS);
}

/**
 * Show informational popup
 */
function showInfoPopup(message, type) {
    MAP.removeLayer(INFO_POPUP);
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
    INFO_POPUP = L.popup({className : classes})
        .setLatLng(MAP.getCenter())
        .setContent(message)
        .openOn(MAP);
}

/**
 * Clear informational popup
 */
function clearInfoPopup() {
    MAP.removeLayer(INFO_POPUP);
    INFO_POPUP.options.className
}

/**
 * WMS Get feature info by point
 */
function wmsGetFeatureInfoByPoint(pixel) {
    var pixelbuffer = 20;
    var sw = MAP.layerPointToLatLng(new L.Point(pixel.x - pixelbuffer , pixel.y + pixelbuffer));
    var ne = MAP.layerPointToLatLng(new L.Point(pixel.x + pixelbuffer , pixel.y - pixelbuffer));
    var bbox   = { w:sw.lng, s: sw.lat, e:ne.lng , n:ne.lat };
    var anchor = MAP.layerPointToLatLng(new L.Point(pixel.x,pixel.y));
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

/**
 * WMS Get feature info by lat/lng
 */
function wmsGetFeatureInfoByLatLng(latlng) {
    var bbox   = { w:latlng.lng, s: latlng.lat, e:latlng.lng , n:latlng.lat };
    var anchor = latlng;
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

/**
 * WMS Get feature info by lat/lng BBOX
 */
function wmsGetFeatureInfoByLatLngBBOX(bbox,anchor) {
    var data = bbox;
    data.zoom = MAP.getZoom();

    $.get(API_BASEPATH + 'ajax/query', data, function (html) {
        if (!html) return;

        // set up the Popup and load its content
        // beware of very-lengthy content and force a max height on the bubble
        var options = {};
        options.maxHeight = parseInt( $('#map_canvas').height() );
        options.maxWidth = parseInt( $('#map_canvas').width() );
        var popup = new L.Popup(options);
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
}

/**
 * Map canvas resize handler
 *
 * When window is resized, trigger a map refresh.
 *
 * @TODO: Remove once satisfied we really don't need this.
 */
//$(window).resize(function () {
//    MAP.invalidateSize();
//});

/**
 * Enable the given base map layer.
 *
 * @param layer_key: Must refer to the key of an available layer (in AVAILABLE_LAYERS constant).
 */
function changeBasemap(layer_key) {
    // Use raster tiles on mobile for now, until we sort out zooming and marker issues.
    if (layer_key == 'map') {
        if (!isMobile) {
            layer_key = 'vector';
        }
    }

    new_active_layer = AVAILABLE_LAYERS[layer_key];

    // Go through all layers, adding the intended one and removing others.
    for (i=0; i<ALL_LAYERS.length; i++) {
        if (ALL_LAYERS[i] == new_active_layer) {
            // Add the active layer
            if (! MAP.hasLayer(ALL_LAYERS[i])) {
                MAP.addLayer(ALL_LAYERS[i], true);
            }
            if (layer_key != 'vector') {
                // Mapbox GL+Leaflet layers don't implement bringToBack()
                new_active_layer.bringToBack();
            }
        } else {
            // Remove the inactive layer
            if (MAP.hasLayer(ALL_LAYERS[i])) {
                MAP.removeLayer(ALL_LAYERS[i]);
            }
        }
    }
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
