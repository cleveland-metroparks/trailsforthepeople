let trailviewToggled = false;

/** @type {import('@cmparks/trailviewer/dist/trailviewer-base'.TrailViewerBase) | null} */
let trailviewViewer = null;

/** @type {mapboxgl.Marker | null} */
let trailviewMapMarker = null;

let trailviewMouseOnDot = false;

/** @type {'map' | 'viewer'} */
let trailviewFocusedElement = 'map';

let lastMapResize = new Date();

function initTrailView() {
    const trailviewEnableButton = document.querySelector("#trailview_enable_button");
    if (trailviewEnableButton === null) {
        throw new Error("trailview_enable_button id not found");
    }
    trailviewEnableButton.addEventListener('click', () => {
        toggleTrailView();
    })

    const mapCanvas = document.querySelector('#map_canvas')
    new ResizeObserver(() => {
        if (new Date().valueOf() - lastMapResize.valueOf() > 100) {
            MAP.resize();
            lastMapResize = new Date();
        }
    }).observe(mapCanvas);
    mapCanvas.addEventListener('transitionend', () => {
        MAP.resize();
        if (trailviewMapMarker !== null) {
            MAP.easeTo({
                center: trailviewMapMarker.getLngLat(),
                duration: 500,
            });
        }
    });
}

function toggleTrailView() {
    if (trailviewToggled === false) {
        trailviewToggled = true;
        addTrailViewMapLayer();
        $('#trailview_viewer').fadeIn();
        if (trailviewViewer === null) {
            const options = trailviewer.defaultBaseOptions;
            options.target = 'trailview_viewer';
            trailviewViewer = new trailviewer.TrailViewerBase(options);
            trailviewViewer.on('image-change', (image) => {
                if (MAP !== null && trailviewMapMarker !== null) {
                    trailviewMapMarker.setLngLat([image.longitude, image.latitude]);
                    MAP.easeTo({
                        center: trailviewMapMarker.getLngLat(),
                        duration: 500,
                    });
                }
            });
        }
        addTrailviewUI();
    } else {
        if (trailviewFocusedElement === 'viewer') {
            toggleTrailViewFocus();
        }
        trailviewToggled = false;
        removeTrailViewMapLayer();
        $('#trailview_viewer').fadeOut();
        trailviewViewer.destroy();
        trailviewViewer = null;
    }
}

function removeTrailViewMapLayer() {
    if (MAP.getSource('dots')) {
        MAP.removeLayer('dots');
        MAP.removeSource('dots');
    }
}

function addTrailviewUI() {
    {
        const button = document.createElement('button');
        button.type = "button";
        button.id = 'trailview_expand_button';
        button.classList.add('trailview-button');
        button.setAttribute('data-role', 'none');
        const span = document.createElement('span');
        span.classList.add('cm-icon-expand');
        button.appendChild(span);
        document.querySelector('#trailview_viewer').appendChild(button);
        button.addEventListener('click', () => {
            toggleTrailViewFocus();
        });
    }

    {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.id = 'trailview_close_button';
        closeButton.classList.add('trailview-button');
        closeButton.setAttribute('data-role', 'none');
        const closeSpan = document.createElement('span');
        closeSpan.classList.add('cm-icon-close');
        closeButton.appendChild(closeSpan);
        document.querySelector('#trailview_viewer').appendChild(closeButton);
        closeButton.addEventListener('click', () => {
            toggleTrailView();
        })
    }

}

