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
function geolocateSuccess(event) {
    // Update the user's last known location
    LAST_KNOWN_LOCATION.lng = event.coords.longitude;
    LAST_KNOWN_LOCATION.lat = event.coords.latitude;
}

/**
 * Update display of user's lat/lng in Settings pane.
 */
function updateUserCoordsDisplay() {
    var coordsStr = LAST_KNOWN_LOCATION ? formatCoords(LAST_KNOWN_LOCATION) : 'unknown';
    $('#gps_location').val(coordsStr);
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
            var meters = $('#nearby-radius').val();
            var categories = [];
            $('input[name="nearby-category"]:checked').each(
                function () {
                    categories[categories.length] = $(this).val()
                }
            );
            var current_location = mapboxgl.LngLat.convert([event.coords.longitude, event.coords.latitude]);
            placeCircle(current_location, meters);
            checkNearby(current_location, meters, categories);
        }

        // Update display of user lat/lng
        updateUserCoordsDisplay();
    });

    // @TODO: Catch disabling of geolocation control
    //   (which Mapbox GL JS currently doesn't provide a handler for...
    //    see https://github.com/mapbox/mapbox-gl-js/issues/5136 --
    //    there's also a workaround there)
    // and then clearCirle() when we see it.

    basicGeolocate();
});