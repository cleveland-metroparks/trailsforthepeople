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
function launchNativeExternalDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps) {
    var source = [sourcelat, sourcelng],
        target = [targetlat, targetlng];
    // Or reverse
    if (tofrom == 'from') {
        source = [targetlat, targetlng];
        target = [sourcelat, sourcelng];
    }
    options = {
        enableDebug: true,
        transportMode: transportMode
    };
    if (!gps) {
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
 * Given lat,lng and lat,lng and route params, request directions from the server
 * then render them to the screen and to the map.
 */
function getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps) {
    // empty out the old directions and disable the button as a visual effect
    $('#directions_steps').empty();
    disableDirectionsButton();

    // store the source coordinates
    $('#directions_source_lat').val(sourcelat);
    $('#directions_source_lng').val(sourcelng);

    // do they prefer fast, short, or weighted?
    var prefer = $('#directions_prefer').val();

    // Launch external map app for native car/transit directions
    if (NATIVE_APP && (via=='car' || via=='bus')) {
        launchNativeExternalDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps);
        enableDirectionsButton();
        return;
    }

    // make up the params and run the request
    var params = {
        sourcelat: sourcelat,
        sourcelng: sourcelng,
        targetlat: targetlat,
        targetlng: targetlng,
        tofrom: tofrom,
        via: via,
        prefer: prefer,
        bing_key: BING_API_KEY
    };
    $.get(API_BASEPATH + 'ajax/directions', params, function (reply) {
        enableDirectionsButton();

        if (! reply || ! reply.wkt) {
            var message = "Could not find directions.";
            if (via != 'hike') message += "\nTry a different type of trail, terrain, or difficulty.";
            return alert(message);
        }
        renderDirectionsStructure(reply);
    }, 'json');
}

/**
 * Disable directions button
 */
