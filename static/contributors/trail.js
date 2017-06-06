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
    $.get(APP_BASEPATH + 'ajax/query', data, function (html) {
        if (!html) return;
        var popup = new L.Popup();
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
});

/**
 * Closure schedule
 *
 * Only show the "Schedule" fieldset when "By schedule" is selected
 */
$(".form-control[name='status']").change(function() {
    if (this.value == 'By schedule') {
        $('.schedule-options-group').slideDown();
    } else {
        $('.schedule-options-group').slideUp();
    }
})
// Open date datepicker
$('input[name="startdate"]').datepicker({
    dateFormat: 'yy-mm-dd'
});
$('#startdate_today').click(function () {
    var today = new Date().yyyymmdd();
    $('input[name="startdate"]').val(today);
});
// Close date datepicker
$('input[name="expires"]').datepicker({
    dateFormat: 'yy-mm-dd'
});
$('#expires_never').click(function () {
    $('input[name="expires"]').val('');
});

/**
 * Load the trail
 */
loadTrail();

});
// end of window.load callback

/**
 * Load trail
 *
 * if there's a trail, a technique for loading the existing trail into the waypoint boxes and the map
 * if not, simply hide the 'remove' buttons because there's nothing yet and we're already done
 */
function loadTrail() {
    // phase 1: lay down markers for any waypoints that are populated
    $('#waypoints .waypoint').each(function () {
        // the waypoint's lat/lng are already loaded into the text fields
        var lat = parseFloat( $(this).find('.lat').val() );
        var lng = parseFloat( $(this).find('.lng').val() );

        // click either the Add or Remove button; their actions will show/hide markers, show/hide buttons, et cetera
        if (lat && lng) {
            $(this).find('.wp_place').click();
        } else {
            $(this).find('.wp_remove').click();
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
    renderDirections(trail_steps);
}