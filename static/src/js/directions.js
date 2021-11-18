 /**
 * directions.js
 *
 * JS for directions functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */


/**
 * Launch external app for directions
 * Uses launchnavigator [cordova] plugin.
 */
function launchNativeExternalDirections(sourceLat, sourceLng, targetLat, targetLng, via, isFromGeolocation) {
    var source = [sourceLat, sourceLng],
        target = [targetLat, targetLng],
        options = {
            enableDebug: true,
            transportMode: transportMode
        };
    if (!isFromGeolocation) {
        options.start = source;
    }
    // Car or Transit
    var transportMode = (via == 'bus') ? launchnavigator.TRANSPORT_MODE.TRANSIT : launchnavigator.TRANSPORT_MODE.DRIVING;

    // Launch app
    launchnavigator.navigate(target, options);
}

/**
 * Get directions
 *
 * Part of the Get Directions system:
 * Given source (lat,lng) and target (lat,lng) and other route options,
 * request directions from the API
 * and render them to the screen and to the map,
 * (or launch native mobile directions).
 *
 * @param sourceLat {float}
 * @param sourceLng {float}
 * @param targetLat {float}
 * @param targetLng {float}
 * @param via {string}
 * @param isFromGeolocation {boolean}
 */
function getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation) {
    disableDirectionsButton();

    // Empty out the old directions steps
    $('#directions-steps').empty();

    // In mobile, launch external map app for native car/transit directions
    if (NATIVE_APP && (via=='car' || via=='bus')) {
        launchNativeExternalDirections(sourceLngLat.lat, sourceLngLat.lng, targetLngLat.lat, targetLngLat.lng, via, isFromGeolocation);
        enableDirectionsButton();
        return;
    }

    var data = {
        sourcelat = parseFloat(sourceLngLat.lat),
        sourcelng = parseFloat(sourceLngLat.lng),
        targetlat = parseFloat(targetLngLat.lat),
        targetlng = parseFloat(targetLngLat.lng)
    }

    switch (via) {
        // Driving directions from Bing, by way of our API
        case 'car':
                $.get(API_NEW_BASE_URL + 'directions_driving', data, function (reply) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                },'json')
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Error getting driving directions.", 'error');
                    console.log(textStatus + ': ' + errorThrown);
                })
                .always(function() {
                    enableDirectionsButton();
                });

            break;

        // Transit directions from Bing, by way of our API
        case 'bus':
                $.get(API_NEW_BASE_URL + 'directions_transit', data, function (reply) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                },'json')
                .fail(function(jqXHR, textStatus, errorThrown) {
                    showInfoPopup("Error getting transit directions.", 'error');
                    console.log(textStatus + ': ' + errorThrown);
                })
                .always(function() {
                    enableDirectionsButton();
                });

            break;

        // Directions over trails from our API
        default:
            data.via = via;

            $.get(API_NEW_BASE_URL + 'directions_trails', data, function (reply) {
                if (reply.data && reply.data.wkt) {
                    renderDirectionsStructure(reply.data);
                    updateWindowURLWithDirections();
                } else {
                    var message = "Could not find directions over trails for this start and endpoint.";
                    if (via != 'hike') {
                        message += "\nTry a different type of trail, terrain, or difficulty.";
                    }
                    showInfoPopup(message, 'error');
                }
            },'json')
            .fail(function(jqXHR, textStatus, errorThrown) {
                showInfoPopup("Error getting directions.", 'error');
                console.log(textStatus + ': ' + errorThrown);
            })
            .always(function() {
                enableDirectionsButton();
            });

            break;
    }
}

/**
 * Disable directions button
 */
function disableDirectionsButton() {
    $('#get-directions').prop('disabled', true);
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    $('#get-directions').prop('disabled', false);
}

/**
 * Set directions input lng and lat
 */
function setDirectionsInputLngLat($input, lngLat) {
    // Set lat & lng in input element
    $input.data('lat', lngLat.lat);
    $input.data('lng', lngLat.lng);
}

/**
 * Geolocate user for directions input
 */
function geolocateUserForDirectionsInput($input) {
    // @TODO: Do user geolocation
    isFromGeolocation = true;
    setDirectionsInputLngLat($input, LAST_KNOWN_LOCATION);
}

/**
 * Check if coordinates are within park boundaries.
 */
function isWithinParkBounds(lngLat) {
    // @TODO: Check if within actual parks (not just greater rectangle bounds)
    return MAX_BOUNDS.contains(lngLat);
}

/**
 * Geocode directions form input
 */
