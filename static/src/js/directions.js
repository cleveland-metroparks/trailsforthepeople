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
                    console.error(textStatus + ': ' + errorThrown);
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
                    console.error(textStatus + ': ' + errorThrown);
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
                console.error(textStatus + ': ' + errorThrown);
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
 * Set the lng and lat inside a directions input element,
 * then place marker and do zoom.
 *
 * Can optionally set the trail-specific location and the
 * driving destination/location so that they can be switched
 * when choosing "via" transport method.
 *
 * @param $input
 * @param lngLat
 * @param trailLngLat (optional)
 * @param drivingLngLat (optional)
 */
function setDirectionsInputLngLat($input, lngLat, trailLngLat, drivingLngLat) {
    $input.data('lat', lngLat.lat);
    $input.data('lng', lngLat.lng);

    if (trailLngLat) {
        $input.data('trail-lat', trailLngLat.lat);
        $input.data('trail-lng', trailLngLat.lng);
    } else {
        $input.removeData('trail-lat');
        $input.removeData('trail-lng');
    }

    if (drivingLngLat) {
        $input.data('driving-lat', drivingLngLat.lat);
        $input.data('driving-lng', drivingLngLat.lng);
    } else {
        $input.removeData('driving-lat');
        $input.removeData('driving-lng');
    }

    var marker;
    if (getSourceTargetInputId($input) == 'target') {
        marker = MARKER_END;
    } else {
        marker = MARKER_START;
    }
    placeMarker(marker, lngLat.lat, lngLat.lng);
    zoomToDirectionsBounds();
}

/**
 * Set the location of the source/target input to either the driving destination
 * or the trail destination (of the given feature);
 * whichever's appropriate based on transport method (via).
 *
 * These specific destinations must already be set in the input;
 * this is just a switcher.
 */
function setAppropriateDestination($input) {
    var sourceOrTarget = getSourceTargetInputId($input); // For debug console.log
    if (useDrivingDestination()) {
        if ($input.data('driving-lat') && $input.data('driving-lat')) {
            $input.data('lat', $input.data('driving-lat'));
            $input.data('lng', $input.data('driving-lng'));
            console.log('Successfully set ' + sourceOrTarget + ' to driving destination.');
        } else {
            console.log('No driving destination exists for ' + sourceOrTarget + '.');
        }
    } else {
        if ($input.data('trail-lat') && $input.data('trail-lat')) {
            $input.data('lat', $input.data('trail-lat'));
            $input.data('lng', $input.data('trail-lng'));
            console.log('Successfully set ' + sourceOrTarget + ' to trail destination.');
        } else {
            console.log('No trail destination exists for ' + sourceOrTarget + '.');
        }
    }
}

/**
 * Should we use the driving destination for the location?
 *
 * @return boolean
 *   Check via setting:
 *     If hiking, FALSE: (normal trail lat/lng)
 *     If driving, bicycling, or transit: TRUE (use driving destination lat/lng)
 */
function useDrivingDestination() {
    return $('#directions-via').attr('data-value') != 'hike';
}

/**
 * Get directions input lng and lat
 */
function getDirectionsInputLngLat($input) {
    var lat = $input.data('lat');
    var lng = $input.data('lng');

    if (lat && lng) {
        return new mapboxgl.LngLat(lng, lat);
    }
}

/**
 * Clear data saved in directions input.
 *
 * When the user starts entering something new,
 * remove old data saved in the input.
 */
function clearDirectionsInputData($input, lngLat) {
    $input.removeData('lat');
    $input.removeData('lng');
    $input.removeData('isFromGeolocation');
}

/**
 * Geolocate user for directions input
 */
function geolocateUserForDirectionsInput($input) {
    basicGeolocate();
    isFromGeolocation = true;
    var userLocation = LAST_KNOWN_LOCATION;
    $input.val(userLocation.lat + ', ' + userLocation.lng);
    setDirectionsInputLngLat($input, userLocation);
}

