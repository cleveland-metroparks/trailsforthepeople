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
 * Attempt to locate the user using the browser's native geolocation.
 *
 * We don't use ctrlGeolocate here because it is set up to follow, whereas
 * we just want a single check here.
 */
function basicGeolocate() {
    navigator.geolocation.getCurrentPosition(geolocateSuccess, null, { enableHighAccuracy: true });
}

/**
 * Callback for geolocation success, whether via basicGeolocate() or ctrlGeolocate.
 */
function geolocateSuccess(position) {
    // Update the user's last known location
    LAST_KNOWN_LOCATION.lng = position.coords.longitude;
    LAST_KNOWN_LOCATION.lat = position.coords.latitude;
}

/**
* If in Native app, trigger geolocation when Cordova's geolocation plugin has come online.
* @TODO: GLJS: Do we need to wait for this to enable ctrlGeolocate?
*/
(function() {
   document.addEventListener("deviceready", basicGeolocate, false);
});

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
    ctrlGeolocate.on("geolocate", function(event) {
        // Update the user's last known location
        geolocateSuccess(event);

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
            var current_location = mapboxgl.LngLat.convert([event.coords.longitude, event.coords.latitude]);
            placeCircle(current_location, meters);
            checkNearby(current_location, meters, categories);
        }

        // Update display of user lat/lng
        update_user_latlon_display(event.latlng);
    });

    // @TODO: Catch disabling of geolocation control
    //   (which Mapbox GL JS currently doesn't provide a handler for...
    //    see https://github.com/mapbox/mapbox-gl-js/issues/5136 --
    //    there's also a workaround there)
    // and then clearCirle() when we see it.

    // Start constant geolocation, which triggers all of the 'locationfound' events above,
    // unless the user is in the native app, in which case we trigger this when
    // Cordova's geolocation plugin has come online (see "deviceready", above).
    if (!NATIVE_APP) {
        basicGeolocate();
    }
});