 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

var APP_BASEPATH = 'https://maps-dev.clevelandmetroparks.com/';
var CM_SITE_BASEURL = 'http://cmp.thunder-stage2.com/';

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

        var locationTxt = $('input.locationTxt').val();
        var latlng = locationTxt.split(",");

        var radius_miles = $('select.locationRadiusDDL').val();
        var radius_feet = 5280 * radius_miles;

        var data = { activity_ids: selectedActivityIDs };
        var url = '';

        if (locationTxt) {
            // Search nearby
            url = APP_BASEPATH + 'ajax/get_nearby_pois_with_activities';
            data.from_lat = latlng[0];
            data.from_lng = latlng[1];
            data.within_feet = radius_feet;
        } else {
            // Search activities, without nearby
            url = APP_BASEPATH + 'ajax/browse_pois_by_activity';
        }

        $.get(url, data, function (reply) {
            for (var i = 0; i < reply.results.length; i++) {
                var result = reply.results[i];

                marker = new L.marker([result.lat, result.lng], {
                    clickable: true,
                    draggable: false,
                    icon: markerIcon,
                }).bindPopup(attractionPopupMarkup(result));

                markerLayer.addLayer(marker);
            }
            markerLayer.addTo(MAP);

            MAP.fitBounds(MAX_BOUNDS);
        }, 'json');
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