/**
 *
 */
function zoomToDirectionsBounds() {
    // console.log('zoomToDirectionsBounds');
    var bounds = new mapboxgl.LngLatBounds();

    var sourceCoords = getDirectionsInputLngLat($('#source-input'));
    if (sourceCoords) {
        // console.log('sourceCoords: ', sourceCoords);
        bounds.extend(sourceCoords);
    }
    // console.log('source only bounds: ', bounds);

    var targetCoords = getDirectionsInputLngLat($('#target-input'));
    if (targetCoords) {
        // console.log('targetCoords: ', targetCoords);
        bounds.extend(targetCoords);
    }
    // console.log('new bounds: ', bounds);

    if (sourceCoords || targetCoords) {
        MAP.fitBounds(bounds, {padding: 100});
    }
}

/**
 * Geocode directions form input
 *
 * @return: (promise)
 */
function geocodeDirectionsInput($input) {
    var inputText = ($input).val();
    console.log('geocodeDirectionsInput(): ' + inputText);

    var geocodeResponse = $.ajax({
        url: API_NEW_BASE_URL + 'geocode/' + inputText,
        dataType: 'json',
        success: function (reply) {
            if (reply && reply.data.lng && reply.data.lat) {
                var lngLat = new mapboxgl.LngLat(reply.data.lng, reply.data.lat);
                console.log('geocodeDirectionsInput(): success: ', lngLat);
                setDirectionsInputLngLat($input, lngLat)
            } else {
                // Geocode failed
                console.error('geocodeDirectionsInput(): failure');

                var message;
                var sourceOrTarget = getSourceTargetInputId($input);
                if (sourceOrTarget == 'source') {
                    message = "Can't find the source (\"From:\") address.\nPlease try again.";
                } else {
                    message = "Can't find the target (\"To:\") address.\nPlease try again.";
                }

                showInfoPopup(message, 'error');
            }
        }
    });

    return geocodeResponse;
}

/**
 * Show notes about directions, such as Bing provenance.
 *
 * @example: setRoutingNotes('Directions from Bing');
 */
function setRoutingNotes(notes) {
    $('#directions-notes').text(notes);
}

/**
 * Check directions input
 */
function checkDirectionsInput($input) {
    var inputText = $input.val();

    console.log("checkDirectionsInput (" + getSourceTargetInputId($input) + "): \"" + inputText + "\"");

    if (inputText.length == 0) {
        console.log("CHECK: empty");
        return false;
    }

    // If lat & lng are set - stored in input.
    if ($input.data('lat') && $input.data('lng')) {
        console.log("lat/lng is set");
        return true;
    }

    // If text looks like lat & lng (ex: "41.30230166, -81.80350554")
    // Parse with regex:
    var latLngStr = /(^[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?))\s*,\s*([-+]?(?:180(?:\.0+)?|(?:(?:1[0-7]\d)|(?:[1-9]?\d))(?:\.\d+)?))$/.exec(inputText);
    if (latLngStr) {
        var lngLat = new mapboxgl.LngLat(latLngStr[2], latLngStr[1]);
        // console.log('lat/lng text: ' + latLngStr[1] + ', ' + latLngStr[2]);
        setDirectionsInputLngLat($input, lngLat);
        return true;
    }

    // Check for exact text match from search DB (but not autocompleted)
    var fuseResults = fuse.search(inputText);
    if (fuseResults.length) {
        // If it's exact it should already be the first choice in the list
        // ... but we could potentially go through all results
        var firstResult = fuseResults[0].item;
        var firstResultTitle = firstResult.title;
        if (simplifyTextForMatch(firstResultTitle) == simplifyTextForMatch(inputText)) {
            console.log('Exact match');
            setInputToKnownFeature(
                $input,
                firstResult.title,
                firstResult.lng,
                firstResult.lat,
                firstResult.drivingLng,
                firstResult.drivingLat
            );
            return true;
        }
    }

    // Otherwise, make a geocode API call with the text data
    // and return the promise
    var geocodeResponse = geocodeDirectionsInput($input)
        .done(function() {
            console.log('geocode success (done)');
        })
        .fail(function() {
            console.error('geocode failure (fail)');
        })
        .always(function() {
            console.log('geocode after (always)');
        });

    console.log('geocodeDirectionsInput() response:', geocodeResponse);

    return geocodeResponse;
}

