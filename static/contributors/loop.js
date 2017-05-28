$(window).load(function () {

/**
 * Initialize the map.
 */
initContributorMap();

// our version of a WMS GetFeatureInfo control: a map click calls query.php to get JSON info, and we construct a bubble
MAP.on('contextmenu', function (event) {

    var data = {};

    // buffer the click point a little to make a box
    var sw = MAP.layerPointToLatLng(new L.Point(event.layerPoint.x - 15 , event.layerPoint.y - 15));
    var ne = MAP.layerPointToLatLng(new L.Point(event.layerPoint.x + 15 , event.layerPoint.y + 15));
    data.w = sw.lng;
    data.s = sw.lat;
    data.e = ne.lng;
    data.n = ne.lat;
    data.zoom = MAP.getZoom();
    var anchor = new L.LatLng(event.latlng.lat,event.latlng.lng);

    // do the AJAX thing
    $.get(API_BASEPATH + 'ajax/query', data, function (html) {
        if (!html) return;
        var popup = new L.Popup();
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
});

/**
 * Widgets for start and expiration dates
 */
$('input[name="expires"]').datepicker({
    dateFormat: 'yy-mm-dd'
});

$('#expires_never').click(function () {
    $('input[name="expires"]').val('');
});

$('input[name="startdate"]').datepicker({
    dateFormat: 'yy-mm-dd'
});

$('#startdate_today').click(function () {
    var today = new Date().yyyymmdd();
    $('input[name="startdate"]').val(today);
});

/**
 * Add Waypoint button
 *
 * Pick the map's center, create a marker, populate the text fields, make rough route calculation.
 */
$('.wpadd').click(function () {
    var row    = $(this).closest('li');
    var wpid   = row.prop('id');

    // the marker will load from the text fields; if the fields currently have no value, use the map center
    var lat = parseFloat( row.find('.lat').val() );
    var lng = parseFloat( row.find('.lng').val() );
    if (!lat || !lng) {
        var center = MAP.getCenter();
        row.find('.lat').val(center.lat);
        row.find('.lng').val(center.lng);
    }

    // add the marker, and its drag handler to update the text box
    if (!MARKERS[wpid]) {
        var lat    = parseFloat( row.find('.lat').val() );
        var lng    = parseFloat( row.find('.lng').val() );
        var center = new L.LatLng(lat,lng);

        MARKERS[wpid] = new L.marker(center, {
            clickable: true,
            draggable: true,
            icon: L.mapbox.marker.icon({
                'marker-symbol': wpid.substr(2) // strip leading 'wp'
            })
        });

        MARKERS[wpid].wpid = wpid;
        MAP.addLayer(MARKERS[wpid]);

        MARKERS[wpid].on('dragend', function (event) {
            var latlng = this.getLatLng();
            $('#' + this.wpid).find('.lat').val(latlng.lat);
            $('#' + this.wpid).find('.lng').val(latlng.lng);
            generateRoughCut();
        });
    }

    // recalculate the rough cut
    generateRoughCut();

    // hide this button, show the opposite
    $(this).hide();
    $(this).siblings('.wpremove').show();
});

/**
 * Remove Waypoint button
 *
 * Remove the marker, clear the text fields, make rough route calculation.
 */
$('.wpremove').click(function () {
    var row  = $(this).closest('li');
    var wpid = row.prop('id');

    // clear the text fields
    row.find('.lat').val(0);
    row.find('.lng').val(0);

    // remove the marker
    if (MARKERS[wpid]) {
        MAP.removeLayer(MARKERS[wpid]);
        MARKERS[wpid] = null;
    }

    // recalculate the rough cut
    generateRoughCut();

    // hide this button, show the opposite
    $(this).hide();
    $(this).siblings('.wpadd').show();
});

/**
 * Random loop generator
 */
$('#random_button').click(function () {
    // fetch Waypoint 0 and bail if it's not set
    var wp0lat = parseFloat( $('#wp0 .lat').val() );
    var wp0lng = parseFloat( $('#wp0 .lng').val() );
    if (! wp0lat || ! wp0lng ) return alert("Pan and center the map and place Waypoint 0 to define your start.");

    // clear the existing waypoints
    $('.wpremove:visible').click();

    // visual effects: disable the button
    var button = $(this);
    button.val( button.attr('value0') );
    button.attr("disabled", "disabled");

    // get the center and radius, GET them to the server
    var center = MAP.getCenter();
    var miles  = $('#random_miles').val();
    var closed = parseInt( $('[name="closedloop"]').val() );
    var filter = $('select[name="terrain_filter"]').val();
    var params = { lat:wp0lat, lng:wp0lng, miles:miles, closed:closed, filter:filter };
    $.get(API_BASEPATH + 'ajax/randomwaypoints', params, function (reply) {
        // re-enable the button
        button.val( button.attr('value1') );
        button.removeAttr("disabled");

        if (! reply.length) return alert(reply);

        // the return is an array of waypoint objects: WP#, lat, lng
        // load them into the corresponding WP boxes
        for (var i=0, l=reply.length; i<l; i++) {
            var div = $('#wp' + reply[i].wp );
            div.find('.lat').val( reply[i].lat );
            div.find('.lng').val( reply[i].lng );
            div.find('.wpadd').click();
        }
    }, 'json');
});

/**
 * Load the loop
 */
loadLoop();

});
// end of window.load callback

/**
 * Load loop
 *
 * if there's a loop, a technique for loading the existing loop into the waypoint boxes and the map
 * if not, simply hide the 'remove' buttons because there's nothing yet and we're already done
 */
function loadLoop() {
    // phase 1: lay down markers for any waypoints that are populated
    $('#waypoints .waypoint').each(function () {
        // the waypoint's lat/lng are already loaded into the text fields
        var lat = parseFloat( $(this).find('.lat').val() );
        var lng = parseFloat( $(this).find('.lng').val() );

        // click either the Add or Remove button; their actions will show/hide markers, show/hide buttons, et cetera
        if (lat && lng) {
            $(this).find('.wpadd').click();
        } else {
            $(this).find('.wpremove').click();
        }
    });

    // phase 2: zoom to the collected extent of the markers
    zoomToMarkersExtent();

    // phase 3: load the saved geometry (if any), the rough cut (marker-to-marker segments), and the elevation profile
    generateRoughCut();
    var wkt = $('input[name="wkt"]').val();
    if (wkt) renderWKTtoMap(wkt);
    //var elev = $('input[name="elevation_profile"]').val();
    //if (elev) renderElevationProfile(elev);

    // phase 4: load the directions
    // @TODO: Fix this now that we don't have PHP access in our JS.
    renderDirections(loop_steps);
}