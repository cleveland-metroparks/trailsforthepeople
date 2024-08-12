/**
 * embedded-pnd.js
 *
 * CM Parks Planning & Design Capital Projects page: external embedded map/
 * Requires map-embedded-base (or map-embedded-base-nojq)
 *
 * Cleveland Metroparks
 */

const projectDataGeoJsonUrl = WEBAPP_BASEPATH + 'test/pnd-markers.geojson';

// The classes/categories of markers, for layers, styling, and legend
let markerClasses = [
    {
        id: 'reservation',
        text: 'Reservation Capital Project',
        color: 'blue'

        // color: '#1BB3A0' // Scheme: Teal
    },
    {
        id: 'trail',
        text: 'Trail Project',
        color: '#397a11' // Shade of CMP green

        // color: '#B04B20' // Scheme: Brick
    },
    {
        id: 'restoration',
        text: 'Ecological Restoration and Site Improvements',
        // color: 'green'
        color: '#ec8200' // An orange

        // color: '#68ad3d' // Scheme: CMP site light green
    },
    {
        id: 'golf',
        text: 'Golf Capital Project',
        color: 'black'

        // color: '#000000' // Scheme: Black
    },
    {
        id: 'expansion',
        text: 'New Reservations/Major Park Expansions',
        color: 'Red'

        // color: '#AD9034' // Scheme: Light brown
    },
    {
        id: 'zoo',
        text: 'Zoo Capital Project',
        color: 'DarkViolet'

        // color: '#3548B0' // Scheme: Indigo
    }
];

/**
 * Filter our marker classes list by only the ones that used in the GeoJSON data
 */
let categoriesUsed = [];
$.getJSON(projectDataGeoJsonUrl, function(data) {
    // Make an array of all the "Map Classes" that are used
    data.features.forEach(element => {
        const category = element.properties['Map Class'];
        if (!categoriesUsed.includes(category)) {
            categoriesUsed.unshift(category);
        }
    });
 })
 .done(function() {
    // Filter the classes array
    markerClasses = markerClasses.filter(item => categoriesUsed.includes(item.text));
 });


$(document).ready(function() {
    /**
     * Set up the map
     */
    var mapOptions = {
        base: DEFAULT_LAYER,
        scrollZoom: false,
        trackUserLocation: false
    };
    initMap(mapOptions);
});

/**
 *
 */
$(document).on("mapInitialized", function () {
    MAP.on('load', () => {
        // Create map legend
        const legend = document.getElementById('map_legend');

        //
        markerClasses.forEach((item, index, arr) => {
            const sourceId = 'source-' + item.id;
            const markerLayerId = 'layer-' + item.id;
            const clusterLayerId = 'layer-cluster-' + item.id;
            const clusterCountLayerId = 'layer-cluster-count-' + item.id;

            /**
             * Map data source for this class of markers, with point clustering.
             *
             * We make a separate data source for each layer
             * in order to cluster per layer.
             *
             * Mapbox GL JS clustering examples:
             * - https://docs.mapbox.com/mapbox-gl-js/example/cluster/
             * - https://docs.mapbox.com/mapbox-gl-js/example/cluster-html/
             */
            MAP.addSource(sourceId, {
                type: 'geojson',
                data: projectDataGeoJsonUrl,
                filter: ['==', ['get', 'Map Class'], item.text],
                cluster: true,
                clusterMinPoints: 2,
                clusterMaxZoom: 9,
            });

            // Map layer for this class of markers
            MAP.addLayer({
                id: markerLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['!has', 'point_count'],
                paint: {
                    'circle-radius': 10,
                    'circle-color': item.color,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'white'
                }
            });

            MAP.addLayer({
                id: clusterLayerId,
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                // filter: ['all', ['has', 'point_count'], ['==', ['get', 'Map Class'], item.text]],
                paint: {
                    'circle-color': item.color,
                    'circle-radius': [
                        'step', // Step expression
                                // - https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step
                        ['get', 'point_count'],
                        12, //   * 12px circles when point count is < 2
                        2,
                        16, //   * 16px circles when point count is between 2 and 4
                        4,
                        20  //   * 20px circles when point count is >= 4
                    ],
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'white'
                }
            });

            MAP.addLayer({
                id: clusterCountLayerId,
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
                    'text-size': 16
                },
                paint: {
                    'text-color': 'white'
                }
            });

            // Change the cursor to a pointer when hovering over individual markers
            MAP.on('mousemove', markerLayerId, (event) => {
                MAP.getCanvas().style.cursor = 'pointer';
            });
            MAP.on('mouseleave', markerLayerId, () => {
                MAP.getCanvas().style.cursor = ''; // Reset
            });

            MAP.on('click', markerLayerId, (e) => {
                const coordinates = e.features[0].geometry.coordinates.slice();
                const project = {
                    name: e.features[0].properties['Project'],
                    type: e.features[0].properties['Project Type'],
                    link: e.features[0].properties['Project Page Link']
                }

                const popupHtml =
                    '<h2 class="project-name">' + project.name + '</h2>' +
                    '<p class="project-type">' + project.type + '</p>' +
                    '<p class="project-link"><a class="project-link"><a href="' + project.link + '">More info</a></p>';

                // Ensure that if the map is zoomed out such that
                // multiple copies of the feature are visible, the
                // popup appears over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupHtml)
                    .addTo(MAP);
            });

            // Create legend element
            const color = item.color;
            const el = document.createElement('div');
            const key = document.createElement('span');
            key.className = 'legend_key';
            key.style.backgroundColor = color;

            const value = document.createElement('span');
            value.innerHTML = `${item.text}`;
            el.appendChild(key);
            el.appendChild(value);
            legend.appendChild(el);
        }); // END markerClasses.forEach
    });
});