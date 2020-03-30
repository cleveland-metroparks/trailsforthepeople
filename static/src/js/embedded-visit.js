 /**
 * embedded.js
 *
 * CM Parks Visit page: external embedded map.
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */


var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES = API_BASEPATH + 'ajax/get_attractions_by_activity';
var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';

var USER_LOCATION;

var ALL_MARKERS = [];

$(document).ready(function() {
    /**
     * Set up the map
     */
    var mapOptions = {
        base: 'map',
        scrollZoom: false,
        trackUserLocation: false
    };
    initMap(mapOptions);

    processQueryParams();

    /**
     * Geolocate user on Near Me button click
     */
    $('#nearme').click(function() {
        if ($('#nearme').prop('checked')) {
            basicGeolocate();
        } else {
            disableGeolocation();
        }
    });
});

$(document).on("mapInitialized", function () {
    // Geolocation found handler
    ctrlGeolocate.on("geolocate", function(event) {
        var lngLat = new mapboxgl.LngLat(event.coords.longitude, event.coords.latitude);

        geolocateSuccess(lngLat);

        // Auto-center
        if (MAX_BOUNDS.contains(lngLat)) {
            // console.log('ease');
            // MAP.easeTo({center: lngLat});
        } else {
            showInfoPopup('Sorry, your current location is too far away.', 'warning');
            console.log('Geolocation out of bounds: ', USER_LOCATION);
            disableGeolocation();
        }
    });
    // Geolocation error handler
    MAP.on('locationerror', function(error) {
        showInfoPopup('We couldn\'t acquire your current location.', 'error');
        console.log('Geolocation error: ' + error.message + '(' + error.code + ')');
        disableGeolocation();
    });

});

/**
 * Process query parameters
 */
function processQueryParams() {
    var urlParams = new URLSearchParams(location.search);

    // Activities
    var activities = null;
    if (urlParams.has('activitytype')) {
        activities = urlParams.get('activitytype').split("|");
    }

    // Location text
    var location_searchtext;
    if (urlParams.has('location')) {
        location_searchtext = urlParams.get('location');
    }

    // Geolocate
    var geolocate_enabled = (urlParams.has('nearme') && urlParams.get('nearme') == 'True');
    // We initially geolocate when the "Near Me" button is clicked,
    // but on form submit page reload, need to re-initiate in order
    // to show the user's marker on the map.
    if (geolocate_enabled) {
        basicGeolocate();
    }

    // Lat/Long
    if (urlParams.has('lat') && urlParams.has('long')) {
        var lat = parseFloat(urlParams.get('lat'));
        var lng = parseFloat(urlParams.get('long'));
    }

    // Within distance
    var distance_miles, distance_feet;
    if (urlParams.has('distance')) {
        distance_miles = urlParams.get('distance');
        distance_feet = 5280 * distance_miles;
    }
    distance_feet = Number.isInteger(distance_feet) ? distance_feet : 0;

    // Begin assembling API call data
    var data = {
        activity_ids: activities,
        within_feet: distance_feet
    };

    /**
     * Make the right call, based on options
     */
    if (activities) {
        if (geolocate_enabled) {
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;

            if (USER_LOCATION !== null && USER_LOCATION !== undefined) {
                data.lat = USER_LOCATION.coords.latitude;
                data.lng = USER_LOCATION.coords.longitude;
            } else if (lat && lng) {
                data.lat = lat;
                data.lng = lng;
            } else {
                // No lat/lng. Don't do nearby search.
                data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES;
            }
            callGetAttractions(data);
        } else if (location_searchtext) {
            // Search attractions nearby geocoded address
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;
            // data.searchtext = location_searchtext;

            // Geocode address
            callGeocodeAddress(location_searchtext).then(function(reply, textStatus, jqXHR) {
                // Add new lat/lng to the data object.
                data.lat = reply.data.lat;
                data.lng = reply.data.lng;

                callGetAttractions(data);
            });
        } else {
            // Search activities without nearby
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES;
            delete data.within_feet;
            callGetAttractions(data);
        }
    }
}

/**
 * Attempt to locate the user using the browser's native geolocation.
 */
function basicGeolocate() {
    navigator.geolocation.getCurrentPosition(geolocateSuccess, null, { enableHighAccuracy: true });
}