function geocodeDirectionsInput($input) {
    var inputText = ($input).val();
    var lat, lng;

    // Text is "geolocate" (temp til we make a button)
    if (inputText == 'geolocate') {
        geolocateUserForDirectionsInput($input);
        return;
    }

    // Text looks like lat & lng.
    var latLngStr = /^(-?\d+\.\d+)\,\s*(-?\d+\.\d+)$/.exec(inputText);
    if (latLngStr) {
        var lngLat = new mapboxgl.LngLat(latLngStr[2], latLngStr[1]);
        setDirectionsInputLngLat($input, lngLat)
        return;
    }

    // Otherwise, make a geocode API call
    $.get(API_NEW_BASE_URL + 'geocode/' + inputText, null, function (reply) {
        if (reply) {
            var lngLat = new mapboxgl.LngLat(reply.data.lng, reply.data.lat);
            setDirectionsInputLngLat($input, lngLat)
        } else {
            // Geocode failed
            // @TODO: Figure out and specify input (source or target)
            var message = "Can't find that address.\nPlease try again.";
            showInfoPopup(message, 'error');
        }
    },'json');
}

/**
 * Check directions input
 */
function checkDirectionsInput($input) {
    if ($input.data('autocompleted') == true) {
        // @TODO: Do we really need this? Can we just rely on lat/lng?
        return true;
    }

    if ($input.data('lat') && $input.data('lng')) {
        return true;
    }

    geocodeDirectionsInput($input);

    if ($input.data('lat') && $input.data('lng')) {
        return true;
    }
}

/**
 * Process Get Directions
 *
 * Replacing processGetDirectionsForm()...
 */
function processGetDirections() {
    var sourceIsRoutable = checkDirectionsInput($('#source-input'));
    var targetIsRoutable = checkDirectionsInput($('#target-input'));

    if (sourceIsRoutable && targetIsRoutable) {
        var sourceLat = parseFloat($('#source-input').data('lat'));
        var sourceLng = parseFloat($('#source-input').data('lng'));
        var sourceLngLat = new mapboxgl.LngLat(sourceLng, sourceLat);

        var targetLat = parseFloat($('#target-input').data('lat'));
        var targetLng = parseFloat($('#target-input').data('lng'));
        var targetLngLat = new mapboxgl.LngLat(targetLng, targetLat);

        var isFromGeolocation = $('#target-input').data('isFromGeolocation') ? true : false;

        var via = $('#directions-via').attr('data-value');

        getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation);

        // @TODO: If this didn't work, trigger outside directions call
    }
}

/**
 * DEPRECATING
 */
function processGetDirectionsForm() {
    // Use synchronous AJAX so the location finding happens in the required order
    // @TODO: Synchronous XMLHttpRequest is deprecated
    $.ajaxSetup({ async:false });

    switch (addresstype) {
        case 'features':
            var keyword = $('#directions_address').val();
            var results = fuse.search(keyword);

            if (!results.length) {
                return alert("We couldn't find any matching landmarks."); // @TODO: Don't alert()
            }

            // Look for exact match in results; if so, use it.
            // if there's still more than one match, then multiple ambiguous results; show a "Did You Mean?" listing
            var keywordSimple = keyword.replace(/\W/g, '').toLowerCase(); // Just alphanumerics
            var exactMatch = null;
            for (var i=0; i<results.length; i++) {
                var resultSimple = results[i].item.title.replace(/\W/g, '').toLowerCase();
                if (resultSimple == keywordSimple) {
                    exactMatch = results[i].item;
                    break;
                }
            }

            if (!exactMatch) {
                sourceLat = null;
                sourceLng = null;
                populateDidYouMean(results);
                return;
            }

            // Exact match.
            // Swap out their stated location name for this one, so they know where we're taking them
            // Then populate the location from the reply
            var placename = exactMatch.title.trim();
            $('#directions_address').val(placename);

            // fill in the GID and Type so we can do more intelligent routing, e.g. destination points for POIs
            $('#directions_source_gid').val(exactMatch.gid);
            $('#directions_source_type').val(exactMatch.type);

            sourceLat = parseFloat(exactMatch.lat);
            sourceLng = parseFloat(exactMatch.lng);

            if (!sourceLat || !sourceLng) {
                return;
            }
            break;
    }

    // Re-enable asynchronous AJAX
    $.ajaxSetup({ async:true });

    getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation);
}

/**
 * Geocode location for directions
 *
 * @param {String} loc_type: 'poi', 'attraction', 'reservation', or 'trail'
 * @param {Integer} loc_gid
 * @param {Float} lat (optional)
 * @param {Float} lng (optional)
 * @param {String} via (optional)
 */
