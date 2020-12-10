/*********************************************
 * Nearby
 *********************************************/


/**
 * CM.attractions_nearby:
 *
 * Copy of CM.attractions, but each item within has computed:
 *     meters, miles, feet, range, bearing
 * and are ordered
 */
$(document).on("dataReadyAttractions", function() {
    CM.attractions_nearby = CM.attractions.slice(0); // Copy array
    updateNearYouNow();
});

/**
 * Convert from Turf.js point to Mapbox GL JS LngLat
 *
 * @param {turf.point} point
 *
 * @return {mapboxgl.LngLat}
 */
function turfPointToLngLat(point) {
    return new mapboxgl.LngLat.convert(point.geometry.coordinates);
}

/**
 * Distance (Haversine) from one point to another.
 *
 * @param fromLngLat {mapboxgl.LngLat}: From location
 * @param toLngLat {mapboxgl.LngLat}: To location
 *
 * @return Distance in meters
 */
function distanceTo(fromLngLat, toLngLat) {
    var turfFrom = turf.point(fromLngLat.toArray());
    var turfTo = turf.point(toLngLat.toArray());
    var options = {units: 'meters'};

    return turf.distance(turfFrom, turfTo, options);
}

/**
 * Bearing from one point to another, in decimal degrees
 *
 * @param fromLngLat {mapboxgl.LngLat}: From location
 * @param toLngLat {mapboxgl.LngLat}: To location
 *
 * @return {number} Final bearing in decimal degrees, between 0 and 360
 */
function bearingTo(fromLngLat, toLngLat) {
    var turfFrom = turf.point(fromLngLat.toArray());
    var turfTo = turf.point(toLngLat.toArray());
    var options = {final: true};

    return turf.bearing(turfFrom, turfTo, options);
}

/**
 * Bearing from one point to another, in NESW directional letters
 *
 * @param {mapboxgl.LngLat} from: From location
 * @param {mapboxgl.LngLat} to: To location
 *
 * @return {string} Bearing in NESW
 */
function bearingToInNESW(from, to) {
    var bearing = bearingTo(from, to);

    if      (bearing >= 22  && bearing <= 67)  return 'NE';
    else if (bearing >= 67  && bearing <= 112) return 'E';
    else if (bearing >= 112 && bearing <= 157) return 'SE';
    else if (bearing >= 157 && bearing <= 202) return 'S';
    else if (bearing >= 202 && bearing <= 247) return 'SW';
    else if (bearing >= 247 && bearing <= 292) return 'W';
    else if (bearing >= 292 && bearing <= 337) return 'NW';
    else if (bearing >= 337 || bearing <= 22)  return 'N';
};

/**
 * Add activity types options to the Nearby pane
 */
function addActivityTypesToNearby() {
    var optionsMarkup = '<fieldset id="nearby-activities" data-role="controlgroup">';
    $.each(CM.activities, function(index, value) {
        if (value && value.pagetitle) {
            optionsMarkup += '<label><input type="checkbox" name="nearby-category" value="' + value.pagetitle + '">' + value.pagetitle + '</label>';
        }
    });
    optionsMarkup += '</fieldset>';
    $('.form-group-wrapper').append(optionsMarkup).enhanceWithin();
}
// Populate DOM elements
$(document).on("dataReadyAttractions", function() {
    addActivityTypesToNearby();
});

/**
 * Update Near You Now
 *
 * update the Near You Now listing from CM.attractions_nearby;
 * called on a location update
 * this is a significant exception to the sortLists() system,
 * as we need to do the distance and sorting BEFORE rendering, an unusual case
 */
function updateNearYouNow() {
    var target_el = $('#alerts');

    // Iterate over CM.attractions_nearby and calculate distance from our last known location
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=CM.attractions_nearby.length; i<l; i++) {
        var attraction       = CM.attractions_nearby[i];
        var destpoint = new mapboxgl.LngLat(attraction.longitude, attraction.latitude);

        attraction.meters    = distanceTo(LAST_KNOWN_LOCATION, destpoint);
        attraction.miles     = attraction.meters / 1609.344;
        attraction.feet      = attraction.meters * 3.2808399;
        attraction.range     = (attraction.feet > 900) ? attraction.miles.toFixed(1) + ' mi' : attraction.feet.toFixed(0) + ' ft';

        attraction.bearing   = bearingToInNESW(LAST_KNOWN_LOCATION, destpoint);
    }

    // Sort CM.attractions_nearby by distance
    CM.attractions_nearby.sort(function (p,q) {
        return p.meters - q.meters;
    });
    // Take the closest few
    var closest_attractions = CM.attractions_nearby.slice(0,25);

    // Go over the closest attractions and render them to the DOM
    target_el.empty();
    for (var i=0, l=closest_attractions.length; i<l; i++) {
        var attraction = closest_attractions[i];

        var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
        li.attr('title', attraction.pagetitle);
        li.attr('category', attraction.categories);
        li.attr('type', 'attraction').attr('gid', attraction.gis_id);
        // li.attr('w', attraction.w).attr('s', attraction.s).attr('e', attraction.e).attr('n', attraction.n);
        li.attr('lat', attraction.latitude).attr('lng', attraction.longitude);
        li.attr('backbutton', '#pane-nearby');

        var div = $('<div></div>').addClass('ui-btn-text');
        div.append( $('<h2></h2>').text(attraction.pagetitle) );
        div.append( $('<p></p>').text(attraction.categories) );
        div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(attraction.range + ' ' + attraction.bearing) );

        // On click, call zoomElementClick() to load more info
        li.click(function () {
            zoomElementClick( $(this) );
        });

        li.append(div);
        target_el.append(li);
    }

    // Done loading attractions; refresh the styling magic
    target_el.listview('refresh');
}

