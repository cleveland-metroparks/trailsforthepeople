 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

var APP_BASEPATH = 'https://maps-dev.clevelandmetroparks.com/';
var CM_SITE_BASEURL = 'http://cmp.thunder-production.com/';

var markerLayer = L.featureGroup();

var markerIcon = L.icon({
    iconUrl: APP_BASEPATH + 'static/common/images/markers/marker-gps.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ],
    popupAnchor: [ 0, -41 ]
});


$(document).ready(function(){
    // Load the URL params before the map, as we may need them to configure it.
    URL_PARAMS = $.url();

    MIN_ZOOM = 10;

    // Load the map.
    initMap();

    // Disable scrollwheel-driven map zooming so the user can scroll down the page.
    MAP.scrollWheelZoom.disable();

    /**
     * Filter
     */
    $('#filters-section .filter-action-area .update-results-button').click(function() {
        markerLayer.clearLayers();

        var selectedActivityIDs = [];
        $('#filters-section .filter-subfield-list input:checkbox:checked').each(function() {
            selectedActivityIDs.push($(this).attr('value'));
        });

        var location_searchtext = $('input.locationTxt').val();

        var data = { activity_ids: selectedActivityIDs };

        if (location_searchtext) {
            // Search nearby activities
            data.get_activities_url = APP_BASEPATH + 'ajax/get_nearby_pois_with_activities';
            data.searchtext = location_searchtext;
            data.within_feet = 5280 * $('select.locationRadiusDDL').val(); // 5280 feet per mile

            callGeocodeAddress(data).then(function(reply, textStatus, jqXHR) {
                // Add our new lat/lng to the data object.
                data.lat = reply.lat;
                data.lng = reply.lng;

                callGetActivities(data);
            });
        } else {
            // Search activities, without nearby 
            data.get_activities_url = APP_BASEPATH + 'ajax/browse_pois_by_activity';
            callGetActivities(data);
        }
    });

    /**
     * Clear Markers
     */
    $('#filters-section .filter-action-area .clear-filters-button').click(function() {
        markerLayer.clearLayers();
    });

    /**
     * Disable form submission on existing filter buttons.
     *
     * TEMPORARY!!!
     *
     * @TODO: Let's get the form removed or change the buttons.
     */
    $('.update-results-button').attr('type', 'button')
    $('.update-results-button').attr('onclick', '')
    $('.clear-filters-button').attr('onclick', '');

});

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
        url: APP_BASEPATH + 'ajax/geocode',
        dataType: 'json',
        data: data
        })
        .done(function(reply) {
            var latlng = L.latLng(reply.lat, reply.lng);
            // Point outside service area
            if (! MAX_BOUNDS.contains(latlng) ) {
                return alert("The location we found for your address is too far away.");
            }
        
            // Add a marker for their location
            //MAP.setView(latlng, 16);
            placeTargetMarker(reply.lat, reply.lng);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGeocodeAddress error');
            console.log(textStatus + ': ' + errorThrown);
            alert("We couldn't find that address or city.\nPlease try again.");
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
            icon: markerIcon,
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
    markup = "<h3>" + attraction.name + "</h3>";

    if (attraction.description) {
        markup += "<p>" + attraction.description + "</p>";
    }

    if (attraction.thumbnail) {
        // Remove "~/" and prepend CM site URL
        thumbnail_path = CM_SITE_BASEURL + attraction.thumbnail.replace('~/', '');
        // Resize image:
        thumbnail_height = 150;
        thumbnail_path = thumbnail_path.replace(/width=\d*\&height=\d*\&/, 'height=' + thumbnail_height + '&');
        markup += '<img src="' + thumbnail_path + '" height="' + thumbnail_height + '" alt="' + attraction.name + '" />';
    }

    //map_link = '';
    //markup += '<p><a href="' + map_link + '">See on Metroparks map</a></p>';

    return markup;
}