function geocodeLocationForDirections(loc_type, loc_gid, lat, lng, via, lat_el_id, lng_el_id) {
    var output_location = {};

    switch (loc_type) {
        case 'attraction':
            var attraction = CM.get_attraction(loc_gid);
            if (via == 'car' && attraction.drivingdestinationlatitude && attraction.drivingdestinationlongitude) {
                output_location.lat = attraction.drivingdestinationlatitude;
                output_location.lng = attraction.drivingdestinationlongitude;
            } else {
                output_location.lat = attraction.latitude;
                output_location.lng = attraction.longitude;
            }
            break;

        case 'trail':
            var trail = CM.trails[loc_gid];
            break;

        case 'reservation':
        case 'reservation_new':
            var reservation = CM.get_reservation([loc_gid]);
            // @TODO: Choose the closest driving destination
            // currently stored in northlatitude, northlongitude, southlatitude, southlongitude, etc.
            if (via == 'car' && reservation.drivingdestinationlatitude && reservation.drivingdestinationlongitude) {
                output_location.lat = reservation.drivingdestinationlatitude;
                output_location.lng = reservation.drivingdestinationlongitude;
            } else {
                output_location.lat = reservation.latitude;
                output_location.lng = reservation.longitude;
            }
            break;

        default:
            console.log('ERROR: in geocodeLocationForDirections(), type: ' + loc_type);
            break;
    }

    if (output_location[lat] && output_location[lng]) {
        // Save them into the input fields too, so they'd get shared
        $(lat_el_id).val(output_location.lat);
        $(lng_el_id).val(output_location.lng);
    }

    return output_location;
}

/**
 * Populate "Did you mean:?"
 */
function populateDidYouMean(results) {
    var target = $('#directions-steps');
    target.empty();

    // Item 0 is not a result, but the words "Did you mean:"
    var item = $('<li></li>')
        //.append( $('<span></span>')
        .addClass('did-you-mean')
        .text("Did you mean:");
    target.append(item);

    // add the results as a list; each item has a click handler, to populate the address box with the proper name
    for (var i=0, l=results.length; i<l; i++) {
        var result = results[i].item;
        var placename = result.title.replace(/^\s*/,'').replace(/\s*$/,'');

        var item = $('<li></li>');
        item.append( $('<span></span>').addClass('ui-li-heading').text(placename) ).attr('type',result.type).attr('gid',result.gid);

        var tapToFill = function () {
            $('#directions_address').val( $(this).text() );
            $('#directions_source_gid').val( $(this).attr('gid') );
            $('#directions_source_type').val( $(this).attr('type') );
            $('#directions_button').click();
        };
        item.click(tapToFill);

        item.css({ cursor:'pointer' }); // more for Desktop

        target.append(item);
    }

    target.listview('refresh');
}

/**
 * Render directions structure
 */
