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
    // Re-prepend with '/?'
    queryString = '/?' + queryString;

    // submit the long URL param string to the server, get back a short param string
    var data = {
        querystring : queryString
    }
    $.post(API_NEW_BASE_URL + 'shorturls/', data, function(reply) {
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