/**
 * Callback for geolocation success, whether via basicGeolocate() or ctrlGeolocate.
 */
function geolocateSuccess(lngLat) {
    USER_LOCATION = lngLat;
}

/**
* Disable geolocation:
* - ensure the button is un-checked, and
* - remove our stored location
*/
function disableGeolocation() {
    USER_LOCATION = null;
}

/**
 * Get activities (AJAX)
 *
 * Works with Nearby and without.
 */
function callGetAttractions(params) {
    return $.ajax({
        url: params.get_attractions_url,
        dataType: 'json',
        data: params
        })
        .done(function(reply) {
            displayActivities(reply.results);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGetAttractions error');
            console.log(textStatus + ': ' + errorThrown);
        });
}

/**
 * Geocode address (AJAX)
 */
function callGeocodeAddress(addressSearchText) {
    return $.get(API_NEW_BASE_URL + 'geocode/' + addressSearchText, null, function (reply) {
        var lngLat = new mapboxgl.LngLat(reply.data.lng, reply.data.lat);
        // Point outside service area
        if (!MAX_BOUNDS.contains(lngLat)) {
            showInfoPopup("The location we found for your address is too far away.", 'warning');
            return;
        }
        // @TODO: GLJS: Add a marker for their location (fake the geolocation marker?)
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        console.log(textStatus + ': ' + errorThrown);
        showInfoPopup("We couldn't find that address or city.\nPlease try again.", 'warning');
    });
}

/**
 * Clear all markers
 */
function clearMarkers() {
    if (ALL_MARKERS !== null && ALL_MARKERS.length > 0) {
        for (var i=ALL_MARKERS.length-1; i>=0; i--) {
            ALL_MARKERS[i].remove();
        }
    }
}

/**
 * Display activities on the map.
 */
function displayActivities(activities) {
    clearMarkers();
    for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];

        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(attractionPopupMarkup(activity));

        var marker = new mapboxgl.Marker()
            .setLngLat([activity.lng, activity.lat])
            .setPopup(popup)
            .addTo(MAP);

        ALL_MARKERS.push(marker);
    }

    MAP.fitBounds(MAX_BOUNDS);
}

/**
 * Make marker popup
 */
function attractionPopupMarkup(attraction) {
    // Only show description & thumbnail if we have room for tall popups
    showImage = ($("#map_canvas").height() >= 500);

    markup = "<h3>" + attraction.name + "</h3>";

    if (typeof attraction.description === 'string') {
        attraction.description = shortenStr(attraction.description, 100, true);
        markup += "<p>" + attraction.description + "</p>";
    }

    if (typeof attraction.cmp_url === 'string') {
        markup += '<p><a href="' + attraction.cmp_url + '" title="Find out more about ' + attraction.name + '." target="_blank">More info</a></p>';
    }

    if (showImage && attraction.thumbnail) {
        // Remove "~/" and prepend CM site URL
        thumbnailPath = CM_SITE_BASEURL + attraction.thumbnail.replace('~/', '');
        // Get original width & height from image URL
        origWidth = thumbnailPath.match(/width=(\d*)/);
        origHeight = thumbnailPath.match(/height=(\d*)/);
        if (Array.isArray(origWidth) && Array.isArray(origHeight)) {
            origWidth = origWidth[1];
            origHeight = origHeight[1];
            // Figure out new width for image if width fixed to 220px
            thumbnailWidth = 180;
            thumbnailHeight = (origHeight / origWidth) * thumbnailWidth;
            // Remake the URL with specified height to get a resized version of the image
            thumbnailPath = thumbnailPath.replace(/width=(\d*)\&height=(\d)*\&/, 'height=' + thumbnailHeight + '&');
            // Build the img markup
            markup += '<div style="text-align:center">';
            markup += '<img src="' + thumbnailPath + '" height="' + thumbnailHeight + '" width="' + thumbnailWidth + '" alt="' + attraction.name + '" /></div>';
            markup += '</div>';
        }
    }

    mapLink = WEBAPP_BASEPATH + 'mobile?type=attraction&gid=' + attraction.gid;
    markup += '<p><a href="' + mapLink + '" target="_blank">See on full map </a></p>';

    return markup;
}