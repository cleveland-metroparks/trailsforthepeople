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
        makeAndShowShortURL();
        sidebar.open('pane-share');
    });
});

/**
 * Hide Share URL
 */
function showShareURL() {
    $('#share_url_controls').show();
    $('#make_share_url_controls').hide();
    setShareURLBoxWidth();
}

/**
 * Show Share URL
 */
function hideShareURL() {
    $('#share_url_controls').hide();
    $('#make_share_url_controls').show();
}

/**
 * Populate Share box
 *
 * Request [from the server] a shortened version of the current URL,
 * and put this into the share box.
 */
function makeAndShowShortURL() {
    var baseUrl = '/';

    var queryString = WINDOW_URL;
    // Remove leading '/?'
    if (queryString.charAt(0) == '/') {
        queryString = queryString.substr(1);
    }
    if (queryString.charAt(0) == '?') {
        queryString = queryString.substr(1);
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

        // In native mobile our URL_PARAMS are not what we expect
        var protocol = (URL_PARAMS.attr('protocol') != 'file')
            ? URL_PARAMS.attr('protocol')
            : WEBAPP_BASE_URL_ABSOLUTE_PROTOCOL;
        var host = (URL_PARAMS.attr('host'))
            ? URL_PARAMS.attr('host')
            : WEBAPP_BASE_URL_ABSOLUTE_HOST;

        var url = protocol + '://' + host + '/url/' + shortURLString;

        $('#share_url').val(url);
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
 * Update Share URL by Feature
 *
 * Element form: take an element compatible with zoomToElement() and create an URL which will load its info on page load
 */
function updateShareUrlByFeature(element) {
    // only 2 params, taken from the element: its type and its name
    var params = {};
    params.type = element.attr('type');
    params.name = element.attr('title');

    // compile all of the params together and save it to the global. this is later read by makeAndShowShortURL()
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
