 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

var APP_BASEPATH = 'https://maps-dev.clevelandmetroparks.com/';

var markerLayer = L.featureGroup();

var markerIcon = L.icon({
    iconUrl: APP_BASEPATH + 'static/common/images/markers/marker-gps.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ]
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

        var data = { activity_ids: selectedActivityIDs };
        var url = APP_BASEPATH + 'ajax/browse_pois_by_activity';

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

    if (attraction.descr) {
        markup += "<p>" + attraction.descr + "</p>";
    }

    map_link = '';
    markup += '<p><a href="' + map_link + '">See on Metroparks map</a></p>';

    return markup;
}