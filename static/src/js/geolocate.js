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
 * Toggle GPS
 */
function toggleGPS() {
    AUTO_CENTER_ON_LOCATION ? toggleGPSOff() : toggleGPSOn();
}

/**
 * Toggle GPS On
 */
function toggleGPSOn() {
    AUTO_CENTER_ON_LOCATION = true;
    var iconurl = is_ios() ? '/static/images/map_controls/mapbutton_gps_ios_on.png' : '/static/images/map_controls/mapbutton_gps_on.png';
    $('#mapbutton_gps img').prop('src',iconurl);
}

/**
 * Toggle GPS Off
 */
function toggleGPSOff() {
    AUTO_CENTER_ON_LOCATION = false;
    var iconurl = is_ios() ? '/static/images/map_controls/mapbutton_gps_ios_off.png' : '/static/images/map_controls/mapbutton_gps_off.png';
    $('#mapbutton_gps img').prop('src',iconurl);
}

/**
 * Turn GPS off on page load
 *
 * iOS and non-iOS get different icons for the GPS button so it's important
 * to trigger this now so the right icon is chosen.
 */
$(window).load(function () {
    toggleGPSOff();
});

/**
 * Turn off GPS mode if map canvas is swiped.
 */
$(window).load(function () {
    $('#map_canvas').bind('swipe', function () {
        toggleGPSOff();
    });
});

/**
 * Handle geolocation update
 *
 * Update our last-known location, then do more calculations regarding it.
 */
$(window).load(function () {
    MAP.on('locationfound', function(event) {
        // update our last known location
        LAST_KNOWN_LOCATION = event.latlng;

        // mark our current location, and center the map
        placeGPSMarker(event.latlng.lat,event.latlng.lng)
        if (AUTO_CENTER_ON_LOCATION) {
            var iswithin = MAX_BOUNDS.contains(event.latlng);
            if (iswithin) {
                MAP.panTo(event.latlng);
                if (MAP.getZoom() < 12) MAP.setZoom(16);
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

    // this is a one-time location trigger: we need to turn on auto-centering when the page first loads so the map centers,
    // but we want to disable it again so we don't get annoying by moving the map away from the user's pans and searches.
    // Thus, a self-disabling callback.
    // BUT... we only do this whole thing if there were no URL params given which would override it
    if (! URL_PARAMS.attr('query')) {
        AUTO_CENTER_ON_LOCATION = true;
        var disableMe = function(event) {
            AUTO_CENTER_ON_LOCATION = false;
            MAP.off('locationfound', disableMe);
        };
        MAP.on('locationfound', disableMe);
    }

    // start constant geolocation, which triggers all of the 'locationfound' events above
    MAP.locate({ watch: true, enableHighAccuracy: true });

    // debug: to simulate geolocation: when the map is clicked, trigger a location event as if our GPS says we're there
    /*
    MAP.on('click', function (event) {
        MAP.fireEvent('locationfound', { latlng:event.latlng });
    });
    */
});