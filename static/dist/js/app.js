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

// Web (mobile and desktop) vs native iOS/Android
var NATIVE_APP = false;

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
//var LAYER_TILESTACHE_SAT = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/satphoto_mobilestack/{z}/{x}/{y}.jpg", { name:'photo', subdomains:'123' });
//var LAYER_TILESTACHE_MAP = new L.TileLayer("//maps.clevelandmetroparks.com/tilestache/tilestache.cgi/basemap_mobilestack/{z}/{x}/{y}.jpg", { name:'terrain', subdomains:'123' });

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
;
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
    iconUrl: WEBAPP_BASEPATH + 'static/images/markers/marker-gps.png',
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

var CIRCLE         = new L.Circle(L.latLng(0,0), 1);

var ELEVATION_PROFILE     = null;

var HIGHLIGHT_LINE       = null;
var HIGHLIGHT_LINE_STYLE = { color:"#FF00FF", weight:3, opacity:0.75, clickable:false, smoothFactor:0.25 };

var ENABLE_MAPCLICK = true; // a flag indicating whether to allow click-query; on Mobile we disable it after switchToMap()

var SKIP_TO_DIRECTIONS = false; // should More Info skip straight to directions? usually not, but there is one button to make it so

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
function lineWKTtoFeature(wkt,style) {
    var parser = new Wkt.Wkt();
    parser.read(wkt);
    return parser.toObject(style);
}

/**
 * Place "target" (normal) marker
 */
function placeTargetMarker(lat,lon) {
    MAP.addLayer(MARKER_TARGET);
    MARKER_TARGET.setLatLng(L.latLng(lat,lon));
}

/**
 * Clear "target" (normal) marker
 */
function clearTargetMarker() {
    MAP.removeLayer(MARKER_TARGET);
}

/**
 * Place GPS (geolocated) marker
 */
function placeGPSMarker(lat,lon) {
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
;
 /**
 * mobile.js
 *
 * JS for main app map.
 *
 * Cleveland Metroparks
 */

// App sidebar (Leaflet Sidebar-v2)
var sidebar = null;
// Load when map has been initialized
$(document).on("mapInitialized", function () {
    sidebar = L.control.sidebar('sidebar').addTo(MAP);
});

// used by the radar: sound an alert only if the list has in fact changed
var LAST_BEEP_IDS = [];

// other stuff pertaining to our last known location and auto-centering
var LAST_KNOWN_LOCATION = L.latLng(41.3953,-81.6730);
var AUTO_CENTER_ON_LOCATION = false;

// sorting by distance, isn't always by distance
// what type of sorting do they prefer?
var DEFAULT_SORT = 'distance';

// this becomes a pURL object for fetching URL params:
var URL_PARAMS = null;

/**
 * Refresh the map on resize or rotate.
 *
 * @TODO: Tear this down.
 */
$(window).bind('orientationchange pageshow resize', function() {
    // scrolling the window is supposed to remove the address bar,
    // but it rarely works, often lags out the page as it slowly hides half of the address bar,
    // and creates bugs when we want to operate a picklist that's longer than a page (the page scrolls, THEN gets tapped)
    //window.scroll(0, 1);

    var page    = $(":jqmData(role='page'):visible");
    var header  = $(":jqmData(role='header'):visible");
    //var footer  = $(":jqmData(role='footer'):visible");
    var content = $(":jqmData(role='c=ontent'):visible");
    var viewportHeight = $(window).height();
    //var contentHeight = viewportHeight - header.outerHeight() - footer.outerHeight();
    var contentHeight = viewportHeight - header.outerHeight();
    page.height(contentHeight + 1);
    $(":jqmData(role='content')").first().height(contentHeight);

    if ( $("#map_canvas").is(':visible') ) {
        $("#map_canvas").height(contentHeight);
        if (MAP) MAP.invalidateSize();
    }
});

/**
 * Disable clicks momentarily
 *
 * @TODO: Where do we still need this? Deprecate/remove...
 *
 * a method for changing over to the map "page" without having a hyperlink, e.g. from the geocoder callback
 * this is particularly important because we often want to zoom the map, but since map resizing is async,
 * the map is wrongly sized and badly positioned when we try to fitBounds() or setView(()
 * Solution: use switchToMap() and give it a callback function. This callback will be executed after a
 * short delay, ensuring that the map is showing and properly resized before doing the next activity
 */
function disableClicksMomentarily() {
    //disableClicks();
    //setTimeout(enableClicks, 1500);
}

/**
 * Disable clicks
 */
function disableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = false;
    MAP.dragging.removeHooks();
    MAP.touchZoom.removeHooks();
}

/**
 * Enable clicks
 */
function enableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = true;
    MAP.dragging.addHooks();
    MAP.touchZoom.addHooks();
}

/**
 * Switch to map, with callback
 */
function switchToMap(callback) {
    // If the user has a small screen, close the sidebar to see the map.
    // @TODO: Can we check, instead, whether the sidebar is taking up the full screen?
    if ($(window).width() < 800) {
        sidebar.close();
    }

    // We don't need much of a wait here, anymore. (If at all?)
    if (callback) setTimeout(callback, 100);
}

/**
 * Load the map, handling query strings
 */
$(document).ready(function () {
    // load up the URL params before the map, as we may need them to configure the map
    URL_PARAMS = $.url();

    mapOptions = {
        base: URL_PARAMS.param('base'),
        x: URL_PARAMS.param('x'),
        y: URL_PARAMS.param('y'),
        z: URL_PARAMS.param('z')
    };

    // Initialize the map
    initMap(mapOptions);

    // URL params query string: "type" and "name"
    if (URL_PARAMS.param('type') && URL_PARAMS.param('name') ) {
        var params = {
            type: URL_PARAMS.param('type'),
            name: URL_PARAMS.param('name')
        };
        $.get(API_BASEPATH + 'ajax/exactnamesearch', params, function (reply) {
            if (!reply || ! reply.s || ! reply.w || ! reply.n || ! reply.e) return alert("Cound not find that feature.");

            // zoom to the location
            var box = L.latLngBounds( L.latLng(reply.s,reply.w) , L.latLng(reply.n,reply.e) );
            MAP.fitBounds(box);

            // lay down the WKT or a marker to highlight it
            if (reply.lat && reply.lng) {
                placeTargetMarker(reply.lat,reply.lng);
            }
            else if (reply.wkt) {
                HIGHLIGHT_LINE = lineWKTtoFeature(reply.wkt, HIGHLIGHT_LINE_STYLE);
                MAP.addLayer(HIGHLIGHT_LINE);
            }
        }, 'json');
    }

    // URL params query string: "type" and "gid"
    if (URL_PARAMS.param('type') && URL_PARAMS.param('gid') ) {
        if (URL_PARAMS.param('type') == 'attraction') {
            var params = {
                gid: URL_PARAMS.param('gid')
            };
            $.get(API_BASEPATH + 'ajax/get_attraction', params, function (reply) {
                if (!reply || ! reply.lat || ! reply.lng) {
                    return alert("Cound not find that feature.");
                }

                // @TODO: Eventually we'll have individual POI zoomlevels in DB
                placeTargetMarker(reply.lat, reply.lng);
                MAP.flyTo(L.latLng(reply.lat, reply.lng), DEFAULT_POI_ZOOM);

                // Show info in sidebar
                // @TODO: This is app-specific. Re-work.
                showAttractionInfo(reply);

            }, 'json');
        }
    }

    // URL params query string: "route"
    // Fill in the boxes and run it now
    if (URL_PARAMS.param('routefrom') && URL_PARAMS.param('routeto') && URL_PARAMS.param('routevia') ) {
        // split out the params
        var sourcelat = URL_PARAMS.param('routefrom').split(",")[0];
        var sourcelng = URL_PARAMS.param('routefrom').split(",")[1];
        var targetlat = URL_PARAMS.param('routeto').split(",")[0];
        var targetlng = URL_PARAMS.param('routeto').split(",")[1];
        var via       = URL_PARAMS.param('routevia');
        var tofrom    = 'to';

        // toggle the directions panel so it shows directions instead of Select A Destination
        sidebar.open('pane-getdirections');
        $('#getdirections_disabled').hide();
        $('#getdirections_enabled').show();

        // fill in the directions field: the title, route via, the target type and coordinate, the starting coordinates
        $('#directions_target_title').text(URL_PARAMS.param('routetitle'));
        $('#directions_via').val(URL_PARAMS.param('routevia'));
        $("#directions_via").selectmenu('refresh');
        $('#directions_type').val('geocode');
        $("#directions_type").selectmenu('refresh');
        $('#directions_type_geocode_wrap').show();
        $('#directions_address').val(URL_PARAMS.param('routefrom'));
        $('#directions_target_lat').val(targetlat);
        $('#directions_target_lng').val(targetlng);
        $('#directions_via').trigger('change');
        $('#directions_address').val( URL_PARAMS.param('fromaddr') );
        $('#directions_reverse').val( URL_PARAMS.param('whichway') );
        $('#directions_via_bike').val( URL_PARAMS.param('routevia_bike') );

        setTimeout(function () {
            $('#directions_reverse').trigger('change');
        },1000);
        $('#directions_type').val( URL_PARAMS.param('loctype') );

        // make the Directions request
        getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
    }

    // Set the appropriate basemap radio button in Settings
    var base = URL_PARAMS.param('base') || 'map';
    var photoButton = $('input[name="basemap"][value="photo"]');
    var mapButton = $('input[name="basemap"][value="map"]');
    switch (base) {
        case 'photo':
            photoButton.prop('checked', true).checkboxradio('refresh');
            mapButton.prop('checked', false).checkboxradio('refresh');
            break;
        case 'map':
        default:
            photoButton.prop('checked', false).checkboxradio('refresh');
            mapButton.prop('checked', true).checkboxradio('refresh');
            break;
    }

    // Map is initialized and query strings handled.
    // Fire mapReady event.
    $.event.trigger({
        type: 'mapReady',
    });
});

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
 * Show Photo
 *
 * functions for toggling the photo, like a one-item gallery  :)
 * this varies between mobile and desktop, but since they're named the same it forms a common interface
 */
