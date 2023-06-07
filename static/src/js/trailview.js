let trailviewToggled = false;
let trailviewViewer = null;

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
        addTrailViewMapLayer();
        $('#trailviewViewer').fadeIn();
        if (trailviewViewer === null) {
            const options = trailviewer.defaultBaseOptions;
            options.target = 'trailviewViewer';
            trailviewViewer = new trailviewer.TrailViewerBase(options);
        }
        trailviewToggled = true;
    } else {
        removeTrailViewMapLayer();
        $('#trailviewViewer').fadeOut();
        trailviewViewer.destroy();
        trailviewViewer = null;
        trailviewToggled = false;
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
}