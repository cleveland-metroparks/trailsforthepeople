 /**
 * embedded.js
 *
 * CM Parks Visit page: external embedded map.
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */

var API_ENDPOINT_GEOCODE = API_BASEPATH + 'ajax/geocode';
var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES = API_BASEPATH + 'ajax/get_attractions_by_activity';
var API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';

var USER_LOCATION;

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

    /**
     * Process query params
     */
    var urlParams = new URLSearchParams(location.search);

    // Activities
    if (urlParams.has('activitytype')) {
        var activities = urlParams.get('activitytype').split("|");
    }

    // Location text
    var location_searchtext;
    if (urlParams.has('location')) {
        location_searchtext = urlParams.get('location');
    }

    // Geolocate
    var geolocate_enabled = (urlParams.has('nearme') && urlParams.get('nearme') == 'True');

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

    // We initially geolocate when the "Near Me" button is clicked,
    // but on form submit page reload, need to re-initiate in order
    // to show the user's marker on the map.
    if (geolocate_enabled) {
        MAP.locate({watch: false, enableHighAccuracy: true});
    }

    /**
     * Make the right call, based on options
     */
    if (activities) {
        if (geolocate_enabled) {
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;

            if (USER_LOCATION) {
                data.lat = USER_LOCATION.lat;
                data.lng = USER_LOCATION.lng;
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
            data.searchtext = location_searchtext;

            // Geocode address
            callGeocodeAddress(data).then(function(reply, textStatus, jqXHR) {
                // Add new lat/lng to the data object.
                data.lat = reply.lat;
                data.lng = reply.lng;

                callGetAttractions(data);
            });
        } else {
            // Search activities without nearby
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES;
            delete data.within_feet;
            callGetAttractions(data);
        }
    }

    /**
     * Geolocate user
     */
    $('#nearme').click(function() {
        if ($('#nearme').prop('checked')) {
            MAP.locate({watch: false, enableHighAccuracy: true});
        } else {
            MAP.stopLocate();
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
   // $('.interactive-form-distance-near-me-input').prop('checked', false);
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
function callGeocodeAddress(params) {
    var data = {};
    data.address  = params.searchtext;
    data.bing_key = BING_API_KEY;
    data.bbox     = GEOCODE_BIAS_BOX;

    return $.ajax({
        url: API_ENDPOINT_GEOCODE,
        dataType: 'json',
        data: data
        })
        .done(function(reply) {
            var lngLat = new mapboxgl.LngLat(reply.lng, reply.lat);
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
 * Display activities on the map.
 */
function displayActivities(activities) {
    for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];

        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(attractionPopupMarkup(activity));

        var marker = new mapboxgl.Marker()
            .setLngLat([activity.lng, activity.lat])
            .setPopup(popup)
            .addTo(MAP);
    }

    MAP.fitBounds(MAX_BOUNDS);
}

/**
 * Make marker popup
 */
function attractionPopupMarkup(attraction) {
    // Only show description & thumbnail if we have room for tall popups
    showAll = ($("#map_canvas").height() >= 500);

    markup = "<h3>" + attraction.name + "</h3>";

    if (showAll && attraction.description) {
        markup += "<p>" + attraction.description + "</p>";
    }

    if (attraction.cmp_url) {
        markup += '<p><a href="' + attraction.cmp_url + '" title="Find out more about ' + attraction.name + '." target="_blank">More info</a></p>';
    }

    if (showAll && attraction.thumbnail) {
        // Remove "~/" and prepend CM site URL
        thumbnail_path = CM_SITE_BASEURL + attraction.thumbnail.replace('~/', '');
        // Resize image:
        thumbnail_height = 150;
        thumbnail_path = thumbnail_path.replace(/width=\d*\&height=\d*\&/, 'height=' + thumbnail_height + '&');
        markup += '<img src="' + thumbnail_path + '" height="' + thumbnail_height + '" alt="' + attraction.name + '" />';
    }

    map_link = WEBAPP_BASEPATH + 'mobile?type=attraction&gid=' + attraction.gid;
    markup += '<p><a href="' + map_link + '" target="_blank">See on full map </a></p>';

    return markup;
}