function showPhoto(url) {
    $('#photo').prop('src',url);
    sidebar.open('pane-photo');
}

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
 * (Don't use a DOM element to pass info.)
 * We can generalize this for other types of POIs later.
 *
 * attraction.gid
 * attraction.title
 * attraction.lat
 * attraction.lng
 */
function showAttractionInfo(attraction) {
    // @TODO: Construct the #show_on_map button. We don't have an "element".
    //$('#show_on_map').data('zoomelement', element);

    // Set our directions element
    // @TODO: Do this differently.
    $('#directions_target_lat').val(attraction.lat);
    $('#directions_target_lng').val(attraction.lng);
    $('#directions_target_type').val(attraction.type);
    $('#directions_target_gid').val(attraction.gid);
    $('#directions_target_title').text(attraction.title);

    // Change to the Info pane
    sidebar.open('pane-info');

    // Set the sidebar pane's back button.
    var backurl = '#pane-browse';
    $('#pane-info .sidebar-back').prop('href', backurl);

    // Enable "Get Directions"
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

    // Purge any vector data from the Show On Map button;
    // the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null);

    $('#info-content').text("Loading...");

    // Get more info via AJAX
    if (attraction.gid) {
        var params = {};
        params.type = 'attraction';
        params.gid  = attraction.gid;

        $.get(API_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            // grab and display the plain HTML
            $('#info-content').html(reply);
        },'html');
    }
}

/**
 * zoomElementClick
 * 
 * common interface: given a .zoom element with lon, lat, WSEN, type, gid,
 * fetch info about it and show it in a panel
 */
function zoomElementClick(element) {
    // are we ignoring clicks? if so, then never mind; if not, then proceed but ignore clicks for a moment
    // this attempts to work around slow fingers sending multiple touches,
    // and long listviews inexplicably scrolling the page and re-tapping
    if (! ENABLE_MAPCLICK) return;
    disableClicksMomentarily();

    var type = element.attr('type');
    var gid  = element.attr('gid');

    // assign this element to the Show On Map button, so it knows how to zoom to our location
    // and to the getdirections form so we can route to it
    // and so the pagechange event handler can see that we really do have a target
    $('#show_on_map').data('zoomelement', element );

    $('#directions_target_lat').val( element.attr('lat') );
    $('#directions_target_lng').val( element.attr('lng') );
    $('#directions_target_type').val( element.attr('type') );
    $('#directions_target_gid').val( element.attr('gid') );
    $('#directions_target_title').text( element.attr('title') );

    // Change to the Info pane
    sidebar.open('pane-info');

    // correct the Back button to go to the URL specified in the element, or else to the map
    var backurl = element.attr('backbutton');
    if (! backurl) backurl = '#pane-browse';
    $('#pane-info .sidebar-back').prop('href', backurl);

    // now that we have a location defined, enable the Get Directions
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

    // purge any vector data from the Show On Map button; the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null );
    $('#info-content').text("Loading...");

    // if the feature has a type and a gid, then we can fetch info about it
    // do some AJAX, fill in the page with the returned content
    // otherwise, fill in the title we were given and leave it at that
    if (type && gid) {
        var params = {};
        params.type = type;
        params.gid  = gid;
        params.lat  = LAST_KNOWN_LOCATION.lat;
        params.lng  = LAST_KNOWN_LOCATION.lng;
        $.get(API_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            // grab and display the plain HTML
            $('#info-content').html(reply);

            // if there's a <wkt> element in the HTML, it's vector data to be handled by zoomElementHighlight()
            // store it into the data but remove it from the DOM to free up some memory
            var wktdiv = $('#info-content').find('div.wkt');
            if (wktdiv) {
                $('#show_on_map').data('wkt', wktdiv.text() );
                wktdiv.remove();
            }

            // all set, the info is loaded
            // there's a special case where they only got the info for the purpose of routing there
            // handle that by clcking the Directions By Car button
            if (SKIP_TO_DIRECTIONS) {
                $('#directions_car').click();
                SKIP_TO_DIRECTIONS = false;
            }
        },'html');
    } else {
        // fill in the title since we have little else,
        // then presume that the person wants to route there by clicking the Directions By Car button
        $('#info-content').html( $('<h1></h1>').text(element.attr('title')) );
        $('#directions_car').click();
    }
}

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
        var destpoint = L.latLng(element.attr('lat'),element.attr('lng'));
        var meters    = LAST_KNOWN_LOCATION.distanceTo(destpoint);
        var bearing   = LAST_KNOWN_LOCATION.bearingWordTo(destpoint);

        var miles    = meters / 1609.344;
        var feet     = meters * 3.2808399
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
    // @TODO: re-set .ui-last-child on appropriate element
    // (because we're getting last-element styling on non-last elements)
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
 * [Geocode and] Zoom to Address
 */
function zoomToAddress(searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $.get(API_BASEPATH + 'ajax/geocode', params, function (result) {
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
        var latlng = L.latLng(result.lat,result.lng);

        // if this point isn't even in the service area, complain and bail
        // tip: "post office" finds Post Office, India
        if (! MAX_BOUNDS.contains(latlng) ) {
            return alert("The only results we could find are too far away to zoom the map there.");
        }

        // zoom the point location, nice and close, and add a marker
        switchToMap(function () {
            MAP.setView(latlng,16);
            placeTargetMarker(result.lat,result.lng);

            // add a bubble at the location indicating their interpretation of the address, so we can see how bad the match was
            // also add a specially-crafted span element with lat= lng= and title= for use with zoomElementClick()
            var html = "";
            html += '<h3 class="popup_title">' + result.title + '</h3>';
            html += '<span class="fakelink zoom" title="' + result.title + '" lat="' + result.lat + '" lng="' + result.lng + '" w="' + result.w + '" s="' + result.s + '" e="' + result.e + '" n="' + result.n + '" onClick="zoomElementClick( $(this) );">Directions</span>';
            var popup = new L.Popup();
            popup.setLatLng(latlng);
            popup.setContent(html);
            MAP.openPopup(popup);
        });
    }, 'json');
};

