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
    var base = urlParams.get('base') || DEFAULT_LAYER;
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
                $.get(CM_MAPS_API_BASE_URL + 'trail_geometries/' + id, null, function (reply) {
                    if (reply.data.geom_geojson) {
                        var geom_geojson = JSON.parse(reply.data.geom_geojson);
                        drawHighlightLine(geom_geojson);
                    }
                });
                // Query API for trail elevation profile
                $.get(CM_MAPS_API_BASE_URL + 'trail_profiles/' + id, null, function (reply) {
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

    $.get(CM_MAPS_API_BASE_URL + 'geocode/' + addressSearchText, null, function (reply) {
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
    var layer = DEFAULT_LAYER;
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