/**
 * Place circle
 *
 * @param {mapboxgl.LngLat} center
 * @param {number} meters
 */
function placeCircle(center, meters) {
    clearCircle();

    var radius = meters / 1000;
    var options = {units: 'kilometers'};
    var circle = turf.circle(turf.point(center.toArray()), radius, options);

    MAP.addLayer({
        'id': 'circle',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': circle,
        },
        'layout': {},
        'paint': {
            'fill-color': '#21A1F3',
            'fill-opacity': 0.3
        }
    });
}

/**
 * Clear circle
 */
function clearCircle() {
    if (MAP.getLayer('circle')) {
        MAP.removeLayer('circle');
    }
    if (MAP.getSource('circle')) {
        MAP.removeSource('circle');
    }
}

/**
 * Check Nearby
 *
 * @param {mapboxgl.LngLat} lngLat
 * @param {number} maxMeters
 * @param {} categories
 */
function checkNearby(lngLat, maxMeters, categories) {
    // 1: go over the Near You Now entries, find which ones are within distance and matching the filters
    maxMeters = parseFloat(maxMeters); // passed in as a .attr() string sometimes

    // Iterate over CM.attractions_nearby and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=CM.attractions_nearby.length; i<l; i++) {
        var attraction = CM.attractions_nearby[i];
        var poiLngLat = new mapboxgl.LngLat(attraction.longitude, attraction.latitude);
        var meters = distanceTo(lngLat, poiLngLat);

        // filter: distance
        if (meters > maxMeters) continue;

        // filter: category
        if (categories) {
            var thesecategories = attraction.categories.split("; ");
            var catmatch = false;
            for (var ti=0, tl=thesecategories.length; ti<tl; ti++) {
                for (var ci=0, cl=categories.length; ci<cl; ci++) {
                    if (categories[ci] == thesecategories[ti]) { catmatch = true; break; }
                }
            }
            if (! catmatch) continue;
        }

        // if we got here, it's a match for the filters; add it to the list
        var miles  = meters / 1609.344;
        var feet   = meters * 3.2808399;
        var range  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        alerts[alerts.length] = { gid:attraction.gid, title:attraction.title, range:range };
    }

    // 2: go over the alerts, see if any of them are not in LAST_BEEP_IDS
    // if so, then we beep and make an alert
    var beep = false;
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        if (LAST_BEEP_IDS.indexOf(key) == -1 ) { beep = true; break; }
    }

    // 3: rewrite LAST_BEEP_IDS to be only the IDs in sight right now
    // this is done regardless of whether we in fact beep, so we can re-beep for the same feature if we leave and then re-enter its area
    LAST_BEEP_IDS = [];
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        LAST_BEEP_IDS[LAST_BEEP_IDS.length] = key;
    }
    LAST_BEEP_IDS.sort();

    // 3: play the sound and compose an alert of what they just stumbled upon
    // the alert() is async otherwise it may block the beep from playing
    if (beep) {
        document.getElementById('alert_beep').play();
        var lines = [];
        for (var i=0, l=alerts.length; i<l; i++) {
            lines[lines.length] = alerts[i].title + ", " + alerts[i].range;
        }
        setTimeout(function () {
            alert( lines.join("\n") );
        }, 1000);
    }
}

// On page load: install event handlers for the Find and Nearby panels
$(document).ready(function () {
    $('#nearby_enabled').change(function () {
        // toggle the nearby config: category pickers, distance selector, etc.
        var enabled = $(this).is(':checked');
        enabled ? $('#nearby-config').show() : $('#nearby-config').hide();

        // if it's not checked, unfilter the results listing to show everything, and remove the circle
        if (! enabled) {
            $('#alerts li').slice(0,25).show();
            $('#alerts li').slice(25).hide();
            clearCircle();
        }
    });
});
