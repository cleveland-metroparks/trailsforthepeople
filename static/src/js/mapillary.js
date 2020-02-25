


/**
 *
 */
$(document).on("mapInitialized", function () {
    MAP.on("load", function (event) {

        // Add Mapillary sequence layer.
        // https://www.mapillary.com/developer/tiles-documentation/#sequence-layer
        MAP.addLayer({
            "id": "mapillary",
            "type": "line",
            "source": {
                "type": "vector",
                "tiles": ["https://d25uarhxywzl1j.cloudfront.net/v0.1/{z}/{x}/{y}.mvt"],
                "minzoom": 6,
                "maxzoom": 14
            },
            "source-layer": "mapillary-sequences",
            "layout": {
                "line-cap": "round",
                "line-join": "round"
            },
            "paint": {
                "line-opacity": 0.6,
                "line-color": "#39AF64",
                "line-width": 2
            }
        }, "waterway-label");

        // Filter by user and date
        // Mapbox filter documentation: https://docs.mapbox.com/mapbox-gl-js/style-spec/#other-filter
        // MAP.setFilter('mapillary',['all', ['==', 'userkey', '73Q3j-BDvHrsirf6gPYT4w'], ['>=', 'captured_at', 1514764800000]]);

        MAP.addLayer({
          "id": "mapillary-images",
          "type": "circle",
          "source": {
              "type": "vector",
              "tiles": ["https://d25uarhxywzl1j.cloudfront.net/v0.1/{z}/{x}/{y}.mvt"],
              "minzoom": 6,
              "maxzoom": 14
          },
          "source-layer": "mapillary-images",
          "paint": {
              "circle-color": "#39AF64",
              "circle-radius": 6
          }
        }, "waterway-label");

        // Create a popup, but don't add it to the map yet.
        var popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });
 
        MAP.on('mouseenter', 'mapillary-images', function(e) {
            // Change the cursor style as a UI indicator.
            MAP.getCanvas().style.cursor = 'pointer';

            var coordinates = e.features[0].geometry.coordinates.slice();
            var key = e.features[0].properties.key;
            var url = "https://images.mapillary.com/" + key + "/thumb-320.jpg";

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // Populate the popup and set its coordinates
            // based on the feature found.
            popup.setLngLat(coordinates)
            .setHTML("<img src='" + url + "' width='160'/>")
            .addTo(MAP);
        });

        MAP.on('mouseleave', 'mapillary-images', function() {
            MAP.getCanvas().style.cursor = '';
            popup.remove();
        });


    });
});

