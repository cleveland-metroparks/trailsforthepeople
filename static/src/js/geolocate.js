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
 * Attempt to locate the user using the Geolocation API (via Leaflet).
 */
function enableGeolocate() {
    MAP.locate({ watch: true, enableHighAccuracy: true });
}

/**
 * If in Native app, trigger geolocation when Cordova's geolocation plugin has come online.
 */
$(function(){
    document.addEventListener("deviceready", enableGeolocate, false);
});

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
    zoom_to_user_geolocation();
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
 * Center and zoom to user's geolocation.
 */
function zoom_to_user_geolocation(latlng) {
    if (!latlng && LAST_KNOWN_LOCATION) {
        latlng = LAST_KNOWN_LOCATION;
    }
    if (latlng) {
        placeGPSMarker(latlng.lat, latlng.lng);
        MAP.panTo(latlng);
        if (MAP.getZoom() < 12) {
            MAP.setZoom(16);
        }
    }
}

/**
 * Update display of user's lat/lng in Settings pane.
 */
function update_user_latlon_display(latlng) {
    $('#gps_location').val(latlng_formatted(latlng));
}

/**
 * Handle geolocation update
 *
 * Update our last-known location, then do more calculations regarding it.
 */
$(document).ready(function () {
    MAP.on('locationfound', function(event) {
        // Update the user's last known location
        LAST_KNOWN_LOCATION = event.latlng;

        if (AUTO_CENTER_ON_LOCATION) {
            // Center and zoom, if we're following
            zoom_to_user_geolocation(event.latlng);
        } else {
            // Just mark the user's current location
            placeGPSMarker(event.latlng.lat, event.latlng.lng);
        }

        // Sort any visible distance-sorted lists
        // @TODO: Let's identify all such lists and see if there's a cleaner way.
        //sortLists();

        // Adjust the Near You Now listing
        // @TODO: Why do we do this again when opening the panel?
        // @TODO: Also, should this be mobile only?
        updateNearYouNow();

        // Check the Radar alerts to see if anything relevant is within range
        if ( $('#radar_enabled').is(':checked') ) {
            var meters = $('#radar_radius').val();
            var categories = [];
            $('input[name="radar_category"]:checked').each(function () { categories[categories.length] = $(this).val() });
            placeCircle(event.latlng.lat,event.latlng.lng,meters);
            checkRadar(event.latlng,meters,categories);
        }

        // Update display of user lat/lng
        update_user_latlon_display(event.latlng);
    });

    // Start constant geolocation, which triggers all of the 'locationfound' events above.
    // If the user is in the native app, we trigger once Cordova's geolocation plugin has come online.
    if (!NATIVE_APP) {
        enableGeolocate();
    }
});