function disableDirectionsButton() {
    var button = $('#directions_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text(button.attr('value0'));
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    var button = $('#directions_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text(button.attr('value1'));
}

/**
 * Process Get Directions form
 *
 * This wrapper checks the directions_type field and other Get Directions fields,
 * decides what to use for the address field and the other params,
 * then calls either getDirections() et al
 */
function processGetDirectionsForm() {
    var tofrom    = $('#directions_reverse').val();
    // Transportation mode
    var via       = $('#directions_via').val();

    if (via == 'bike') {
        // Ability level for bike
        via = $('#directions_via_bike').val();
    }

    // empty these fields because we probably don't need them
    // they will be repopulated in the 'feature' switch below if we're routing to a Park Feature
    $('#directions_source_gid').val('');
    $('#directions_source_type').val('');

    // Use synchronous AJAX so the location finding happens in the required order
    // @TODO: Synchronous XMLHttpRequest is deprecated
    $.ajaxSetup({ async:false });

    // figure out the source: address geocode, latlon already properly formatted, current GPS location, etc.
    // Done before the target is resolved (below) because resolving the target can mean weighting based on the starting point
    // e.g. directions to parks/reservations pick the closest entry point to our starting location
    var sourcelat, sourcelng;
    var addresstype = $('#directions_type').val();

    // If we're routing from the user's current location
    var gps = false;

    switch (addresstype) {
        case 'gps':
            gps = true;
            sourcelat = LAST_KNOWN_LOCATION.lat;
            sourcelng = LAST_KNOWN_LOCATION.lng;
            break;

        case 'geocode':
            var address  = $('#directions_address').val();
            if (! address) {
                return alert("Please enter an address, city, or landmark.");
            }
            // regional assumption in this regular expression: negative lng, positive lat:
            var is_coords = /^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(address);
            if (is_coords) {
                sourcelat = parseFloat(is_coords[1]);
                sourcelng = parseFloat(is_coords[2]);
                getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via);
            } else {
                disableDirectionsButton();
                var params = {};
                params.address  = address;
                params.bing_key = BING_API_KEY;
                params.bbox     = GEOCODE_BIAS_BOX;
                $.get(API_BASEPATH + 'ajax/geocode', params, function (result) {
                    enableDirectionsButton();
                    if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
                    sourcelat = result.lat;
                    sourcelng = result.lng;

                    // if the address is outside of our max bounds, then we can't possibly do a Trails
                    // search, and driving routing would still be goofy since it would traverse area well off the map
                    // in this case, warn them that they should use Bing Maps, and send them there
                    var sourceLngLat = new mapboxgl.LngLat(sourcelng, sourcelat);
                    if (!MAX_BOUNDS.contains(sourceLngLat)) {
                        var from = 'adr.' + address;
                        var to   = 'pos.' + targetlat + '_' + targetlng;
                        var params = {
                            rtp : from+'~'+to,
                        };
                        var gmapsurl = 'http://bing.com/maps/default.aspx' + '?' + $.param(params);
                        var target = $('#directions_steps');
                        target.empty();
                        target.append( $('<div></div>').html("The address you have chosen is outside of the covered area.<br/>Click the link below to go to Bing Maps for directions.") );
                        target.append( $('<a></a>').text("Click here for directions from Bing Maps").prop('href',gmapsurl).prop('target','_blank') );
                        return;
                    }
                },'json');
            }
            break;

        case 'features':
            disableDirectionsButton();
            var params = {};
            params.keyword = $('#directions_address').val();
            params.limit   = 30 ;
            params.lat     = LAST_KNOWN_LOCATION.lat;
            params.lng     = LAST_KNOWN_LOCATION.lng;
            params.via     = via;

            $.get(API_BASEPATH + 'ajax/keyword', params, function (reply) {
                enableDirectionsButton();
                if (! reply || !reply.length) return alert("We couldn't find any matching landmarks.");

                // go over the results and see if any have an exact match for this name; if so, then call that our one and only result
                // if there's still more than 1 match,  then multiple ambiguous results. print a Did You Mean listing
                var matchme = $('#directions_address').val().replace(/\W/g,'').toLowerCase();
                for (var i=0, l=reply.length; i<l; i++) {
                    var stripped = reply[i].name.replace(/\W/g,'').toLowerCase();
                    if (stripped == matchme) {
                        reply = [ reply[i] ];
                        break;
                    }
                }
                if (reply.length > 1) {
                    sourcelat = null;
                    sourcelng = null;
                    populateDidYouMean(reply);
                    return;
                }

                // great, one single match
                // swap out their stated location name for this one, so they know where we're taking them
                // then populate the location from the reply
                var placename = reply[0].name.replace(/^\s*/,'').replace(/\s*$/,'');
                $('#directions_address').val(placename);

                // fill in the GID and Type so we can do more intelligent routing, e.g. destination points for POIs
                $('#directions_source_gid').val(reply[0].gid);
                $('#directions_source_type').val(reply[0].type);

                sourcelat = parseFloat(reply[0].lat);
                sourcelng = parseFloat(reply[0].lng);
            },'json');
            if (! sourcelat || ! sourcelng) {
                return;
            }
            break;
    } // end addresstype switch

    // now get this: sometimes we don't actually route between these two points, but use the type & gid to
    // find the closest target points, e.g. the closest entry gate at a Reservation, or a parking lot for a POI
    // do this for both the Target (the chosen location before the Directions panel opened)
    // and for the Source (whatever address or park feature they entered/selected as the other endpoint)
    var targetlat = parseFloat( $('#directions_target_lat').val() );
    var targetlng = parseFloat( $('#directions_target_lng').val() );

    // Get the source location
    var source_gid  = $('#directions_source_gid').val();
    var source_type = $('#directions_source_type').val();
    if (source_type == 'poi'
        || source_type == 'attraction'
        || source_type == 'reservation'
        || source_type == 'trail')
    {
        var source_loc = geocodeLocationForDirections(source_type, source_gid, targetlat, targetlng, via, '#directions_source_lat', '#directions_source_lng');
        sourcelat = source_loc.lat;
        sourcelng = source_loc.lng;
    }

    // Get the target location
    var target_gid  = $('#directions_target_gid').val();
    var target_type = $('#directions_target_type').val();
    if (target_type == 'poi'
        || target_type == 'attraction'
        || target_type == 'reservation'
        || target_type == 'trail')
    {
        var target_loc = geocodeLocationForDirections(target_type, target_gid, sourcelat, sourcelng, via, '#directions_target_lat', '#directions_target_lng');
        targetlat = target_loc.lat;
        targetlng = target_loc.lng;
    }

    if (! targetlat || ! targetlng) {
        return alert("Please close the directions panel, and pick a location.");
    }

    // Re-enable asynchronous AJAX
    $.ajaxSetup({ async:true });

    getDirections(sourcelat, sourcelng, targetlat, targetlng, tofrom, via, gps);
}

/**
 * Geocode location for directions
 * For type: poi, attraction, reservation, and trail
 */
function geocodeLocationForDirections(loc_type, loc_gid, lat, lng, via, lat_el_id, lng_el_id) {
    var output_location = new Object();
    var params = {
        type : loc_type,
        gid : loc_gid,
        // If this data source uses weighting, this will pick the closest one to our starting location
        lat : lat,
        lng : lng,
        via : via
    };
    $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
        output_location.lat = reply.lat;
        output_location.lng = reply.lng;

        // Save them into the input fields too, so they'd get shared
        $(lat_el_id).val(reply.lat);
        $(lng_el_id).val(reply.lng);
    }, 'json');
    return output_location;
}

/**
 * Populate "Did you mean:?"
 */
