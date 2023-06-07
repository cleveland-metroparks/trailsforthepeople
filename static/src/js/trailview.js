let trailviewToggled = false;
let trailviewViewer = null;
let trailviewMapMarker = null;

function initTrailView() {
    const trailviewIcon = document.querySelector("#trailviewIcon");
    if (trailviewIcon === null) {
        throw new Error("trailviewIcon id not found");
    }
    trailviewIcon.addEventListener('click', () => {
        toggleTrailView();
    })
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

    createTrailviewMapMarker();
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

    MAP.jumpTo({
        center: trailviewMapMarker.getLngLat(),
        zoom: 16,
        bearing: 0,
    });
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