 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

var markerLayer = L.featureGroup();

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

        $.get(APP_BASEPATH + 'ajax/browse_pois_by_activity', { activity_ids: selectedActivityIDs }, function (reply) {

            for (var i = 0; i < reply.results.length; i++) {
                var result = reply.results[i];

                marker = new L.marker([result.lat, result.lng], {
                    clickable: true,
                    draggable: false,
                    icon: ICON_GPS,
                //}).bindPopup(item[1]);
                });

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

});