function renderDirectionsStructure(directions) {
    // Draw the route on the map
    var startPoint = new mapboxgl.LngLat(directions.start.lng, directions.start.lat);
    var endPoint = new mapboxgl.LngLat(directions.end.lng, directions.end.lat);
    var wkt = new Wkt.Wkt(directions.wkt);
    var polyline = wkt.toJson();
    drawDirectionsLine(polyline, startPoint, endPoint);

    var sw = new mapboxgl.LngLat(directions.bounds.west, directions.bounds.south);
    var ne = new mapboxgl.LngLat(directions.bounds.east, directions.bounds.north);
    var bounds = new mapboxgl.LngLatBounds(sw, ne);
    MAP.fitBounds(bounds, {padding: 10});

    // phase 2: put the directions into the panel
    var target = $('#directions-steps');
    target.empty();

    for (var i=0, l=directions.steps.length; i<l; i++) {
        var step     = directions.steps[i];
        var li       = $('<li></li>');
        var title    = (i+1) + '. ' + (step.step_action ? step.step_action : '') + ' ' + step.text;
        li.append( $('<span></span>').addClass('ui-li-heading').text(title) );
        if (step.distance && step.duration) {
            var subtitle = step.distance + ', ' + step.duration;
            li.append( $('<span></span>').addClass('ui-li-desc').text(subtitle) );
        }
        target.append(li);
    }

    // phase 2b: the final part of the direction steps: a total, link to elevation profile, note about the route quality
    var note = $('<span></span>').addClass('ui-li-desc').html('');
    if (directions.retries && directions.retries > 3) {
        note.html("Route may be approximated.");
    }
    var total = $('<span></span>').addClass('ui-li-heading').html('<b>Total:</b> ' + directions.totals.distance + ', ' + directions.totals.duration);
    target.append( $('<li></li>').append(total).append(note) );

    var directionsFunctions = $('<div></div>').addClass('directions-functions');

    // Elevation Profile button
    if (directions.elevationprofile) {
        var elevationProfileBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .prop('id','elevationprofile_button')
            .text('Elevation Profile');
        elevationProfileBtn
            .attr('value1', 'Elevation Profile')
            .attr('value0', 'Loading');
        elevationProfileBtn
            .click(function () {
                makeElevationProfileChart();
                sidebar.open('pane-elevationprofile');
            });

        directionsFunctions.append(elevationProfileBtn);
    }

    // Clear button
    var clearMapBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .text('Clear');
    clearMapBtn.click(function () {
        $('#directions-steps').empty();
        clearDirectionsLine();
        $('.directions-functions').empty();
    });
    directionsFunctions.append(clearMapBtn);

    // Share button
    var shareRouteBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .prop('id','share_route_button')
        .text('Share');
    shareRouteBtn.click(function () {
        makeAndShowShortURL();
        sidebar.open('pane-share');
    });
    directionsFunctions.append(shareRouteBtn);

    // Print button
    if (!NATIVE_APP) {
        var printMeBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .text('Print');
        printMeBtn.click(function () {
            $('#button_print').click();
        });
        directionsFunctions.append(printMeBtn);
    }
    target.after(directionsFunctions);

    // phase 3: save the elevation profile given, if any, so it can be recalled later
    ELEVATION_PROFILE = [];
    if (directions.elevationprofile) {
        ELEVATION_PROFILE = directions.elevationprofile;
    }

    // phase 4: any additional postprocessing
    // give the list that jQuery Mobile magic
    target.listview('refresh');
    // jQM assigns this class, screwing up the position & size of the first button IMG:
    $('.directions-functions img:first').removeClass('ui-li-thumb');
}

/**
 * Update window URL with directions
 */
function updateWindowURLWithDirections() {
    var params = {};

    params.base = (getBasemap() == 'photo') ? 'photo' : 'map';

    params.action = 'directions';

    var via = $('#directions-via').attr('data-value');
    params.via = via ? via : 'hike';

    params.sourceText = $('#source-input').val();
    var sourceLat = parseFloat($('#source-input').data('lat'));
    var sourceLng = parseFloat($('#source-input').data('lng'));
    if (sourceLat && sourceLng) {
        params.sourceLatLng = sourceLat + ',' + sourceLng;
    }

    params.targetText = $('#target-input').val();
    var targetLat = parseFloat($('#target-input').data('lat'));
    var targetLng = parseFloat($('#target-input').data('lng'));
    if (targetLat && targetLng) {
        params.targetLatLng = targetLat + ',' + targetLng;
    }

    if (params.via == 'trail') {
        params.via = $('#directions_via_trail').val();
    }

    // params.loctype = $('#directions_type').val();
    // var isFromGeolocation = $('#target-input').data('isFromGeolocation') ? true : false;

    setWindowURLQueryStringParameters(params, true, true);
}

/**
 * Draw directions line
 *
 * @param polyline {geojson}
 */
function drawDirectionsLine(polyline, from, to) {
    clearDirectionsLine();

    MAP.addLayer({
        'id': 'directionsLine',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': polyline,
        },
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#0000FF',
            'line-width': 6,
            'line-opacity': 0.50
        }
    });

    placeMarker(MARKER_START, from.lat, from.lng);
    placeMarker(MARKER_END, to.lat, to.lng);
}

/**
 * Clear directions line
 */
function clearDirectionsLine() {
    if (MAP.getLayer('directionsLine')) {
        MAP.removeLayer('directionsLine');
    }
    if (MAP.getSource('directionsLine')) {
        MAP.removeSource('directionsLine');
    }

    clearMarker(MARKER_START);
    clearMarker(MARKER_END);

    // @TODO: Check this...
    // and both the Directions and Measure need their content erased, so they aren't confused with each other
    // don't worry, clearDirectionsLine() is always a prelude to repopulating one of these
    //
    $('#directions-steps').empty();
    $('#measure_steps').empty();
}

/**
 * Make elevation profile chart
 */
