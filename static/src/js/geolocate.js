 /**
 * geolocate.js
 *
 * JS for geolocation functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

// @TODO: GLJS REMOVE?
///**
// * Attempt to locate the user using the Geolocation API (via Leaflet).
// */
//function enableGeolocate() {
//    // MAP.locate({ watch: true, enableHighAccuracy: true });
//    // ctrlGeolocate.trigger();
//}

// @TODO: GLJS REMOVE?
//**
//* If in Native app, trigger geolocation when Cordova's geolocation plugin has come online.
//* @TODO: GLJS: Do we need to wait for this to enable ctrlGeolocate?
//*/
//(function(){
//   document.addEventListener("deviceready", enableGeolocate, false);
//);

/**
 * Update display of user's lat/lng in Settings pane.
 */
function update_user_latlon_display(latlng) {
    if (!latlng && LAST_KNOWN_LOCATION) {
        latlng = LAST_KNOWN_LOCATION;
    }
    if (latlng) {
        latlng_str = latlng_formatted(latlng)
    } else {
        latlng_str = 'unknown';
    }
    $('#gps_location').val(latlng_str);
}

/**
 * Handle geolocation update
 *
 * Update our last-known location, then do more calculations regarding it.
 */
$(document).on("mapInitialized", function () {
    MAP.on('locationfound', function(event) {
        console.log('locationfound');
        // Update the user's last known location
        LAST_KNOWN_LOCATION = event.latlng;

        // @TODO: GLJS REMOVE
        //if (AUTO_CENTER_ON_LOCATION) {
        //    // Center and zoom, if we're following
        //    zoom_to_user_geolocation(event.latlng);
        //} else {
        //    // Just mark the user's current location
        //    placeGPSMarker(event.latlng.lat, event.latlng.lng);
        //}

        // Sort any visible distance-sorted lists
        // @TODO: Let's identify all such lists and see if there's a cleaner way.
        //sortLists();

        // Adjust the Near You Now listing
        // @TODO: Why do we do this again when opening the panel?
        // @TODO: Also, should this be mobile only?
        updateNearYouNow();

        // Check the Nearby alerts to see if anything relevant is within range
        if ( $('#nearby_enabled').is(':checked') ) {
            var meters = $('#nearby_radius').val();
            var categories = [];
            $('input[name="nearby_category"]:checked').each(
                function () {
                    categories[categories.length] = $(this).val()
                }
            );
            placeCircle(event.latlng.lat, event.latlng.lng, meters);
            checkNearby(event.latlng, meters, categories);
        }

        // Update display of user lat/lng
        update_user_latlon_display(event.latlng);
    });

    // @TODO: GLJS REMOVE?
    //// Start constant geolocation, which triggers all of the 'locationfound' events above,
    //// unless the user is in the native app, in which case we trigger this when
    //// Cordova's geolocation plugin has come online (see "deviceready", above).
    //if (!NATIVE_APP) {
    //    enableGeolocate();
    //}
});