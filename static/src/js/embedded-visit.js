 /**
 * embedded.js
 *
 * CM Parks Visit page: external embedded map.
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */

const API_ENDPOINT_GEOCODE = API_BASEPATH + 'ajax/geocode';
const API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES = API_BASEPATH + 'ajax/get_attractions_by_activity';
const API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';

var markerLayer = L.featureGroup();
var userLocation;

$(document).ready(function(){

    /**
     * Initial map setup
     */
    var mapOptions = { base:'map' };

    // Load the map.
    initMap(mapOptions);

    // Disable scrollwheel-driven map zooming so the user can scroll down the page.
    MAP.scrollWheelZoom.disable();


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

    /**
     * Make the right call, based on options
     */
    if (activities) {
        if (geolocate_enabled) {
            data.get_attractions_url = API_ENDPOINT_ATTRACTIONS_WITH_ACTIVITIES_NEARBY;

            if (userLocation) {
                data.lat = userLocation.lat;
                data.lng = userLocation.lng;
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

    // Geolocation found handler
    MAP.on('locationfound', function(event) {
        // Mark the user's current location
        placeGPSMarker(event.latlng.lat, event.latlng.lng);

        userLocation = event.latlng;

        // Auto-center
        if (MAX_BOUNDS.contains(event.latlng)) {
            MAP.panTo(event.latlng);
        } else {
            showInfoPopup('Sorry, your current location is too far away.', 'warning');
            console.log('Geolocation out of bounds: ', userLocation);
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
* Disable geolocation:
* - ensure the button is un-checked,
* - remove our stored location, and
* - remove the marker.
*/
function disableGeolocation() {
   // $('.interactive-form-distance-near-me-input').prop('checked', false);
   userLocation = null;
   clearGPSMarker();
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
            var latlng = L.latLng(reply.lat, reply.lng);
            // Point outside service area
            if (! MAX_BOUNDS.contains(latlng) ) {
                showInfoPopup("The location we found for your address is too far away.", 'warning');
                return;
            }

            // Add a marker for their location
            placeGPSMarker(reply.lat, reply.lng);
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
    var i, result;
    for (i = 0; i < activities.length; i += 1) {
        result = activities[i];

        marker = new L.marker([result.lat, result.lng], {
            clickable: true,
            draggable: false,
            icon: ICON_TARGET
        }).bindPopup(attractionPopupMarkup(result));

        markerLayer.addLayer(marker);
    }
    markerLayer.addTo(MAP);

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