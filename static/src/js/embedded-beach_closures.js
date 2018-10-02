 /**
 * embedded-beach_closures.js
 *
 * JS for external embedded beach closure map.
 *
 * Cleveland Metroparks
 */

var markerLayer = L.featureGroup();

$(document).ready(function(){
    var mapOptions = { base:'map' };

    // Load the map.
    initMap(mapOptions);

    // Disable scrollwheel-driven map zooming so the user can scroll down the page.
    MAP.scrollWheelZoom.disable();

    callGetBeachClosures();
});

/**
 * Get beach closures (AJAX)
 */
function callGetBeachClosures(params) {
    return $.ajax({
        url: API_BASEPATH + 'ajax/get_beach_closures',
        dataType: 'json',
        data: params
        })
        .done(function(reply) {
            displayBeachClosures(reply.results);
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            console.log('callGetBeachClosures ' + textStatus + ': ' + errorThrown);
        });
}

/**
 * Display beach closures on the map.
 */
function displayBeachClosures(beach_closures) {
    for (var i = 0; i < beach_closures.length; i++) {
        var result = beach_closures[i];

        marker = new L.marker([result.lat, result.lng], {
            clickable: true,
            draggable: false,
            icon: L.mapbox.marker.icon({
                'marker-color': result.status_color
            })
        }).bindPopup(beachPopupMarkup(result));

        markerLayer.addLayer(marker);
    }
    markerLayer.addTo(MAP);
}

/**
 * Make marker popup
 */
function beachPopupMarkup(beach_closure) {
    markup = "<h3>" + beach_closure.name + "</h3>";

    if (beach_closure.status_text) {
        markup += "<p>Status: <strong>" + beach_closure.status_text + '</strong></p>';
    }

    if (beach_closure.external_link) {
        markup += '<p>Water Quality: ' + beach_closure.external_link + '</p>';
    }

    if (beach_closure.date_updated) {
        markup += '<p style="font-size: 90% !important">Updated ' + beach_closure.date_updated + '</p>';
    }

    return markup;
}