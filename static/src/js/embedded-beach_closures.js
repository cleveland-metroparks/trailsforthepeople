/**
 * embedded-beach_closures.js
 *
 * JS for external embedded beach closure map.
 *
 * Cleveland Metroparks
 */

$(document).ready(function(){
    var mapOptions = {
        base: 'map',
        scrollZoom: false,
        trackUserLocation: false
    };

    // Load the map.
    initMap(mapOptions);

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
    var points = [];

    for (var i = 0; i < beach_closures.length; i++) {
        var result = beach_closures[i];

        points.push(
            turf.point(
                [result.lng, result.lat],
                {
                    // Properties
                    'status_color': result.status_color,
                    'name': result.name,
                    'date_updated': result.date_updated,
                    'external_link': result.external_link,
                    'status_color': result.status_color,
                    'status_text': result.status_text
                }
            )
        );
    }

    MAP.addLayer({
        "id": "beach_closures",
        "type": "circle",
        "source": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": points
            }
        },
        "paint": {
            "circle-radius": 10,
            "circle-color": ["concat", "#", ["get", "status_color"]]
        }
    });

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    MAP.on("click", "beach_closures", function (e) {
        var coordinates = e.features[0].geometry.coordinates.slice();
        var popupMarkup = beachPopupMarkup(e.features[0].properties);

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(popupMarkup)
            .addTo(MAP);
    });

    // Change the cursor to a pointer when the mouse is over the places layer.
    MAP.on("mouseenter", "beach_closures", function () {
        MAP.getCanvas().style.cursor = "pointer";
    });

    // Change it back to a pointer when it leaves.
    MAP.on("mouseleave", "beach_closures", function () {
        MAP.getCanvas().style.cursor = "";
    });
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