/**
 * Show on Map
 *
 * When Show On Map is clicked (in the details panel) it has associated data:
 * an element with w,s,e,n,lat,lng,type,gid etc. for fetching more info or adjusting the map to zoom
 */
var showOnMap = function () {
    // zoom the map to the feature's bounds, and place a marker if appropriate
    var element = $(this).data('zoomelement');

    if (element) {
        var w = element.attr('w');
        var s = element.attr('s');
        var e = element.attr('e');
        var n = element.attr('n');

        var lng = element.attr('lng');
        var lat = element.attr('lat');

        var type = element.attr('type');
        var wkt  = $(this).data('wkt');

        // Switch to the map (which no longer amounts to much)
        // And add our feature.
        switchToMap(function () {
            // Zoom the map into the stated bbox, if we have one.
            if (w!=0 && s!=0 && e!=0 && n!=0) {
                var bounds = L.latLngBounds( L.latLng(s,w) , L.latLng(n,e) );
                bounds = bounds.pad(0.15);
                MAP.fitBounds(bounds);
            } else {
                // Re-center and zoom
                // @TODO: Eventually we'll have individual POI zoomlevels in DB
                MAP.flyTo(L.latLng(lat, lng), DEFAULT_POI_ZOOM);
            }

            // Lay down a marker if this is a point feature
            if (type == 'poi' || type == 'attraction' || type == 'loop') {
                placeTargetMarker(lat, lng);
            }

            // Draw the line geometry onto the map, if this is a line feature.
            if (wkt) {
                if (HIGHLIGHT_LINE) {
                    MAP.removeLayer(HIGHLIGHT_LINE);
                    HIGHLIGHT_LINE = null;
                }
                HIGHLIGHT_LINE = lineWKTtoFeature(wkt, HIGHLIGHT_LINE_STYLE);
                MAP.addLayer(HIGHLIGHT_LINE);
            }
        });
    }
};

/**
 * Show on Map button handler
 */
$(document).ready(function () {
    $('#show_on_map').click(showOnMap);
});

/**
 * Zoom button handlers
 *
 * Click it to bring up info window, configure the Show On Map button.
 */
$(document).ready(function () {
    // zoomElementClick() is defined by mobile.js and desktop.js
    // typically it goes to a Details page and sets up various event handlers
    var openDetailsPanel = function () {
        zoomElementClick( $(this) );
    };
    $('.zoom').click(openDetailsPanel);
});

/**
 * WSEN to Bounds
 *
 * given a WSEN set of ordinates, construct a L.LatLngBounds
 */