function populateDidYouMean(results) {
    var target = $('#directions_steps');
    target.empty();

    // Item 0 is not a result, but the words "Did you mean:"
    var item = $('<li></li>')
        //.append( $('<span></span>')
        .addClass('did-you-mean')
        .text("Did you mean:");
    target.append(item);

    // add the results as a list; each item has a click handler, to populate the address box with the proper name
    for (var i=0, l=results.length; i<l; i++) {
        var result = results[i];
        var placename = result.name.replace(/^\s*/,'').replace(/\s*$/,'');

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
function renderDirectionsStructure(directions, target, options) {
    // no options, no problem
    if (! options) options = {};

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
    if (! target) {
        target = $('#directions_steps');
    }
    target.empty();

    for (var i=0, l=directions.steps.length; i<l; i++) {
        var step     = directions.steps[i];
        var li       = $('<li></li>');
        var title    = step.stepnumber ? step.stepnumber + '. ' + ( step.turnword ? step.turnword : '') + ' ' + step.text : step.turnword + ' ' + step.text;
        li.append( $('<span></span>').addClass('ui-li-heading').text(title) );
        if (step.distance && step.duration && step.distance.substr(0,1)!='0') {
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

    var directionsFunctions = $('<div></div>').addClass('directions_functions');

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
                openElevationProfileBySegments();
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
        $('#directions_steps').empty();
        clearDirectionsLine();
        $('.directions_functions').empty();
    });
    directionsFunctions.append(clearMapBtn);

    // Share button
    if (! options.noshare) {
        // if there are options given, check for noshare:true and skip on the Share link
        var shareRouteBtn = $('<a></a>')
            .addClass('ui-btn')
            .addClass('ui-btn-inline')
            .addClass('ui-corner-all')
            .prop('id','share_route_button')
            .text('Share');
        shareRouteBtn.click(function () {
            updateShareUrlByDirections();
            makeAndShowShortURL();
            sidebar.open('pane-share');
        });
        directionsFunctions.append(shareRouteBtn);
    }

    // Print button
    if (! NATIVE_APP) {
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
    $('.directions_functions img:first').removeClass('ui-li-thumb');
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
    $('#directions_steps').empty();
    $('#measure_steps').empty();
}

/**
 * Event handlers for the directions subsystem
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

    /**
     * Launch Get Directions
     */
    function launchGetDirections(transport_method) {
        $('#directions_via').val(transport_method);
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        // $('#pane-getdirections').page(); // @TODO: GLJS. Still necessary?
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        sidebar.open('pane-getdirections');
    }

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

    // The To/From selector should update all of the selector options to read To XXX and From XXX
    $('#directions_reverse').change(function () {
        var tofrom = $(this).val() == 'to' ? 'from' : 'to';
        $('#directions_type option').each(function () {
            var text = $(this).text();
            text = tofrom + ' ' + text.replace(/^to /, '').replace(/^from /, '');
            $(this).text(text);
        });
        $('#directions_type').selectmenu('refresh', true)
    });

    // This button triggers a geocode and directions, using the common.js interface
    $('#directions_button').click(function () {
        $('#directions_steps').empty();
        $('.directions_functions').remove();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    // This button changes over to the Find subpage, so they can pick a destination
    $('#change_directions_target2').click(function () {
        sidebar.open('pane-browse');

        // If they clicked this button, it means that they will be looking for a place,
        // with the specific purpose of getting Directions there
        // set this flag, which will cause zoomElementClick() to skip showing the info and skip to directions
        SKIP_TO_DIRECTIONS = true;
    });
});

/**
 * Open elevation profile by segments
 */
function openElevationProfileBySegments() {
    if (! ELEVATION_PROFILE) return;

    // The vertices have horizontal and vertical info (feet and elev). make a pair of arrays
    var x = [];
    var y = [];
    for (var i=0, l=ELEVATION_PROFILE.length; i<l; i++) {
        x[x.length] = ELEVATION_PROFILE[i].x;
        y[y.length] = ELEVATION_PROFILE[i].y;
    }
    x = x.join(',');
    y = y.join(',');

    $.post(API_BASEPATH + 'ajax/elevationprofilebysegments', { 'x':x, 'y':y }, function (url) {
        if (url.indexOf('http') != 0) return alert(url);
        showElevation(url);
    });
}

/**
 * the directions button does an async geocode on the address,
 * then an async directions lookup between the points,
 * then draws the polyline path and prints the directions
 */
$(document).ready(function () {
    $('#getdirections_clear').click(function () {
        clearDirectionsLine();
        $('#directions_steps').empty();
    });

    // Selecting "By Trail", "By Car", etc. shows & hides the second filter, e.g. paved/unpaved for "By foot" only
    $('#directions_via').change(function () {
        // hide all secondaries
        $('#directions_via_bike_wrap').hide();

        // now show the appropriate one (if any, only for Bike: basic/advanced; formerly Hike had paved status as a picker)
        var which = $(this).val();
        switch (which) {
            case 'bike':
                $('#directions_via_bike_wrap').show();
                break;
            case 'hike':
                break;
            case 'car':
                break;
            default:
                break;
        }
    });
});
