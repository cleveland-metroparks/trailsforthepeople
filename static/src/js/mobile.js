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
// We don't resize the map programmatically or hide/show the map with CSS.
// See https://docs.mapbox.com/mapbox-gl-js/api/map/#map#resize
// and https://github.com/mapbox/mapbox-gl-js/pull/9083
//
///**
// * Refresh the map on resize or orientation change to prevent a flash/disappearance.
// */
//$(document).on("mapInitialized", function () {
//    $(window).bind('orientationchange pageshow resize', function() {
//        MAP.resize();
//    });
//});

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
                // Loop
                var feature = {
                    type: 'loop',
                    gid: urlParams.get('gid')
                };

                // @TODO: Lookup loop feature.

                showFeatureInfo(featureType, feature);
                break;
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
        getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via);
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
            console.log('ERROR in make_activity_icons_list(): Activity ' + activity_id + ' does not exist.');
        }
    });
    return imgs_list;
}

/**
 * Show "Attraction Info" content
 */
function showFeatureInfoContent(attractionType, id) {
    // console.log('showFeatureInfoContent');
    // console.log('attractionType:', attractionType);
    // console.log('id:', id);
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

            var template_vars = {
                feature: attraction,
                activity_icons: activity_icons,
                img: img_props,
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
                var trail = CM.trails[id];
                var template = CM.Templates.info_trail;
                var template_vars = {
                    feature: trail,
                    img_src: 'static/images/loops/' + trail.id + '.jpg'
                };
                $('#info-content').html(template(template_vars));
            } else {
                console.log("ERROR: loop id: " + id + " does not exist in CM.trails (app_view_trails).");
            }
            break;
    }
}

/**
 * Show Elevation
 */
function showElevation(url) {
    $('#elevation').prop('src',url);
    sidebar.open('pane-elevationprofile');
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
    $('#directions_target_lat').val(feature.lat);
    $('#directions_target_lng').val(feature.lng);
    $('#directions_target_type').val(feature.type);
    $('#directions_target_gid').val(feature.gid);
    $('#directions_target_title').text(feature.title);
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
    // console.log('showFeatureInfo');
    // console.log('attractionType: ', attractionType);
    // console.log('attraction: ', attraction);

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

    // Enable "Get Directions"
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

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

        update_user_latlon_display();
    }
}

/**
 * Set user's coordinate format setting from session config.
 */

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
