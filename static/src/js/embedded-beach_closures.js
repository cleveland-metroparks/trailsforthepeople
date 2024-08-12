/**
 * embedded-beach_closures.js
 *
 * JS for external embedded beach closure map.
 *
 * Cleveland Metroparks
 */

$(document).ready(function(){
    var mapOptions = {
        base: DEFAULT_LAYER,
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
    $.get(API_NEW_BASE_URL + 'beach_closures', null, function (reply) {
        displayBeachClosures(reply.data);
    }, 'json');
}

/**
 * Display beach closures on the map.
 */
function displayBeachClosures(beach_closures) {
    var points = [];

    beach_closures.forEach(function(beach) {
        points.push(
            turf.point(
                [beach.longitude, beach.latitude],
                {
                    // Properties
                    'status_color': beach.status_color,
                    'name': beach.title,
                    'date_updated': beach.date_updated,
                    'external_link': beach.external_link,
                    'status_color': beach.status_color,
                    'status_text': beach.beachstatus
                }
            )
        );
    });

    // Looks like it's not yet possible to set "icon-color"
    // for Mapbox GL JS's built-in (Maki) icons, but that
    // we'd need to create custom SDF icons.
    //
    //MAP.addLayer({
    //    "id": "beach_closures",
    //    "type": "symbol",
    //    "source": {
    //        "type": "geojson",
    //        "data": {
    //            "type": "FeatureCollection",
    //            "features": points
    //        }
    //    },
    //    "layout": {
    //        "icon-image": "marker-15",
    //        "icon-size": 1.8,
    //    },
    //    "paint": {
    //        "icon-color": ["concat", "#", ["get", "status_color"]]
    //    }
    //});

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