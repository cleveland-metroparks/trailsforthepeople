


/**
 *
 */
$(document).on("mapInitialized", function () {
    MAP.on("load", function (event) {

        var beforeLayer = null;
        var layerColor = '#ff7200'

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
                "line-color": layerColor,
                "line-width": 2
            }
        }, beforeLayer);

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
              "circle-color": layerColor,
              "circle-radius": 6
          }
        }, beforeLayer);

        // Filter by user
        // @dakotabenjamin's userkey: 0H-w-WeGPajZ_G_I1RTE-w
        // @smathermather's userkey: U1iL4X_Qksh-UZfa96DWXw
        //
        // Mapbox filter documentation: https://docs.mapbox.com/mapbox-gl-js/style-spec/#other-filter
        MAP.setFilter('mapillary',
            ['any', // or:
                ['==', 'userkey', '0H-w-WeGPajZ_G_I1RTE-w'],
                ['==', 'userkey', 'U1iL4X_Qksh-UZfa96DWXw']
            ]
        );
        MAP.setFilter('mapillary-images',
            ['any', // or:
                ['==', 'userkey', '0H-w-WeGPajZ_G_I1RTE-w'],
                ['==', 'userkey', 'U1iL4X_Qksh-UZfa96DWXw']
           ]
        );

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

            // [Debug] log the image's properties (including userkey)
            // console.log(e.features[0].properties);

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

