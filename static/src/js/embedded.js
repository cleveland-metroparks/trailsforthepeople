 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

var markerLayer = L.featureGroup();

var userLocation;

$(document).ready(function(){
    var mapOptions = { base:'map' };

    // Load the map.
    initMap(mapOptions);

    // Disable scrollwheel-driven map zooming so the user can scroll down the page.
    MAP.scrollZoom.disable();

    /**
     * Filters: on "Update Results" button click
     */
    $('#filters-section .filter-action-area .update-results-button').click(function() {
        markerLayer.clearLayers();

        var selectedActivityIDs = [];
        $('#filters-section .filter-subfield-list input:checkbox:checked').each(function() {
            selectedActivityIDs.push($(this).attr('value'));
        });

        // No activities selected
        if (!selectedActivityIDs.length) {
            return;
        }

        var geolocate_enabled = $('.interactive-form-distance-near-me-input').prop('checked');
        var location_searchtext = $('input.locationTxt').val();

        var data = { activity_ids: selectedActivityIDs };

        var distance_feet = 5280 * $('select.locationRadiusDDL').val(); // 5280 feet per mile

        if (geolocate_enabled && userLocation) {
            // Search activities nearby user geolocation
            data.get_activities_url = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';
            data.lat = userLocation.lat;
            data.lng = userLocation.lng;
            data.within_feet = distance_feet;

            callGetActivities(data);

        } else if (location_searchtext) {
            // Search activities nearby to geocoded address
            data.get_activities_url = API_BASEPATH + 'ajax/get_nearby_attractions_with_activities';
            data.searchtext = location_searchtext;
            data.within_feet = distance_feet;

            callGeocodeAddress(data).then(function(reply, textStatus, jqXHR) {
                // Add our new lat/lng to the data object.
                data.lat = reply.lat;
                data.lng = reply.lng;

                callGetActivities(data);
            });
        } else {
            // Search activities, without nearby 
            data.get_activities_url = API_BASEPATH + 'ajax/get_attractions_by_activity';
            callGetActivities(data);
        }
    });

    /**
     * Clear markers
     */
    $('#filters-section .filter-action-area .clear-filters-button').click(function() {
        markerLayer.clearLayers();
    });

    /**
     * Geolocate user
     */
    $('.interactive-form-distance-near-me-input').click(function() {
        if ($('.interactive-form-distance-near-me-input').prop('checked')) {
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

    /**
     * Disable form submission on existing filter buttons.
     *
     * @TODO: Let's get the form and/or inline button click events removed!
     */
    $('.update-results-button').attr('type', 'button')
    $('.update-results-button').attr('onclick', '')
    $('.clear-filters-button').attr('onclick', '');

});

/**
 * Disable geolocation:
 * - ensure the button is un-checked,
 * - remove our stored location, and
 * - remove the marker.
 */
function disableGeolocation() {
    $('.interactive-form-distance-near-me-input').prop('checked', false);
    userLocation = null;
    clearGPSMarker();
}

/**
 * Get activities (AJAX)
 *
 * Works with Nearby and without.
 */
function callGetActivities(params) {
    return $.ajax({
        url: params.get_activities_url,
        dataType: 'json',
        data: params
        })
        .done(function(reply) {
            displayActivities(reply.results);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGetActivities error');
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
        url: API_BASEPATH + 'ajax/geocode',
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
    for (var i = 0; i < activities.length; i++) {
        var result = activities[i];

        marker = new L.marker([result.lat, result.lng], {
            clickable: true,
            draggable: false,
            icon: ICON_TARGET,
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