function toggleTrailViewFocus() {
    if (trailviewFocusedElement === 'map') {
        trailviewFocusedElement = 'viewer';
        document.querySelector('#map_canvas').classList.add('trailview-map-small');
        document.querySelector('#trailview_viewer').classList.remove('trailviewer-small');
        document.querySelector('#trailview_viewer').classList.add('trailviewer-focus');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-compress'];
        document.querySelector('#map_canvas').addEventListener('transitionend', () => {
            MAP.resize();
        }, { once: true })
        const mapExpandButton = document.createElement('button');
        mapExpandButton.type = 'button';
        mapExpandButton.id = 'trailview_map_expand_button';
        mapExpandButton.classList.add('trailview-button');
        mapExpandButton.setAttribute('data-role', 'none');
        const span = document.createElement('span');
        span.classList.add('cm-icon-expand');
        mapExpandButton.appendChild(span);
        document.querySelector('#map_canvas').appendChild(mapExpandButton);
        mapExpandButton.addEventListener('click', () => {
            toggleTrailViewFocus();
        })
    } else if (trailviewFocusedElement === 'viewer') {
        trailviewFocusedElement = 'map';
        document.querySelector("#map_canvas").classList.remove('trailview-map-small');
        document.querySelector('#trailview_viewer').classList.remove('trailviewer-focus');
        document.querySelector('#trailview_viewer').classList.add('trailviewer-small');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-expand'];
        document.querySelector('#trailview_map_expand_button').remove();
        MAP.resize();
    }

}

function addTrailViewMapLayer() {
    if (MAP === null) {
        return;
    }
    removeTrailViewMapLayer();
    const layerData = {
        type: 'vector',
        format: 'pbf',
        tiles: ['https://trailview.cmparks.net/api/tiles/{z}/{x}/{y}/standard'],
    };

    MAP.addSource('dots', layerData);

    MAP.addLayer({
        id: 'dots',
        'source-layer': 'geojsonLayer',
        source: 'dots',
        type: 'circle',
        paint: {
            'circle-radius': 10,
            'circle-color': [
                'case',
                ['==', ['get', 'visible'], true],
                '#00a108',
                '#db8904',
            ],
        },
    });
    MAP.setPaintProperty('dots', 'circle-radius', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        3,

        16,
        5,

        17,
        7,

        20,
        8,
    ]);
    MAP.setPaintProperty('dots', 'circle-opacity', [
        'interpolate',

        ['exponential', 0.5],
        ['zoom'],
        13,
        0.05,

        15,
        0.1,

        17,
        0.25,

        20,
        1,
    ]);

    MAP.on('mouseenter', 'dots', () => {
        trailviewMouseOnDot = true;
        if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'pointer';
        }
    });

    MAP.on('mouseleave', 'dots', () => {
        trailviewMouseOnDot = false;
        if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'grab';
        }
    });

    MAP.on('mousedown', () => {
        if (MAP !== null && !trailviewMouseOnDot) {
            MAP.getCanvas().style.cursor = 'grabbing';
        }
    });

    MAP.on('mouseup', () => {
        if (MAP !== null && trailviewMouseOnDot) {
            MAP.getCanvas().style.cursor = 'pointer';
        } else if (MAP !== null) {
            MAP.getCanvas().style.cursor = 'grab';
        }
    });

    createTrailviewMapMarker();

    MAP.on('click', 'dots', (event) => {
        if (
            event.features === undefined ||
            event.features[0].properties === null
        ) {
            console.warn('Features is undefiend or properties are null');
            return;
        }
        trailviewViewer.goToImageID(event.features[0].properties.imageID);
    });
}

function createTrailviewMapMarker() {
    const currentMarkerWrapper = document.createElement('div');
    currentMarkerWrapper.classList.add('trailview-current-marker-wrapper');
    const currentMarkerDiv = document.createElement('div');
    currentMarkerDiv.classList.add('trailview-current-marker');
    const currentMarkerViewDiv = document.createElement('div');
    currentMarkerViewDiv.classList.add('trailview-marker-viewer');
    currentMarkerWrapper.appendChild(currentMarkerDiv);
    currentMarkerWrapper.appendChild(currentMarkerViewDiv);
    trailviewMapMarker = new mapboxgl.Marker(currentMarkerWrapper)
        .setLngLat([-81.682665, 41.4097766])
        .addTo(MAP)
        .setRotationAlignment('map');

    updateTrailViewMarkerRotation();
}

function updateTrailViewMarkerRotation() {
    if (trailviewViewer !== null && trailviewMapMarker !== null) {
        const angle = trailviewViewer.getBearing();
        if (angle !== undefined) {
            trailviewMapMarker.setRotation((angle + 225) % 360);
        }
    }
    if (trailviewToggled !== false) {
        requestAnimationFrame(updateTrailViewMarkerRotation);
    } else {
        trailviewMapMarker.remove();
    }
}