/**
 * Process "Get Directions" action.
 *
 * checkDirectionsInput() returns a promise
 */
async function processGetDirectionsForm() {
    console.log('processGetDirectionsForm()');
    clearDirectionsLine();
    clearDirectionsSteps();

    var sourceIsRoutable = checkDirectionsInput($('#source-input'));
    console.log('sourceIsRoutable: ', sourceIsRoutable);

    var targetIsRoutable = checkDirectionsInput($('#target-input'));
    console.log('targetIsRoutable: ', targetIsRoutable);

    $.when(sourceIsRoutable, targetIsRoutable).done(function() {
        console.log('Source and target both routable!');
        processDirectionsInputsWithLatLngs();
    });
}

/**
 * Process directions inputs that have the lats & lngs set.
 * Run "get directions" on the given data.
 */
function processDirectionsInputsWithLatLngs() {
    var sourceLat = parseFloat($('#source-input').data('lat'));
    var sourceLng = parseFloat($('#source-input').data('lng'));
    var sourceLngLat = new mapboxgl.LngLat(sourceLng, sourceLat);
    console.log("source: " + sourceLngLat);

    var targetLat = parseFloat($('#target-input').data('lat'));
    var targetLng = parseFloat($('#target-input').data('lng'));
    var targetLngLat = new mapboxgl.LngLat(targetLng, targetLat);
    console.log("target: " + targetLngLat);

    var isFromGeolocation = $('#target-input').data('isFromGeolocation') ? true : false;

    var via = $('#directions-via').attr('data-value');

    getDirections(sourceLngLat, targetLngLat, via, isFromGeolocation);
}

/**
 * Simplify text string for matching.
 *
 * Remove whitespace and convert to lowercase.
 */
function simplifyTextForMatch(str) {
    return str.replace(/\W/g, '').toLowerCase();
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

    // Add buttons to the bottom of the steps
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

    // Clear (Directions) button
    var clearDirectionsBtn = $('<a></a>')
        .addClass('ui-btn')
        .addClass('ui-btn-inline')
        .addClass('ui-corner-all')
        .text('Clear');
    clearDirectionsBtn.click(function () {
        clearDirectionsLine();
        clearDirectionsMarkers();
        clearDirectionsSteps();
    });
    directionsFunctions.append(clearDirectionsBtn);

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
    CM.elevationProfileData = [];
    if (directions.elevationprofile) {
        CM.elevationProfileData = directions.elevationprofile;
    }

    // phase 4: any additional postprocessing
    // give the list that jQuery Mobile magic
    target.listview('refresh');
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

    setWindowURLQueryStringParameters(params, true, true);
}

/**
 * Draw directions line
 *
 * @param polyline {geojson}
 */
function drawDirectionsLine(polyline, from, to) {
    clearDirectionsLine();
    clearDirectionsMarkers();

    placeMarker(MARKER_START, from.lat, from.lng);
    placeMarker(MARKER_END, to.lat, to.lng);

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
}

/**
 * Clear directions line
 */
function clearDirectionsMarkers() {
    clearMarker(MARKER_START);
    clearMarker(MARKER_END);
}

/**
 * Clear directions steps & functions
 */
function clearDirectionsSteps() {
    $('#directions-steps').empty();
    $('.directions-functions').remove();
}

/**
 * Launch "Get Directions" from the info pane
 */
