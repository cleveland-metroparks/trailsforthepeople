 /**
 * embedded-visit.js
 *
 * CM Parks Visit page: external embedded map.
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */

var USER_LOCATION;

var ALL_MARKERS = [];

$(document).ready(function() {
    /**
     * Set up the map
     */
    var mapOptions = {
        base: DEFAULT_LAYER,
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
            basicGeolocate_visit();
        } else {
            disableGeolocation();
        }
    });
});

$(document).on("mapInitialized", function () {
    // Geolocation found handler
    ctrlGeolocate.on("geolocate", function(event) {
        var lngLat = new mapboxgl.LngLat(event.coords.longitude, event.coords.latitude);
        geolocateSuccess_visit(event);

        // Auto-center
        if (MAX_BOUNDS.contains(lngLat)) {
            // MAP.easeTo({center: lngLat});
        } else {
            showInfoPopup('Sorry, your current location is too far away.', 'warning');
            console.error('Geolocation out of bounds: ', USER_LOCATION);
            disableGeolocation();
        }
    });
    // Geolocation error handler
    MAP.on('locationerror', function(error) {
        showInfoPopup('We couldn\'t acquire your current location.', 'error');
        console.error('Geolocation error: ' + error.message + '(' + error.code + ')');
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
        basicGeolocate_visit();
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

    var activitiesParamStr = activities ? activities.join('|') : '';

    // Begin assembling API call data
    var data = {
        with_activities: activitiesParamStr,
        within_feet: distance_feet
    };

    /**
     * Make the right call, based on options
     */
    if (activities) {
        if (geolocate_enabled) {
            // Search attractions nearby user geolocation, (with activities)
            if (USER_LOCATION !== null && USER_LOCATION !== undefined) {
                data.nearby_lat = USER_LOCATION.lat;
                data.nearby_lng = USER_LOCATION.lng;
            } else if (lat && lng) {
                data.nearby_lat = lat;
                data.nearby_lng = lng;
            }

            if (data.nearby_lat && data.nearby_lng) {
                return $.get(API_NEW_BASE_URL + 'attractions', data, function(attractionsReply) {
                    if (attractionsReply.data.length > 0) {
                        displayAttractions(attractionsReply.data);
                    } else {
                        showInfoPopup("Didn't find any attractions with those activities within the given radius from your location.", 'error');
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Could not find any nearby attractions.", 'error');
                    console.error(textStatus + ': ' + errorThrown);
                });
            }
        }
        else if (location_searchtext) {
            // Search attractions nearby geocoded address, (with activities)
            // Geocode address
            callGeocodeAddress(location_searchtext).then(function(geocodeReply, textStatus, jqXHR) {
                // Add new lat/lng to the data object.
                data.nearby_lat = geocodeReply.data.lat;
                data.nearby_lng = geocodeReply.data.lng;

                return $.get(API_NEW_BASE_URL + 'attractions', data, function(attractionsReply) {
                    if (attractionsReply.data.length > 0) {
                        displayAttractions(attractionsReply.data);
                    } else {
                        showInfoPopup("Didn't find any attractions with those activities within the given radius from your address.", 'error');
                    }
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Failed searching for attractions nearby the given address.", 'error');
                    console.error(textStatus + ': ' + errorThrown);
                });
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                showInfoPopup("Failed finding the address you provided.", 'error');
                console.error(textStatus + ': ' + errorThrown);
            });
        }
        else {
            // Search activities without nearby
            var attractions = CM.get_attractions_by_activity(activities);
            displayAttractions(attractions);
        }
    }
}

/**
 * Attempt to locate the user using the browser's native geolocation.
 */
function basicGeolocate_visit() {
    navigator.geolocation.getCurrentPosition(geolocateSuccess_visit, null, { enableHighAccuracy: true });
}

/**
 * Callback for geolocation success, whether via basicGeolocate_visit() or ctrlGeolocate.
 */
function geolocateSuccess_visit(event) {
    // Update the user's last known location
    USER_LOCATION = new mapboxgl.LngLat(event.coords.longitude, event.coords.latitude);
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
        console.error(textStatus + ': ' + errorThrown);
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
 * Display attractions on the map.
 */
function displayAttractions(attractions) {
    clearMarkers();
    for (var i = 0; i < attractions.length; i++) {
        var attraction = attractions[i];

        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(attractionPopupMarkup(attraction));

        var marker = new mapboxgl.Marker()
            .setLngLat([attraction.longitude, attraction.latitude])
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
    var thumbnail = attraction.pagethumbnail;
    var name = attraction.pagetitle;
    var description = attraction.descr;
    var gis_id = attraction.gis_id;

    // Only show description & thumbnail if we have room for tall popups
    showImage = ($("#map_canvas").height() >= 500);

    markup = "<h3>" + name + "</h3>";

    if (typeof description === 'string') {
        description = shortenStr(description, 100, true);
        markup += "<p>" + description + "</p>";
    }

    if (typeof attraction.cmp_url === 'string') {
        markup += '<p><a href="' + attraction.cmp_url + '" title="Find out more about ' + name + '." target="_blank">More info</a></p>';
    }

    if (showImage && thumbnail) {
        // Remove "~/" and prepend CM site URL
        thumbnailPath = CM_SITE_BASEURL + thumbnail.replace('~/', '');
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
            markup += '<img src="' + thumbnailPath + '" height="' + thumbnailHeight + '" width="' + thumbnailWidth + '" alt="' + name + '" /></div>';
            markup += '</div>';
        }
    }

    mapLink = WEBAPP_BASEPATH + 'mobile?type=attraction&gid=' + gis_id;
    markup += '<p><a href="' + mapLink + '" target="_blank">See on full map </a></p>';

    return markup;
}