function WSENtoBounds(west,south,east,north) {
    return L.latLngBounds([ [south,west] , [north,east] ]);
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
     * Trail-finder pane (#pane-trailfinder)
     */
    $('a.sidebar-pane-link[href="#pane-trailfinder"]').click(function() {
        // On opening the Trailfinder pane, trigger the search (list update).
        trailfinderUpdate();
        $('#pane-trailfinder .sortpicker').show();
    });

    /*
     * Find pane (#pane-browse)
     */
    $('#pane-browse li a').click(function() {

    });

    /*
     * Nearby pane (#pane-radar)
     */
    $('.sidebar-tabs li a[href="#pane-radar"]').click(function() {
        updateNearYouNow();
    });

    /*
     * Find POIs pane (#pane-browse-pois-activity)
     */
    // When POI Item clicked:
    $('#pane-browse-pois-activity li a').click(function() {
        var category = this.hash.replace( /.*category=/, "" );

        // Get Activity ID from query string params
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /id=(.*)&category=/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            activity_id = matches[1];
        }

        sidebar.open('pane-browse-results');

        var target = $('ul#browse_results');
        target.empty();

        activity_title = $(this).text().trim();

        // fix the Back button on the target panel, to go Back to the right page
        // @TODO: Can we consolidate, now that the other two options are gone?
        var backurl = "#pane-browse";
        if (category.indexOf('pois_usetype_') == 0) {
            backurl = "#pane-browse-pois-activity";
        }
        $('#pane-browse-results .sidebar-back').prop('href', backurl);
        // for the fetched items, if one follows to the Info panel, where should that Back button go?
        var backbuttonurl = backurl;
        if (category) backbuttonurl = "#pane-browse-results";

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(API_BASEPATH + 'ajax/get_attractions_by_activity', { activity_ids: activity_id }, function (reply) {

            // Header title
            var header = $('#pane-browse-results h1.sidebar-header .title-text');
            header.text(activity_title);

            // Iterate over fetched results and render them into the target
            for (var i=0, l=reply.results.length; i<l; i++) {
                var result = reply.results[i];

                // List item
                // A lot of attributes to set pertaining to .zoom handling
                var li = $('<li></li>').addClass('zoom');
                li.attr('title', result.name );
                li.attr('gid',result.gid)
                    .attr('type',result.type)
                    .attr('w',result.w)
                    .attr('s',result.s)
                    .attr('e',result.e)
                    .attr('n',result.n)
                    .attr('lat',result.lat)
                    .attr('lng',result.lng);
                li.attr('backbutton', backbuttonurl);

                // Link (fake, currently)
                link = $('<a></a>');
                link.attr('class', 'ui-btn ui-btn-text');
                //link.attr('href', 'javascript:zoomElementClick(this)');
                li.append(link);

                // On click: center the map and load More Info
                li.click(function () {
                    zoomElementClick( $(this) );
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
        }, 'json');

    });

    /*
     * Share pane (#pane-share)
     */
     // Build a new short URL for the current map state.
    $('.sidebar-tabs a[href="#pane-share"]').click(function() {
        populateShareBox();
    });
    // Use current URL for Twitter and Facebook share links
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
 * @TODO: Bind this to sidebar tab button clicks AND
 * clicks inside sidebar panes that generate/load new data
 *
 * mobile-specific: on any page change, after the changeover,
 * update the distance readouts in any ul.dstance_sortable which was just now made visible
 */
$(document).bind('pagechange', function(e,data) {
    //sortLists();
});

/*
 * mobile-specific: listen for page changes to #pane-info
 * and make sure we really have something to show data for
 * e.g. in the case of someone reloading #pane-info the app
 * can get stuck since no feature has been loaded
 */
//$(document).bind('pagebeforechange', function(e,data) {
//    if ( typeof data.toPage != "string" ) return; // no hash given
//    var url = $.mobile.path.parseUrl(data.toPage);
//    if ( url.hash != '#pane-info') return; // not the URL that we want to handle
//
//    var ok = $('#show_on_map').data('zoomelement');
//    if (ok) return; // guess it's fine, proceed
//
//    // got here: they selected info but have nothing to show info, bail to the Find panel
//    $.mobile.changePage('#pane-browse');
//    return false;
//});

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
        FastClick.attach(
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
 * Is IOS?
 */
function is_ios() {
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
}

/**
 * Toggle geolocation-following
 */
function toggle_gps_follow() {
    AUTO_CENTER_ON_LOCATION ? disable_gps_follow() : enable_gps_follow();
}

/**
 * Turn geolocation-following ON
 */
function enable_gps_follow() {
    AUTO_CENTER_ON_LOCATION = true;
    var iconurl = is_ios() ?
        WEBAPP_BASEPATH + 'static/images/map_controls/mapbutton_gps_ios_on.png' :
        WEBAPP_BASEPATH + 'static/images/map_controls/mapbutton_gps_on.png';
    $('#mapbutton_gps img').prop('src', iconurl);
}

/**
 * Turn geolocation-following OFF
 */
function disable_gps_follow() {
    AUTO_CENTER_ON_LOCATION = false;
    var iconurl = is_ios() ?
        WEBAPP_BASEPATH + 'static/images/map_controls/mapbutton_gps_ios_off.png' :
        WEBAPP_BASEPATH + 'static/images/map_controls/mapbutton_gps_off.png';
    $('#mapbutton_gps img').prop('src', iconurl);
}

/**
 * Toggle geolocation-following when GPS icon is clicked
 */
$(document).ready(function () {
    $('#mapbutton_gps').click(function () {
        toggle_gps_follow();
    });
});

/**
 * Turn geolocation-following OFF on page load
 *
 * iOS and non-iOS get different icons for the GPS button so it's important
 * to trigger this now so the right icon is chosen.
 */
$(document).ready(function () {
    disable_gps_follow();
});

/**
 * Turn geolocation-following OFF when map canvas is swiped.
 */
$(document).ready(function () {
    $('#map_canvas').bind('swipe', function () {
        disable_gps_follow();
    });
});

/**
 * Handle geolocation update
 *
 * Update our last-known location, then do more calculations regarding it.
 */
$(document).ready(function () {
    MAP.on('locationfound', function(event) {
        // Update the user's last known location
        LAST_KNOWN_LOCATION = event.latlng;

        // Mark the user's current location and center the map
        placeGPSMarker(event.latlng.lat, event.latlng.lng)
        if (AUTO_CENTER_ON_LOCATION) {
            var within_max_bounds = MAX_BOUNDS.contains(event.latlng);
            if (within_max_bounds) {
                MAP.panTo(event.latlng);
                if (MAP.getZoom() < 12) {
                    MAP.setZoom(16);
                }
            } else {
                MAP.fitBounds(MAX_BOUNDS);
            }
        }

        // @TODO: Let's identify all such lists and see if there's a cleaner way.
        //
        // sort any visible distance-sorted lists
        //sortLists();

        // @TODO: Why do we do this again when opening the panel?
        // @TODO: Also, should this be mobile only?
        //
        // adjust the Near You Now listing
        updateNearYouNow();

        // check the Radar alerts to see if anything relevant is within range
        if ( $('#radar_enabled').is(':checked') ) {
            var meters = $('#radar_radius').val();
            var categories = [];
            $('input[name="radar_category"]:checked').each(function () { categories[categories.length] = $(this).val() });
            placeCircle(event.latlng.lat,event.latlng.lng,meters);
            checkRadar(event.latlng,meters,categories);
        }

        // @TODO: Is this working?
        // update the GPS coordinates readout in the Settings panel
        var lat = event.latlng.lat;
        var lng = event.latlng.lng;
        var ns = lat < 0 ? 'S' : 'N';
        var ew = lng < 0 ? 'W' : 'E';
        var latdeg = Math.abs(parseInt(lat));
        var lngdeg = Math.abs(parseInt(lng));
        var latmin = ( 60 * (Math.abs(lat) - Math.abs(parseInt(lat))) ).toFixed(3);
        var lngmin = ( 60 * (Math.abs(lng) - Math.abs(parseInt(lng))) ).toFixed(3);
        var text = ns + ' ' + latdeg + ' ' + latmin + ' ' + ew + ' ' + lngdeg + ' ' + lngmin;
        $('#gps_location').text(text);
    });

    // start constant geolocation, which triggers all of the 'locationfound' events above
    MAP.locate({ watch: true, enableHighAccuracy: true });
});;
 /**
 * directions.js
 *
 * JS for directions functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

//var DIRECTIONS_TARGET     = L.latLng(0,0);
var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:1.00, clickable:false, smoothFactor:0.25 };

/**
 * Get directions
 *
 * Part of the Get Directions system:
 * Given lat,lng and lat,lng and route params, request directions from the server
 * then render them to the screen and to the map.
 */
function getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via) {
    // empty out the old directions and disable the button as a visual effect
    $('#directions_steps').empty();
    disableDirectionsButton();

    // store the source coordinates
    $('#directions_source_lat').val(sourcelat);
    $('#directions_source_lng').val(sourcelng);

    // do they prefer fast, short, or weighted?
    var prefer = $('#directions_prefer').val();

    // make up the params and run the request
    var params = {
        sourcelat:sourcelat, sourcelng:sourcelng,
        targetlat:targetlat, targetlng:targetlng,
        tofrom:tofrom,
        via:via,
        prefer:prefer,
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
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    var button = $('#directions_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
}

/**
 * Process Get Directions form
 *
 * this wrapper checks the directions_type field and other Get Directions fields,
 * decides what to use for the address field and the other params,
 * then calls either getDirections() et al
 */
function processGetDirectionsForm() {
    // which transportation mode?
    // separated into a switch so we can fuss with them separately, e.g. originally hike and bike had a secondary selector for paved/unpaved status
    var tofrom    = $('#directions_reverse').val();
    var via       = $('#directions_via').val();
    switch (via) {
        case 'hike':
            via = 'hike';
            //via = $('#directions_via_hike').val();
            break;
        case 'bike':
            via = $('#directions_via_bike').val();
            break;
    }

    // empty these fields because we probably don't need them
    // they will be repopulated in the 'feature' switch below if we're routing to a Park Feature
    $('#directions_source_gid').val('');
    $('#directions_source_type').val('');

    // we must do some AJAX for the target location and the origin location, but it must be done precisely in this sequence
    // so, have jQuery use synchronous AJAX calls (yeah, the A in AJAX, I know) so we can do things in proper order
    $.ajaxSetup({ async:false });

    // figure out the target: address geocode, latlon already properly formatted, current GPS location, etc.
    // this must be done before the target is resolved (below) because resolving the target can mean weighting based on the starting point
    // e.g. directions to parks/reservations pick the closest entry point to our starting location
    var sourcelat, sourcelng;
    var addresstype = $('#directions_type').val();
    switch (addresstype) {
        case 'gps':
            sourcelat = LAST_KNOWN_LOCATION.lat;
            sourcelng = LAST_KNOWN_LOCATION.lng;
            break;
        case 'geocode':
            var address  = $('#directions_address').val();
            if (! address) return alert("Please enter an address, city, or landmark.");
            var is_coords = /^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(address); // regional assumption in this regular expression: negative lng, positive lat
            if (is_coords) {
                sourcelat = parseFloat( is_coords[1] );
                sourcelng = parseFloat( is_coords[2] );
                getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
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
                    if (! MAX_BOUNDS.contains(L.latLng(sourcelat,sourcelng)) ) {
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
                $('#directions_source_gid').val( reply[0].gid );
                $('#directions_source_type').val( reply[0].type );

                sourcelat = parseFloat(reply[0].lat);
                sourcelng = parseFloat(reply[0].lng);
            },'json');
            if (! sourcelat || ! sourcelng) return;
            break;
    } // end of switch for address type

    // now get this: sometimes we don't actually route between these two points, but use the type&gid to
    // find the closest target points, e.g. the closest entry gate at a Reservation, or a parking lot for a POI or Building
    // do this for both the Target (the chosen location before the Directions panel opened)
    // and for the Source (whatever address or park feature they entered/selected as the other endpoint)
    var targetlat = parseFloat( $('#directions_target_lat').val() );
    var targetlng = parseFloat( $('#directions_target_lng').val() );

    var source_gid  = $('#directions_source_gid').val();
    var source_type = $('#directions_source_type').val();
    if (source_type == 'poi' || source_type == 'attraction' ||source_type == 'reservation' || source_type == 'building' || source_type == 'trail') {
        var params = {};
        params.type = source_type;
        params.gid  = source_gid;
        params.lat  = targetlat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = targetlng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
            sourcelat = reply.lat;
            sourcelng = reply.lng;

            // save them into the input fields too, so they'd get shared
            $('#directions_source_lat').val(reply.lat);
            $('#directions_source_lng').val(reply.lng);
        }, 'json');
    }

    var target_gid  = $('#directions_target_gid').val();
    var target_type = $('#directions_target_type').val();
    if (target_type == 'poi' || source_type == 'attraction' || target_type == 'reservation' || target_type == 'building' || target_type == 'trail') {
        var params = {};
        params.type = target_type;
        params.gid  = target_gid;
        params.lat  = sourcelat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = sourcelng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
            targetlat = reply.lat;
            targetlng = reply.lng;

            // save them into the input fields too, so they'd get shared
            $('#directions_target_lat').val(reply.lat);
            $('#directions_target_lng').val(reply.lng);
        }, 'json');
    }

    if (! targetlat || ! targetlng) return alert("Please close the directions panel, and pick a location.");

    // great! we have resolved the targetlat and targetlng from the best possible location,
    // and resolved the sourcelat and sourcelng from a combination of data source and current location
    // re-enable asynchronous AJAX and request directions
    $.ajaxSetup({ async:true });
    getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
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
function renderDirectionsStructure(directions,target,options) {
    // no options, no problem
    if (! options) options = {};

    // phase 1: remove any old route line, draw the route on the map
    clearDirectionsLine();
    var polyline   = lineWKTtoFeature(directions.wkt, DIRECTIONS_LINE_STYLE);
    var startpoint = L.latLng(directions.start.lat,directions.start.lng);
    var endpoint   = L.latLng(directions.end.lat,directions.end.lng);
    placeDirectionsLine(polyline, startpoint, endpoint);

    // for the bounding box, we save the bbox LatLngBounds into DIRECTIONS_LINE
    // because on Mobile, zooming the map now is an error and the map must be zoomed later, using the DIRECTIONS_LINE global
    DIRECTIONS_LINE.extent = WSENtoBounds(directions.bounds.west,directions.bounds.south,directions.bounds.east,directions.bounds.north);
    var bbox = DIRECTIONS_LINE.extent.pad(0.15);
    MAP.fitBounds(bbox);

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
    if (! options.noshare) {
        // if there are options given, check for noshare:true and skip on the Share link
        var shareRouteBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .prop('id','share_route_button')
            .text('Share');
        shareRouteBtn.click(function () {
            updateShareUrlByDirections();
            populateShareBox();
            sidebar.open('pane-share');
        });
        directionsFunctions.append(shareRouteBtn);
    }

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
 * Clear directions line
 */
function clearDirectionsLine() {
    // this line actually gets deleted
    if (DIRECTIONS_LINE) {
        MAP.removeLayer(DIRECTIONS_LINE);
        DIRECTIONS_LINE = null;
    }
    // the markers get set to 0,0 and removed from the map
    if (MAP.hasLayer(MARKER_FROM)) {
        MARKER_FROM.setLatLng( L.latLng(0,0) );
        MAP.removeLayer(MARKER_FROM);
    }
    if (MAP.hasLayer(MARKER_TO)) {
        MARKER_TO.setLatLng( L.latLng(0,0) );
        MAP.removeLayer(MARKER_TO);
    }

    // and both the Directions and Measure need their content erased, so they aren't confused with each other
    // don't worry, clearDirectionsLine() is always a prelude to repopulating one of these
    $('#directions_steps').empty();
    $('#measure_steps').empty();
}

/**
 * Place directions line
 */
function placeDirectionsLine(polyline,startll,endll) {
    // save the polyline to the global
    DIRECTIONS_LINE = polyline;

    // lay down the polyline as-is
    MAP.addLayer(DIRECTIONS_LINE);

    // place the markers on the start and end vertices, and disable their dragging
    MARKER_FROM.setLatLng(startll);
    MAP.addLayer(MARKER_FROM);
    MARKER_TO.setLatLng(endll);
    MAP.addLayer(MARKER_TO);
    MARKER_FROM.dragging.disable();
    MARKER_TO.dragging.disable();
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
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        sidebar.open('pane-getdirections');
    }

    // the directions-type picker (GPS, address, POI, etc) mostly shows and hides elements
    // its value is used in processGetDirectionsForm() for choosing how to figure out which element to use
    $('#directions_type').change(function () {
        var which  = $(this).val();
        var target = $('#directions_type_geocode_wrap');
        if (which == 'gps') target.hide();
        else                target.show();
    });

    // the To/From selectior should update all of the selector options to read To XXX and From XXX
    $('#directions_reverse').change(function () {
        var tofrom = $(this).val() == 'to' ? 'from' : 'to';
        $('#directions_type option').each(function () {
            var text = $(this).text();
            text = tofrom + ' ' + text.replace(/^to /, '').replace(/^from /, '');
            $(this).text(text);
        });
        $('#directions_type').selectmenu('refresh', true)
    });

    // this button triggers a geocode and directions, using the common.js interface
    $('#directions_button').click(function () {
        $('#directions_steps').empty();
        $('.directions_functions').remove();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    // this button changes over to the Find subpage, so they can pick a destination
    $('#change_directions_target2').click(function () {
        sidebar.open('pane-browse');

        // if they clicked this button, it means that they will be looking for a place,
        // with the specific purpose of getting Directions there
        // set this flag, which will cause zoomElementClick() to skip showing the info and skip to directions
        SKIP_TO_DIRECTIONS = true;
    });
});

/**
 * Open elevation profile by segments
 */
function openElevationProfileBySegments() {
    if (! ELEVATION_PROFILE) return;

    // the vertices have horizontal and vertical info (feet and elev). make a pair of arrays
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

    // selecting By Trail, By Car, etc. shows & hides the second filter, e.g. paved/unpaved for "By foot" only
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
 * JS for Sharing functionality.
 *
 * Included into app.js.
 *
 * pertaining to the Share box and RESTful params for loading map state
 * The basic workflow is:
 * - A map movement event triggers a call to udpateShareUrl(() et al,
 * - which compose the URL string and save it to SHARE_URL_STRING
 * - At a later time, when the user opens up the appropriate panel or sub-page as
 *   defined in mobile.js and desktop.js,
 *   an AJAX request is made to save the long URL and get a short URL in return
 * - This short URL is displayed in the #share_url panel for the end user.
 * We do not want to request a short URL with every single map movement;
 * that would consume network resources unnecessarily.
 *
 * Cleveland Metroparks
 */

// Query string for sharing the map in the current state,
// updated by updateShareUrl() and later minified by populateShareBox()
var SHARE_URL_STRING = null;

/**
 * Setup Share URL updates
 *
 * On "Map Ready"; after common.js finishes initMap().
 */
function setupShareUrlUpdates() {
    // Set up our triggers to update the "Share URL"
    MAP.on('moveend', updateShareUrl);
    MAP.on('zoomend', updateShareUrl);
    MAP.on('layerremove', updateShareUrl);
    MAP.on('layeradd', updateShareUrl);
    // Do an initial update
    updateShareUrl();
}
$(document).on("mapReady", setupShareUrlUpdates);

/*
 *  Sharing handlers
 */
$(document).ready(function() {
    // Highlight/select the share box URL when it is clicked.
    $('#share_url').click(function() {
        $(this).select();
    });

    // Copy-to-clipboard button
    $('#pane-share .copy-to-clipboard').click(function() {
        // focus() then setSelectionRange() for readonly inputs on iOS
        $('#share_url').focus();
        $('#share_url')[0].setSelectionRange(0, 9999);
        document.execCommand("copy");
    });

    /**
     * Share Map button handler
     *
     * Reads from the Show On Map button to populate the Share Your Map box.
     *
     * @TODO: This was desktop only. Re-add the button to mobile.
     */
    $('#share_feature').click(function() {
        var element = $('#show_on_map').data('zoomelement');
        if (! element) {
            return;
        }
        updateShareUrlByFeature(element);
        populateShareBox();
        sidebar.open('pane-share');
    });
});

/**
 * Populate Share box
 *
 * Read the globally stored SHARE_URL_STRING and request a shortened URL from the server
 */
function populateShareBox() {
    // submit the long URL param string to the server, get back a short param string
    var params = {
        uri : URL_PARAMS.attr('path'),
        querystring : SHARE_URL_STRING
    };

    $.get(API_BASEPATH + 'ajax/make_shorturl', params, function(shortstring) {
        if (! shortstring) return alert("Unable to fetch a short URL.\nPlease try again.");
        var url = URL_PARAMS.attr('protocol') + '://' + URL_PARAMS.attr('host') + '/url/' + shortstring;

        $('#share_url').val(url);
    });
}

/**
 * Update Share URL
 *
 * Simple form: collect the X, Y, Z, basemap, etc.
 */
function updateShareUrl() {
    // the basic params: center and zoom, basemap
    var params = {};
    params.z = MAP.getZoom();
    params.x = MAP.getCenter().lng;
    params.y = MAP.getCenter().lat;
    if (MAP.hasLayer(AVAILABLE_LAYERS['photo'])) {
        params.base = 'photo';
    }
    if (MAP.hasLayer(AVAILABLE_LAYERS['map']) || MAP.hasLayer(AVAILABLE_LAYERS['vector'])) {
        params.base = 'map';
    }

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
}

/**
 * Update Share URL by Feature
 *
 * Element form: take an element compatible with zoomToElement() and create an URL which will load its info on page load
 */
function updateShareUrlByFeature(element) {
    // only 2 params, taken from the element: its type and its name
    var params = {};
    params.type = element.attr('type');
    params.name = element.attr('title');

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
}

/**
 * Update Share URL by Directions
 *
 * Directions form: processes the directions form and fills in the Share to recreate the route
 */
function updateShareUrlByDirections() {
    // if the directions aren't filled in, we can't do this
    if (! $('#directions_source_lat').val() ) return;

    // compose the params to bring up this route at page load: route title, to and from coordinates, via type, etc
    var params = {};
    if (MAP.hasLayer(AVAILABLE_LAYERS['photo'])) {
        params.base = 'photo';
    } else if (MAP.hasLayer(AVAILABLE_LAYERS['map']) || MAP.hasLayer(AVAILABLE_LAYERS['vector'])) {
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

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
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
 * Given a string, try to parse it as coordinates and return a L.LatLng instance.
 *
 * Currently supports these formats:
 *      N 44 35.342 W 123 15.669
 *      44.589033 -123.26115
 */
function strToLatLng(text) {
    var text = text.replace(/\s+$/,'').replace(/^\s+/,'');

    // simplest format is decimal numbers and minus signs and that's about it
    // one of them must be negative, which means it's the longitude here in North America
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
                return L.latLng([lat,lng]);
            }
        }
    }

    // okay, how about GPS/geocaching format:   N xx xx.xxx W xxx xx.xxx
    var gps = text.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);
    if (gps) {
        var latd = parseInt(gps[1]);
        var latm = parseInt(gps[2]);
        var lond = parseInt(gps[3]);
        var lonm = parseInt(gps[4]);

        var lat = latd + (latm/60);
        var lng = -lond - (lonm/60);

        return L.latLng([lat,lng]);
    }

    //if we got here then nothing matched, so bail
    return null;
}

/**
 * Search by Keyword
 *
 * A common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
 */
function searchByKeyword(keyword) {
    // surprise bypass
    // if the search word "looks like coordinates" then zoom the map there
    var latlng = strToLatLng(keyword);
    if (latlng) {
        MAP.setView(latlng,16);
        placeTargetMarker(latlng.lat,latlng.lng);
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

        $('#browse_keyword').autocomplete({
            target: $('#browse_keyword_autocomplete'),
            source: words,
            callback: function(e) {
                // find the value of the selected item, stick it into the text box, hide the autocomplete
                var $a = $(e.currentTarget);
                $('#browse_keyword').val($a.text());
                $("#browse_keyword").autocomplete('clear');
                // and click the button to perform the search
                $('#browse_keyword_button').click();
            },
            minLength: 3,
            matchFromStart: false
        });

        $('#search_keyword').autocomplete({
            target: $('#search_keyword_autocomplete'),
            source: words,
            callback: function(e) {
                // find the value of the selected item, stick it into the text box, hide the autocomplete
                var $a = $(e.currentTarget);
                $('#search_keyword').val($a.text());
                $("#search_keyword").autocomplete('clear');
                // and click the button to perform the search
                $('#search_keyword_button').click();
            },
            minLength: 3,
            matchFromStart: false
        });

    },'json');
});
;
/*********************************************
 * Radar / Nearby
 *********************************************/

// ALL_POIS:
//
// used by Near You Now and then later by Radar, a structure of all POIs
// we cannot render them all into the Radar page at the same time, but we can store them in memory
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
 * Update Near You Now
 *
 * update the Near You Now listing from ALL_POIS; called on a location update
 * this is a significant exception to the sortLists() system,
 * as we need to do the distance and sorting BEFORE rendering, an unusual case
 */
function updateNearYouNow() {
    // render the Radar page, in case it hasn't happened yet
    //$('#pane-radar').page();

    var target = $('#alerts');

    // iterate over ALL_POIS and calculate their distance from our last known location
    // poi.meters   poi.miles   poi.feet   poi.range
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi       = ALL_POIS[i];
        var destpoint = L.latLng(poi.lat,poi.lng);
        poi.meters    = LAST_KNOWN_LOCATION.distanceTo(destpoint);
        poi.miles     = poi.meters / 1609.344;
        poi.feet      = poi.meters * 3.2808399;
        poi.range     = (poi.feet > 900) ? poi.miles.toFixed(1) + ' mi' : poi.feet.toFixed(0) + ' ft';
        poi.bearing   = LAST_KNOWN_LOCATION.bearingWordTo(destpoint);
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
 */
function placeCircle(lat,lon,meters) {
    MAP.removeLayer(CIRCLE);
    CIRCLE.setLatLng(L.latLng(lat,lon));
    CIRCLE.setRadius(meters);
    MAP.addLayer(CIRCLE);
}

/**
 * Clear circle
 */
function clearCircle() {
    CIRCLE.setLatLng(L.latLng(0,0));
    CIRCLE.setRadius(1);
    MAP.removeLayer(CIRCLE);
}

/**
 * Extend Leaflet:
 * Add to LatLng the ability to calculate the bearing to another LatLng
 */
L.LatLng.prototype.bearingTo= function(other) {
    var d2r  = L.LatLng.DEG_TO_RAD;
    var r2d  = L.LatLng.RAD_TO_DEG;
    var lat1 = this.lat * d2r;
    var lat2 = other.lat * d2r;
    var dLon = (other.lng-this.lng) * d2r;
    var y    = Math.sin(dLon) * Math.cos(lat2);
    var x    = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x);
    brng = parseInt( brng * r2d );
    brng = (brng + 360) % 360;
    return brng;
};
L.LatLng.prototype.bearingWordTo = function(other) {
    var bearing = this.bearingTo(other);
    var bearingword = '';
     if (bearing >= 22  && bearing <= 67)  bearingword = 'NE';
    else if (bearing >= 67 && bearing <= 112)  bearingword = 'E';
    else if (bearing >= 112 && bearing <= 157) bearingword = 'SE';
    else if (bearing >= 157 && bearing <= 202) bearingword = 'S';
    else if (bearing >= 202 && bearing <= 247) bearingword = 'SW';
    else if (bearing >= 247 && bearing <= 292) bearingword = 'W';
    else if (bearing >= 292 && bearing <= 337) bearingword = 'NW';
    else if (bearing >= 337 || bearing <= 22)  bearingword = 'N';
    return bearingword;
};

/**
 * Check Radar
 */
function checkRadar(latlng,maxmeters,categories) {
    // 1: go over the Near You Now entries, find which ones are within distance and matching the filters
    maxmeters = parseFloat(maxmeters); // passed in as a .attr() string sometimes

    // iterate over ALL_POIS and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi = ALL_POIS[i];
        var meters = latlng.distanceTo( L.latLng(poi.lat,poi.lng) );

        // filter: distance
        if (meters > maxmeters) continue;

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

// on page load: install event handlers for the Find and Radar panels
$(document).ready(function () {
    $('#radar_enabled').change(function () {
        // toggle the radar config: category pickers, distance selector, etc.
        var enabled = $(this).is(':checked');
        enabled ? $('#radar_config').show() : $('#radar_config').hide();

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
 * JS for trailfinder functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Event handlers for Trail Finder
 */
$(document).ready(function () {
    // The trail type icons are connected to underlying, hidden checkboxes
    $('#trailfinder_typeicons img').click(function () {
        // Uncheck all of the invisible checkboxes, then check the one corresponding to the image
        var $this = $(this);
        var value = $this.attr('data-value');
        $('input[name="trailfinder_uses"]')
            .removeAttr('checked')
            .filter('[value="'+value+'"]')
            .prop('checked', true);

        // Adjust the images to indicate active/inactive
        $('#trailfinder_typeicons img').each(function () {
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

        // Update the listing.
        trailfinderUpdate();
    });

    // The "Search" button on the Trail Finder pane.
    // We've removed this button from the Trail Finder pane, but it's still on
    // views/finder/trail.phtml
    $('#trailfinder_go').click(function () {
        trailfinderUpdate();
    });

    // When the selectors change, trigger a list update
    $('select[name="trailfinder_reservation"]').change(function () {
        trailfinderUpdate();
    });
    $('select[name="trailfinder_paved"]').change(function () {
        trailfinderUpdate();
    });
});

/**
 * Trail Finder Search/Update
 *
 * Build Search params from the form, for passing to searchTrails() --
 * most notably the difficulty checkboxes, and making sure at least one is checked.
 */
function trailfinderUpdate() {
    var params = {};
    params.reservation = $('select[name="trailfinder_reservation"]').val();
    params.paved       = $('select[name="trailfinder_paved"]').val();

    // this is a list of selected trail uses, now only 1 will be checked but it was made to accept a list and that will likely become the case again in the future
    params.uses = [];
    $('input[name="trailfinder_uses"]:checked').each(function () {
        params.uses[params.uses.length] = $(this).val();
    });
    params.uses = params.uses.join(",");

    // pass it to the search called
    searchTrails(params);
}

/**
 * "Search" functionality in Trail Finder
 */
function searchTrails(params) {
    // clear out any old search results
    var target = $('#trailfinder_results');
    target.empty();

    // AJAX to fetch results, and render them as LIs with .zoom et cetera
    $.get(API_BASEPATH + 'ajax/search_trails', params, function (results) {

        // iterate over the results and add them to the output
        if (results.length) {
            for (var i=0, l=results.length; i<l; i++) {

                var result = results[i];

                // List item
                // A lot of attributes to set pertaining to .zoom handling
                var li = $('<li></li>').addClass('zoom');

                li.attr('title', result.name)
                  .attr('gid',result.gid)
                  .attr('type',result.type)
                  .attr('w',result.w)
                  .attr('s',result.s)
                  .attr('e',result.e)
                  .attr('n',result.n)
                  .attr('lat',result.lat)
                  .attr('lng',result.lng);

                li.attr('backbutton', '#pane-trailfinder');

                // Link (fake, currently)
                link = $('<a></a>');
                link.attr('class', 'ui-btn ui-btn-text');
                //link.attr('href', 'javascript:zoomElementClick($(this)');
                li.append(link);

                // On click, call zoomElementClick() to load more info
                li.click(function () {
                    zoomElementClick( $(this) );
                });

                // Title
                link.append(
                    $('<h4></h4>')
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
        } else {
            target.append($('<li></li>').text("No results."));
        }

        // Finalize the list, have jQuery Mobile style newly-loaded content, and sort it
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}
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
    $('#pane-loops-search').page();

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

    // #loops_filter_distance_slider is invisible and we have a set of 4 images to form "presets" for this slider
    $('#loops_filter_distancepicker img').click(function () {
        // set the min & max in the inputs
        var $this = $(this);
        var minmi = $this.attr('data-min');
        var maxmi = $this.attr('data-max');
        $('#loops_filter_distance_min').val(minmi);
        $('#loops_filter_distance_max').val(maxmi);

        // unhighlight these buttons and highlight this one, by swapping the IMG SRC
        $('#loops_filter_distancepicker img').each(function () {
            var src = $(this).prop('src');

            if ( $(this).is($this) ) {
                src  = src.replace('_off.png', '_on.png');
            } else {
                src  = src.replace('_on.png', '_off.png');
            }
            $(this).prop('src', src);
        });

        // ready, now trigger a search
        filterLoops();
    //}).first().click();
    });

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();
    $('#loops_filter_duration_min').change();
    $('#loops_filter_duration_max').change();

    // the filter button, calls filterLoops()
    $('#loops_filter_button').click(filterLoops);

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
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Novice':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Beginner':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Intermediate':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Advanced':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'mountainbike':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'exercise':
                $('.time_estimate').hide();
                $('.time_hike').show();
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

    var button = $('#loops_filter_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );

    $.get(API_BASEPATH + 'ajax/search_loops', params, function (results) {
        // re-enable the search button
        button.button('enable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );

        // find and empty the target UL
        var target = $('#loops_list');
        target.empty();

        // no results?
        if (! results || ! results.length) return alert("No matches found.");

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

            li.attr('backbutton', '#pane-loops-search');

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
        $('#pane-loops-search .sortpicker').show();
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}
;
 /**
 * print.js
 *
 * JS for printing functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

// printMap() is in common.js; it loads the various form values and POSTs them to MapFish, and receives back an URL.
// It then passes the URL to printMapDone(url) which is defined in desktop.js and mobile.js separately
function printMapPrepare() {
    $('#print_waiting').show();
    $('#print_ready').hide();
}
function printMapDone(url) {
    $('#print_waiting').hide();

    if (url) {
        $('#print_link').prop('href', url);
        $('#print_ready').show();
    }
}
function printMap() {
    // their printing options
    var comment    = $('#print_comment').val();
    var paper      = $('#print_paper').val();
    var page2title  = ""; // the title for Page 2, if any
    var page2text1  = ""; // the text content for Page 2, if any, column 1 (left-hand)
    var page2text2  = ""; // the text content for Page 2, if any, column 2 (right-hand)

    // compose the bounding box of the print
    // we can't just use the map's bbox since the monitor and the "paper" aren't the same size,
    // so the resulting maps are completely dissimilar
    // strategy:
    // - fetch the map size for their chosen layout ("paper") so we know the target width & height
    // - create a bounding box from the map's center, plus and minus half the width & height
    // - reproject to EPSG:3734 so the output looks good
    var mapwidth  = PRINT_SIZES[paper][0];
    var mapheight = PRINT_SIZES[paper][1];
    var pixelcenter = MAP.latLngToLayerPoint(MAP.getCenter());
    var sw = wgsToLocalSRS( MAP.layerPointToLatLng( new L.Point(pixelcenter.x - (mapwidth/2), pixelcenter.y + (mapheight/2) ) ) );
    var ne = wgsToLocalSRS( MAP.layerPointToLatLng( new L.Point(pixelcenter.x + (mapwidth/2), pixelcenter.y - (mapheight/2) ) ) );
    var projbbox = [ sw[0], sw[1], ne[0], ne[1] ];

    // the layers to include into the map: WMS, vectors for markers
    // we effectively emulate the OpenLayers-centric structure for each Layer
    /*
    {"baseURL":"http://labs.metacarta.com/wms/vmap0","opacity":1,"singleTile":false,"type":"WMS","layers":["basic"],"format":"image/jpeg","styles":[""],"customParams":{}},
    {"type":"Vector",
        "styles":{
            "1":{"externalGraphic":"http://openlayers.org/dev/img/marker-blue.png","strokeColor":"red","fillColor":"red","fillOpacity":0.7,"strokeWidth":2,"pointRadius":12}
        },
        "styleProperty":"_gx_style",
        "geoJson":{"type":"FeatureCollection",
        "features":[
            {"type":"Feature","id":"OpenLayers.Feature.Vector_52","properties":{"_gx_style":1},"geometry":{"type":"Polygon","coordinates":[[[15,47],[16,48],[14,49],[15,47]]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_61","properties":{"_gx_style":1},"geometry":{"type":"LineString","coordinates":[[15,48],[16,47],[17,46]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_64","properties":{"_gx_style":1},"geometry":{"type":"Point","coordinates":[16,46]}}]}
        ],
        "name":"vector","opacity":1}
    }
    */
    var wmsparams = {
        format_options : "dpi:300"
    };
    var layers = [];
    if ( MAP.hasLayer(AVAILABLE_LAYERS['photo']) ) {
        if ( MAP.getZoom() < 14 ) return alert("Before printing, zoom in closer.");

        // the photo base layer is a GeoServer cascade to a State of Ohio WMS service, but the Ohio WMS doesn't support large requests for printing
        // swap in the URL of a proxy service which fixes that
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/proxy/ohioimagery", opacity:1, singleTile:false, type:"WMS", layers:["0"], format:"image/png", styles:[""]  };
    }
    if ( MAP.hasLayer(AVAILABLE_LAYERS['photo']) || MAP.hasLayer(AVAILABLE_LAYERS['vector'])) {
        // the basemap is a tile service from TileStache, but printing can't do tile services
        // so we use the GeoServer WMS version, which does lack a bit in the image quality but does get the job done
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/gwms", opacity:1, singleTile:true, type:"WMS", layers:["group_basemap"], format:"image/jpeg", styles:[""], customParams:wmsparams };
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/gwms", opacity:1, singleTile:true, type:"WMS", layers:["cm:trails","cm:closures","cm:markers_other","cm:markers_swgh"], format:"image/png", styles:"", customParams:wmsparams };
    }
    if (DIRECTIONS_LINE && MAP.hasLayer(DIRECTIONS_LINE) ) {
        // Construct a list-of-lists multilinestring. Remember that OpenLayers and MFP do lng,lat instead of lat,lng
            // use non-API methods to iterate over the line components, collecting them into "vertices" to form a list of lists
        var vertices = [];
        for (var li in DIRECTIONS_LINE._layers) {
            var subline = DIRECTIONS_LINE._layers[li];
            var subverts = [];
            for (var i=0, l=subline._latlngs.length; i<l; i++) {
                subverts[subverts.length] = wgsToLocalSRS([ subline._latlngs[i].lng, subline._latlngs[i].lat ]);
            }
            vertices[vertices.length] = subverts;
        }

        // the styling is simply pulled from the styling constant
        var opacity = DIRECTIONS_LINE_STYLE.opacity;
        var color   = DIRECTIONS_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Directions Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // now the Start marker, which will always be present if there's a line
        //var iconurl  = ICON_FROM.options.iconUrl;
        var iconurl  = ICON_FROM.options.iconUrl.replace('maps.clevelandmetroparks.com','10.0.0.23').replace('https:','http:');
        var projdot  = wgsToLocalSRS(MARKER_FROM.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and the End marker, which will always be present if there's a line; copied from the Start marker above
        //var iconurl  = ICON_TO.options.iconUrl;
        var iconurl  = ICON_TO.options.iconUrl.replace('maps.clevelandmetroparks.com','10.0.0.23').replace('https:','http:');
        var projdot  = wgsToLocalSRS(MARKER_TO.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and as an afterthought, the text directions: try the Directions first, then see if there are Measure directions
        paper += " with directions";
        var tofrom1   = $('#directions_reverse').val()
        var tofrom2   = tofrom1 == 'to' ? 'from' : 'to';
        var placename = $('#directions_target_title').text();
        var addrname  = $('#directions_address').val();
        var via       = $('#directions_via option:selected').text().toLowerCase();
        var steps;
        if (tofrom1 && tofrom2 && placename && addrname) {
            page2title = "Directions\n" + tofrom1 + " " + placename + "\n" + tofrom2 + " " + addrname + "\n" + via;
            steps = $('#directions_steps li');
        } else {
            page2title = "Measurement directions";
            steps = $('#measure_steps li');
        }

        // process the directions steps into a plain text output
        // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
        var maxstepsperpage = 25;
        switch (paper) {
            case 'Letter portrait with directions':
                maxstepsperpage = 40;
                break;
            case 'Letter landscape with directions':
                maxstepsperpage = 31;
                break;
            case 'Ledger portrait with directions':
                maxstepsperpage = 65;
                break;
            case 'Ledger landscape with directions':
                maxstepsperpage = 45;
                break;
        }
        page2text1 = [];
        page2text2 = [];

        steps.each(function () {
            var steptext = $(this).find('.ui-li-heading').eq(0).text();
            var timedist = $(this).find('.ui-li-desc').eq(0).text();
            var linetext = steptext + "\n" + "     " + timedist;
            if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
            else                                     page2text2[page2text2.length] = linetext;
        });
        page2text1 = page2text1.join("\n");
        page2text2 = page2text2.join("\n");
    }
    if (HIGHLIGHT_LINE && MAP.hasLayer(HIGHLIGHT_LINE) ) {
        // the highlighting line, which we know to be a multilinestring
        // Remember that OpenLayers and MFP do lng,lat instead of lat,lng
        var vertices = [];
        var lines = HIGHLIGHT_LINE.getLatLngs();
        for (var li=0, ll=lines.length; li<ll; li++) {
            var thisline = [];
            for (vi=0, vl=lines[li].length; vi<vl; vi++) {
                thisline[thisline.length] = wgsToLocalSRS([ lines[li][vi].lng , lines[li][vi].lat ]);
            }
            vertices[vertices.length] = thisline;
        }

        // the styling is simply pulled from the styling constant
        var opacity = HIGHLIGHT_LINE_STYLE.opacity;
        var color   = HIGHLIGHT_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Highlight Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // if we're adding the HIGHLIGHT_LINE then perhaps this is a Loop we're showing
        // in which case add the directions text
        // the View On Map button, as usual, is our clearinghouse for the "last item of interest"
        var whats_showing = $('#show_on_map').data('zoomelement').attr('type');
        if (whats_showing == 'loop') {
            var steps = $('#moreinfo_steps li');
            paper += " with directions";
            page2title = $('#show_on_map').data('zoomelement').attr('title');

            // process the directions steps into a plain text output
            // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
            var maxstepsperpage = 25;
            switch (paper) {
                case 'Letter portrait with directions':
                    maxstepsperpage = 40;
                    break;
                case 'Letter landscape with directions':
                    maxstepsperpage = 31;
                    break;
                case 'Ledger portrait with directions':
                    maxstepsperpage = 65;
                    break;
                case 'Ledger landscape with directions':
                    maxstepsperpage = 45;
                    break;
            }
            page2text1 = [];
            page2text2 = [];

            steps.each(function () {
                var steptext = $(this).find('.ui-li-heading').eq(0).text();
                var timedist = $(this).find('.ui-li-desc').eq(0).text();
                var linetext = steptext + "\n" + "     " + timedist;
                if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
                else                                     page2text2[page2text2.length] = linetext;
            });
            page2text1 = page2text1.join("\n");
            page2text2 = page2text2.join("\n");
        }
    }
    if (MARKER_TARGET && MAP.hasLayer(MARKER_TARGET) ) {
        var iconurl  = ICON_TARGET.options.iconUrl;
        var projdot  = wgsToLocalSRS(MARKER_TARGET.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error

        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };
    }

    // finally done composing layers!
    // compose the client spec for MapFish Print
    var params = {
        "units":"feet",
        "srs":"EPSG:3734",
        "layout":paper,
        "dpi":300,
        "layers":layers,
        "pages": [
            { bbox:projbbox, rotation:"0", comment:comment }
        ],
        "layersMerging" : true,
        page2title:page2title, page2text1:page2text1, page2text2:page2text2
    };

    printMapPrepare(); // hide the Ready, show a Waiting spinner

    $.ajax({
        url: PRINT_URL, type:'POST',
        data: JSON.stringify(params), processData:false, contentType: 'application/json',
        success: function (reply) {
            // the returned URL has internal references, e.g. http://localhost/
            var url = reply.getURL;
            url = url.split('/'); url = url[url.length-1];
            url = PRINT_PICKUP_BASEURL + url;
            printMapDone(url); // hide the spinner, display a link, etc.
        },
        error: function (xhr,status,text) {
            alert("Printing failed. Please try again.");
            printMapDone(); // hide the spinner, display a link, etc.
        }
    });
}


// reproject from WGS84 (Leaflet coordinates) to Web Mercator (primarily for printing)
// accepts a L.LatLng or a two-item array [lng,lat]    (note that array is X,Y)
// returns a two-item list:  [ x,y ]  in Web mercator coordinates
function wgsToLocalSRS(dot) {
    var srsin    = new Proj4js.Proj('EPSG:4326');
    var srsout   = new Proj4js.Proj('EPSG:3734');
    var newdot   = dot.lat ? new Proj4js.Point(dot.lng,dot.lat) : new Proj4js.Point(dot[0],dot[1]);
    Proj4js.transform(srsin,srsout,newdot);
    return  [ newdot.x, newdot.y ];
}
