 /**
 * embedded.js
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
        var nearby = false;
        if (geolocate_enabled) {
            if (USER_LOCATION !== null && USER_LOCATION !== undefined) {
                nearby = true;
                data.lat = USER_LOCATION.coords.latitude;
                data.lng = USER_LOCATION.coords.longitude;
            } else if (lat && lng) {
                nearby = true;
                data.lat = lat;
                data.lng = lng;
            } else {
                // No lat/lng
                nearby = false;
            }
        } else if (location_searchtext) {
            // Search attractions nearby geocoded address
            nearby = true;
            // data.searchtext = location_searchtext;
            // Geocode address
            callGeocodeAddress(location_searchtext).then(function(reply, textStatus, jqXHR) {
                // Add new lat/lng to the data object.
                data.lat = reply.data.lat;
                data.lng = reply.data.lng;
            });
        } else {
            // Search activities without nearby
            nearby = false;
        }

        if (nearby) {
            callGetNearbyAttractions(data);
        } else {
            var attractions = CM.get_attractions_by_activity(activities);
            displayAttractions(attractions);
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
 * Get attractions (AJAX)
 *
 * Works with Nearby and without.
 */
function callGetNearbyAttractions(params) {
    return $.ajax({
            url: API_BASEPATH + 'ajax/get_nearby_attractions_with_activities',
            dataType: 'json',
            data: params
        })
        .done(function(reply) {
            displayAttractions(reply.results);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGetNearbyAttractions error');
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
 * Display attractions on the map.
 */
function displayAttractions(attractions) {
    clearMarkers();
    for (var i = 0; i < attractions.length; i++) {
        var attraction = attractions[i];

        var popup = new mapboxgl.Popup({ offset: 25 })
            .setHTML(attractionPopupMarkup(attraction));

        // @TODO: Remove this (just use attraction.latitude) when callGetNearbyAttractions() is phased-out
        var longitude = attraction.lng ? attraction.lng : attraction.longitude;
        var latitude = attraction.lat ? attraction.lat : attraction.latitude;

        var marker = new mapboxgl.Marker()
            .setLngLat([longitude, latitude])
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
    // @TODO: Remove these (just use first items) when callGetNearbyAttractions() is phased-out
    var thumbnail = attraction.pagethumbnail ? attraction.pagethumbnail : attraction.thumbnail;
    var name = attraction.pagetitle ? attraction.pagetitle : attraction.name;
    var description = attraction.descr ? attraction.descr : attraction.description;
    var gis_id = attraction.gis_id ? attraction.gis_id : attraction.gid;

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