function launchGetDirections(via) {
    // Set "via" to the correct transport mode
    $("#directions-via a[data-value='" + via + "']").click();

    // @TODO: Put the destination in the directions target box.
    // $("#pane-info")

    sidebar.open('pane-directions');
}

/**
 * Return whether the given input element is our directions "source" or "target".
 *
 * @return: "source", "target", or null
 */
function getSourceTargetInputId($input) {
    if ($input.attr('data-value-sourcetarget')) {
        return $input.attr('data-value-sourcetarget');
    }
}

/**
 * Set an input's data to a feature.
 * We do this when autocompleting from search results.
 */
function setInputToKnownFeature($input, title, lng, lat, drivingLng, drivingLat) {
    $input.val(title);

    var trailLngLat = new mapboxgl.LngLat(lng, lat);

    var drivingLngLat;
    if (drivingLng && drivingLat) {
        drivingLngLat = new mapboxgl.LngLat(drivingLng, drivingLat);
    }

    // Choose the appropriate destination (driving or trail).
    var lngLat = (useDrivingDestination() && drivingLngLat) ? drivingLngLat : trailLngLat;

    // Set those locations inside the element, place marker and zoom.
    setDirectionsInputLngLat($input, lngLat, trailLngLat, drivingLngLat);
}

/**
 * Misc handlers
 */
$(document).ready(function () {

    // For launching "Get Directions" from other (feature) panes,
    // by clicking a transport mode button:
    $('#directions_hike').click(function () {
        launchGetDirections('hike');
    });
    $('#directions_bike').click(function () {
        launchGetDirections('bike');
    });
    $('#directions_car').click(function () {
        launchGetDirections('car');
    });
    $('#directions_bus').click(function () {
        launchGetDirections('bus');
    });


    // Source geolocation click
    $('#source-geolocate-btn').click(function () {
        geolocateUserForDirectionsInput($('#source-input'));
    });

    // Get Directions click
    $('#get-directions').click(function () {
        processGetDirectionsForm();
    });

    /**
     * Directions "Via" button clicks
     */
    $('.via-buttons a').click(function () {
        $(this).parent().attr('data-value', $(this).attr('data-value'));
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');

        // Switch to driving/trails destinations if appropriate
        setAppropriateDestination($('#source-input'));
        setAppropriateDestination($('#target-input'));

        processGetDirectionsForm();
    });

    /**
     * Autocomplete for to/from inputs
     */
    $(".feature-search-autocomplete").on("filterablebeforefilter", function(e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            listItems = "";

        $ul.html("");

        clearDirectionsInputData($input);

        if (value && value.length > 2) {
            var fuseResults = fuse.search(value);
            if (fuseResults) {
                // Provide search results as autocomplete options
                $.each(fuseResults, function (i, val) {
                    var li = '';
                    li += '<li>';
                    li += '<a href="#" data-transition="fade" class="ui-btn"';
                    li += 'data-value-lat="' + val.item.lat + '" ';
                    li += 'data-value-lng="' + val.item.lng + '" ';
                    li += 'data-value-drivinglat="' + val.item.drivingLat + '" ';
                    li += 'data-value-drivinglng="' + val.item.drivingLng + '" ';
                    li += '>' + val.item.title + '</a>';
                    li += '</li>';
                    listItems += li;
                });
                $ul.html(listItems);
                $ul.show();
                $ul.listview("refresh").trigger("updatelayout");
                $ul.children().each(function() {
                    // Handle click on autocomplete option:
                    $(this).click(function() {
                        setInputToKnownFeature(
                            $input,
                            $(this).text(),
                            $(this).children('a').attr('data-value-lng'),
                            $(this).children('a').attr('data-value-lat'),
                            $(this).children('a').attr('data-value-drivinglng'),
                            $(this).children('a').attr('data-value-drivinglat')
                        );
                        $ul.hide();
                    });
                });
            }
        }

    });
});
