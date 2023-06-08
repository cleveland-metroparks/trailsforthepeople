let trailviewToggled = false;

/** @type {import('@cmparks/trailviewer/dist/trailviewer-base'.TrailViewerBase) | null} */
let trailviewViewer = null;

/** @type {mapboxgl.Marker | null} */
let trailviewMapMarker = null;

let trailviewMouseOnDot = false;

/** @typedef {'desktopMap' | 'desktopViewer' | 'mobileSplit' | 'mobileMap' | 'mobileViewer'} TrailviewLayoutType */

/**@type {TrailviewLayoutType} */
let trailviewLayout = 'desktopMap';

let lastMapResize = new Date();

function initTrailView() {
    const trailviewEnableButton = document.querySelector("#trailview_enable_button");
    if (trailviewEnableButton === null) {
        throw new Error("trailview_enable_button id not found");
    }
    trailviewEnableButton.addEventListener('click', () => {
        toggleTrailView();
    })

    const mapContainer = document.querySelector('#map_container')
    new ResizeObserver(() => {
        if (new Date().valueOf() - lastMapResize.valueOf() > 100) {
            MAP.resize();
            lastMapResize = new Date();
        }
    }).observe(mapContainer);
    mapContainer.addEventListener('transitionend', () => {
        MAP.resize();
        if (trailviewMapMarker !== null) {
            MAP.easeTo({
                center: trailviewMapMarker.getLngLat(),
                duration: 500,
            });
        }
    });
    window.addEventListener('resize', () => {
        if (trailviewToggled === true) {
            checkTrailviewResponsive();
        }
    })
}

function checkTrailviewResponsive() {
    if ((trailviewLayout === 'desktopMap' || trailviewLayout === 'desktopViewer') && window.innerWidth < 768) {
        changeTrailviewLayout('mobileSplit');
    } else if (window.innerWidth >= 768 &&
        (trailviewLayout === 'mobileMap' || trailviewLayout === 'mobileSplit' || trailviewLayout === 'mobileViewer')) {
        changeTrailviewLayout('desktopMap');
    }
}

function toggleTrailView() {
    if (trailviewToggled === false) {
        trailviewToggled = true;
        addTrailViewMapLayer();
        $('#trailview_viewer').fadeIn();
        if (trailviewViewer === null) {
            const options = trailviewer.defaultBaseOptions;
            options.initial = { latitude: MAP.getCenter().lat, longitude: MAP.getCenter().lng };
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
        checkTrailviewResponsive();
    } else {
        trailviewToggled = false;
        changeTrailviewLayout('desktopMap');
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
            if (trailviewLayout === 'desktopViewer') {
                changeTrailviewLayout('desktopMap');
            } else if (trailviewLayout === 'desktopMap') {
                changeTrailviewLayout('desktopViewer');
            } else if (trailviewLayout === 'mobileSplit') {
                changeTrailviewLayout('mobileViewer');
            } else if (trailviewLayout === 'mobileViewer') {
                changeTrailviewLayout('mobileSplit');
            } else if (trailviewLayout === 'mobileMap') {
                changeTrailviewLayout('mobileSplit');
            }
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

function resetTrailViewClasses() {
    if (trailviewViewer.getPanViewer() !== undefined) {
        trailviewViewer.getPanViewer().setHfov(120, false);
    }
    const mapExpandButton = document.querySelector('#trailview_map_expand_button span');
    if (mapExpandButton !== null) {
        mapExpandButton.classList = ['cm-icon-expand'];
    }
    document.querySelector('#map_container').hidden = false;
    document.querySelector("#map_container").classList.remove('trailview-map-small');
    document.querySelector('#trailview_viewer').classList.remove('trailviewer-focus');
    document.querySelector('#trailview_viewer').classList.remove('trailviewer-small');
    document.querySelector('#map_container').classList.remove('trailview-map-split');
    document.querySelector('#trailview_viewer').classList.remove('trailviewer-split');
    document.querySelector('#trailview_viewer').classList.remove('trailviewer-mobile-viewer');
    document.querySelector('#map_container').classList.remove('trailview-map-mobile-map');
    document.querySelector('#trailview_viewer').classList.remove('trailviewer-mobile-map');
}

/**
 * @param {TrailviewLayoutType} layout 
 */
function changeTrailviewLayout(layout) {
    if (layout === trailviewLayout) {
        return;
    }
    // console.log(`Current: ${trailviewLayout}`);
    // console.log(`Changing to ${layout}`)
    trailviewLayout = layout;
    resetTrailViewClasses();
    if (layout === 'desktopViewer') {
        document.querySelector('#map_container').classList.add('trailview-map-small');
        document.querySelector('#trailview_viewer').classList.add('trailviewer-focus');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-compress'];
        document.querySelector('#map_container').addEventListener('transitionend', () => {
            MAP.resize();
        }, { once: true })
        addTrailviewMapExpandButton();
    } else if (layout === 'desktopMap') {
        document.querySelector('#trailview_viewer').classList.add('trailviewer-small');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-expand'];
        const mapExpandButton = document.querySelector('#trailview_map_expand_button');
        if (mapExpandButton !== null) {
            mapExpandButton.remove();
        }
        MAP.resize();
    } else if (layout === 'mobileSplit') {
        document.querySelector('#map_container').classList.add('trailview-map-split');
        document.querySelector('#trailview_viewer').classList.add('trailviewer-split');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-expand'];
        if (document.querySelector('#trailview_map_expand_button') === null) {
            addTrailviewMapExpandButton();
        }
        MAP.resize();
    } else if (layout === 'mobileViewer') {
        trailviewViewer.getPanViewer().setHfov(70);
        document.querySelector('#map_container').hidden = true;
        document.querySelector('#trailview_viewer').classList.add('trailviewer-mobile-viewer');
        document.querySelector('#trailview_expand_button span').classList = ['cm-icon-compress'];
    } else if (layout === 'mobileMap') {
        document.querySelector('#trailview_map_expand_button span').classList = ['cm-icon-compress'];
        document.querySelector('#map_container').classList.add('trailview-map-mobile-map');
        document.querySelector('#trailview_viewer').classList.add('trailviewer-mobile-map');
    }
}

function addTrailviewMapExpandButton() {
    const mapExpandButton = document.createElement('button');
    mapExpandButton.type = 'button';
    mapExpandButton.id = 'trailview_map_expand_button';
    mapExpandButton.classList.add('trailview-button');
    mapExpandButton.setAttribute('data-role', 'none');
    const span = document.createElement('span');
    span.classList.add('cm-icon-expand');
    mapExpandButton.appendChild(span);
    document.querySelector('#map_container').appendChild(mapExpandButton);
    mapExpandButton.addEventListener('click', () => {
        if (trailviewLayout === 'desktopViewer') {
            changeTrailviewLayout('desktopMap');
        } else if (trailviewLayout === 'mobileSplit') {
            changeTrailviewLayout('mobileMap');
        } else if (trailviewLayout === 'mobileMap') {
            changeTrailviewLayout('mobileSplit');
        }
    })
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