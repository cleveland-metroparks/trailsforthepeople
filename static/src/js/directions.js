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
                    // @TODO: bubble-this up?
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
    console.log('setDirectionsInputLngLat');
    // Set lat & lng in input element
    $input.data('lat', lngLat.lat);
    $input.data('lng', lngLat.lng);
}

/**
 * Clear data saved in directions input.
 *
 * When the user starts entering something new,
 * remove old data saved in the input.
 */
function clearDirectionsInputData($input, lngLat) {
    console.log('clearDirectionsInputData');

    $input.removeData('lat');
    $input.removeData('lng');
    $input.removeData('isFromGeolocation');
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
    console.log('geocodeDirectionsInput');
    var inputText = ($input).val();
    var lat, lng;

    // Text is "geolocate" (temp til we make a button)
    if (inputText == 'geolocate') {
        geolocateUserForDirectionsInput($input);
        return;
    }

    // Otherwise, make a geocode API call
    $.get(API_NEW_BASE_URL + 'geocode/' + inputText, null, function (reply) {
        if (reply && reply.data.lng && reply.data.lat) {
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
    var inputText = $input.val();

    console.log("checkDirectionsInput (" + getSourceTargetInputId($input) + "): \"" + inputText + "\"");

    if (inputText.length == 0) {
        console.log("empty");
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
        console.log('lat/lng text: ' + latLngStr[1] + ', ' + latLngStr[2]);
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
            // @TODO: Choose from autocomplete (if it's still showing)
            var lngLat = new mapboxgl.LngLat(firstResult.lng, firstResult.lat);
            setDirectionsInputLngLat($input, lngLat);
            return true;
        }
    }

    // Geocode the text
    // geocodeDirectionsInput($input);

    // if ($input.data('lat') && $input.data('lng')) {
    //     console.log(3);
    //     return true;
    // }
}

/**
 * Process "Get Directions" action
 */
function processGetDirectionsForm() {
    console.log('processGetDirectionsForm()');
    clearDirectionsLine();

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
    } else {
        // @TODO: If this didn't work...
    }
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
    CM.elevationProfileData = [];
    if (directions.elevationprofile) {
        CM.elevationProfileData = directions.elevationprofile;
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
 * Return whether the given input element is our directions "source" or "target".
 *
 * @return: "source", "target", or null
 */
function getSourceTargetInputId($input) {
    // First try the data-value-sourcetarget element
    if ($input.attr('data-value-sourcetarget')) {
        return $input.attr('data-value-sourcetarget');
    }
    console.log('getSourceTargetInputId(): not in data-value-sourcetarget; check id');

    // Then try parsing the id
    var inputId = /^(.+)-input$/.exec($input.attr('id'));
    console.log(inputId);
    if (inputId[1].length) {
        return inputId[1];
    }
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


    // Get Directions click
    $('#get-directions').click(function () {
        $('#directions-steps').empty();
        $('.directions-functions').remove();
        processGetDirectionsForm();
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

    ///**
    // * On blur (focus out) of inputs
    // */
    //$(".feature-search-input").blur(function(e) {
    //    console.log('on blur');
    //    checkDirectionsInput($(this));
    //});

    ///**
    // * On change of inputs
    // */
    //$(".feature-search-input").change(function(e) {
    //    console.log('on change');
    //    checkDirectionsInput($(this));
    //    e.preventDefault();
    //    e.stopPropagation();
    //    console.log('end on change');
    //});

    ///**
    // * On keypress in input
    // */
    //$(".feature-search-input").keypress(function(e) {
    //    console.log(e.which);
    //});

    ///**
    // * On keydown in input
    // */
    //$(".feature-search-input").keydown(function(e) {
    //    if (e.which == 9) { // Tab key
    //        e.preventDefault();
    //        if (getSourceTargetInputId($(this)) == 'source') {
    //            $('#target-input').focus();
    //        } else {
    //            $('#get-directions').focus();
    //        }
    //    }
    //});

    /**
     * Autocomplete for to/from inputs
     */
    $(".feature-search-autocomplete").on("filterablebeforefilter", function(e, data) {
        var $ul = $(this),
            $input = $(data.input),
            value = $input.val(),
            listItems = "",
            sourceOrTarget = getSourceTargetInputId($ul);

        console.log('on filterablebeforefilter: ' + sourceOrTarget);

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
                    // When an autocomplete option is clicked:

                    //// First, use preventDefault() to make sure our blur() handler
                    //// on the input does not fire on mousedown
                    //$(this).mousedown(function(e) {
                    //    console.log('autocomplete mousedown');
                    //    e.preventDefault();
                    //    e.stopPropagation();
                    //});

                    // Then, handle a click on a filtered list item
                    $(this).click(function() {
                        console.log('autocomplete click');
                        $input.val($(this).text());
                        $ul.hide();
                        var lat = $(this).children('a').attr('data-value-lat');
                        var lng = $(this).children('a').attr('data-value-lng');
                        // Set lat/lng data inside element
                        setDirectionsInputLngLat($input, {'lng': lng, 'lat': lat})

                        var marker;
                        if (sourceOrTarget == 'source') {
                            marker = MARKER_START;
                        } else {
                            marker = MARKER_END;
                        }
                        placeMarker(marker, lat, lng);
                        // @TODO: If both markers are shown, zoom to fit both.
                        //        We do a fit in the Directions call, but should probably do something here too.
                        MAP.flyTo({center: [lng, lat]});
                    });
                });
            }
        }

    });
});
