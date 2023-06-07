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
    const trailviewIcon = document.querySelector("#trailviewIcon");
    if (trailviewIcon === null) {
        throw new Error("trailviewIcon id not found");
    }
    trailviewIcon.addEventListener('click', () => {
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
        $('#trailviewViewer').fadeIn();
        if (trailviewViewer === null) {
            const options = trailviewer.defaultBaseOptions;
            options.target = 'trailviewViewer';
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
        addTrailViewExpandButton();
    } else {
        trailviewToggled = false;
        removeTrailViewMapLayer();
        $('#trailviewViewer').fadeOut();
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

function addTrailViewExpandButton() {
    const button = document.createElement('button');
    button.type = "button";
    button.id = 'trailviewExpandIcon';
    button.classList.add('trailview-button');
    button.setAttribute('data-role', 'none');
    const span = document.createElement('span');
    span.classList.add('cm-icon-expand');
    button.appendChild(span);
    document.querySelector('#trailviewViewer').appendChild(button);
    button.addEventListener('click', () => {
        toggleTrailViewFocus();
    });
}

function toggleTrailViewFocus() {
    if (trailviewFocusedElement === 'map') {
        trailviewFocusedElement = 'viewer';
        document.querySelector('#map_canvas').classList.add('trailview-map-small');
        document.querySelector('#trailviewViewer').classList.remove('trailviewer-small');
        document.querySelector('#trailviewViewer').classList.add('trailviewer-focus');
        document.querySelector('#map_canvas').addEventListener('transitionend', () => {
            MAP.resize();
        }, { once: true })
    } else if (trailviewFocusedElement === 'viewer') {
        trailviewFocusedElement = 'map';
        document.querySelector("#map_canvas").classList.remove('trailview-map-small');
        document.querySelector('#trailviewViewer').classList.remove('trailviewer-focus');
        document.querySelector('#trailviewViewer').classList.add('trailviewer-small');
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