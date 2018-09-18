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
    // In native mobile our URL_PARAMS are not what we expect
    var protocol = (URL_PARAMS.attr('protocol') != 'file')
        ? URL_PARAMS.attr('protocol')
        : WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL;
    var host = (URL_PARAMS.attr('host'))
        ? URL_PARAMS.attr('host')
        : WEBAPP_BASE_URL_ABSOLUTE_HOST;
    // We used to get the current path, but this was to clarify between
    // /desktop/map and /mobile/map. Now that that's no longer necessary,
    // we can just use the base url path.
    var path = '/';

    // submit the long URL param string to the server, get back a short param string
    var params = {
        uri : path,
        querystring : SHARE_URL_STRING
    };
    $.get(API_BASEPATH + 'ajax/make_shorturl', params, function(shortstring) {
        if (! shortstring) {
            return alert("Unable to fetch a short URL.\nPlease try again.");
        }

        var url = protocol + '://' + host + '/url/' + shortstring;
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