function makeElevationProfileChart() {
    if (!ELEVATION_PROFILE) {
        return;
    }

    var pointData = [];
    for (var i=0, l=ELEVATION_PROFILE.length; i<l; i++) {
        pointData.push({
            x: ELEVATION_PROFILE[i].x / 5280, // Feet to miles
            y: ELEVATION_PROFILE[i].y
        });
    }

    var ctx = document.getElementById('elevation-profile').getContext('2d');
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Elevation Profile',
                // @TODO: Remove label
                data: pointData,
                pointRadius: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Elevation (feet)',
                        fontColor: '#000'
                    }
                }],
                xAxes: [{
                    type: 'linear',
                    scaleLabel: {
                        display: true,
                        labelString: 'Distance (miles)',
                        fontColor: '#000'
                    },
                    ticks: {
                        min: 0,
                        // stepSize: 0.5,
                        // @TODO: Ideally (previous functionality) ticks every quarter-mile
                        // but precision isn't working, here: if we set stepSize to 0.25,
                        // the .05s are rounded (0.25 => 0.3).
                        // Looks like it should've been fixed here:
                        //   https://github.com/chartjs/Chart.js/pull/5786
                        precision: 2
                    }
                }],
            }
        }
    });
}

/**
 * Launch Get Directions
 */
function launchGetDirections(transport_method) {
    $('#directions_via').val(transport_method);
    $('#directions_via').trigger('change');
    // update that selector: render the page if it's not already been visited,
    // then restyle the selector so it shows the value it has
    $('#directions_via').selectmenu("refresh");
    // and change to the Get Directions panel
    sidebar.open('pane-directions');
}

/**
 * Misc handlers
 */
$(document).ready(function () {
    // The 4 icons launch the Get Directions panel
    // selecting the appropriate transport method
    $('#directions_hike').click(function () {
        launchGetDirections('hike');
    });
    $('#directions_bike').click(function () {
        launchGetDirections('bike');
    });
    $('#directions_bridle').click(function () {
        launchGetDirections('bridle');
    });
    $('#directions_car').click(function () {
        launchGetDirections('car');
    });
    $('#directions_bus').click(function () {
        launchGetDirections('bus');
    });

    // the directions-type picker (GPS, address, POI, etc) mostly shows and hides elements
    // its value is used in processGetDirectionsForm() for choosing how to figure out which element to use
    $('#directions_type').change(function () {
        var which  = $(this).val();
        var target = $('#directions_type_geocode_wrap');
        if (which == 'gps') {
            target.hide();
        } else {
            target.show();
        }
    });

    // Get Directions click
    $('#get-directions').click(function () {
        $('#directions-steps').empty();
        $('.directions-functions').remove();
        processGetDirections();
    });

    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    /**
     * Get directions button does an async geocode on the address,
     * then an async directions lookup between the points,
     * then draws the polyline path and prints the directions
     */
    $('#getdirections_clear').click(function () {
        clearDirectionsLine();
        $('#directions-steps').empty();
    });

    /**
     * Directions "Via" button clicks
     */
    $('.via-buttons a').click(function () {
        $(this).parent().attr('data-value', $(this).attr('data-value'));
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');
    });

    // Autocomplete on To/From inputs
    $(".feature-search-autocomplete").on("filterablebeforefilter", function(e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            listItems = "",
            sourceOrTarget = $ul.attr('data-value-sourcetarget');

        $ul.html("");

        if (value && value.length > 2) {
            var fuse_results = fuse.search(value);
            if (fuse_results) {
                $.each(fuse_results, function (i, val) {
                    var li = '';
                    li += '<li>';
                    li += '<a href="#" data-transition="fade" class="ui-btn"';
                    li += 'data-value-gid="' + val.item.gid + '" ';
                    li += 'data-value-lat="' + val.item.lat + '" ';
                    li += 'data-value-lng="' + val.item.lng + '" ';
                    li += 'data-value-type="' + val.item.type + '"';
                    li += '>' + val.item.title + '</a>';
                    li += '</li>';
                    listItems += li;
                });
                $ul.html(listItems);
                $ul.show();
                $ul.listview("refresh").trigger("updatelayout");
                $ul.children().each(function() {
                    $(this).click(function() {
                        $input.val($(this).text());
                        $ul.hide();
                        var lat = $(this).children('a').attr('data-value-lat');
                        var lng = $(this).children('a').attr('data-value-lng');
                        // Set lat/lng data inside element
                        $input.data('lat', lat);
                        $input.data('lng', lng);
                        $input.data('autocompleted', true); // @TODO: Need to reset this to false at some point

                        var marker;
                        if (sourceOrTarget == 'source') {
                            marker = MARKER_START;
                        } else {
                            marker = MARKER_END;
                        }
                        placeMarker(marker, lat, lng);
                        MAP.flyTo({center: [lng, lat]});
                        // @TODO: If both markers are shown, zoom to fit both.
                        //        We do a fit in the Directions call, but should probably do something here too.
                    });
                });
            }
        }

    });
});
