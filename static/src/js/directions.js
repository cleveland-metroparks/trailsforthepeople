 /**
 * directions.js
 *
 * JS for directions functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

//var DIRECTIONS_TARGET     = L.latLng(0,0);
var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:1.00, clickable:false, smoothFactor:0.25 };

/**
 * Get directions
 *
 * Part of the Get Directions system:
 * Given lat,lng and lat,lng and route params, request directions from the server
 * then render them to the screen and to the map.
 */
function getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via) {
    // empty out the old directions and disable the button as a visual effect
    $('#directions_steps').empty();
    disableDirectionsButton();

    // store the source coordinates
    $('#directions_source_lat').val(sourcelat);
    $('#directions_source_lng').val(sourcelng);

    // do they prefer fast, short, or weighted?
    var prefer = $('#directions_prefer').val();

    // make up the params and run the request
    var params = {
        sourcelat:sourcelat, sourcelng:sourcelng,
        targetlat:targetlat, targetlng:targetlng,
        tofrom:tofrom,
        via:via,
        prefer:prefer,
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
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
}

/**
 * Enable directions button
 */
function enableDirectionsButton() {
    var button = $('#directions_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
}

/**
 * Process Get Directions form
 *
 * this wrapper checks the directions_type field and other Get Directions fields,
 * decides what to use for the address field and the other params,
 * then calls either getDirections() et al
 */
function processGetDirectionsForm() {
    // which transportation mode?
    // separated into a switch so we can fuss with them separately, e.g. originally hike and bike had a secondary selector for paved/unpaved status
    var tofrom    = $('#directions_reverse').val();
    var via       = $('#directions_via').val();
    switch (via) {
        case 'hike':
            via = 'hike';
            //via = $('#directions_via_hike').val();
            break;
        case 'bike':
            via = $('#directions_via_bike').val();
            break;
    }

    // empty these fields because we probably don't need them
    // they will be repopulated in the 'feature' switch below if we're routing to a Park Feature
    $('#directions_source_gid').val('');
    $('#directions_source_type').val('');

    // we must do some AJAX for the target location and the origin location, but it must be done precisely in this sequence
    // so, have jQuery use synchronous AJAX calls (yeah, the A in AJAX, I know) so we can do things in proper order
    $.ajaxSetup({ async:false });

    // figure out the target: address geocode, latlon already properly formatted, current GPS location, etc.
    // this must be done before the target is resolved (below) because resolving the target can mean weighting based on the starting point
    // e.g. directions to parks/reservations pick the closest entry point to our starting location
    var sourcelat, sourcelng;
    var addresstype = $('#directions_type').val();
    switch (addresstype) {
        case 'gps':
            sourcelat = LAST_KNOWN_LOCATION.lat;
            sourcelng = LAST_KNOWN_LOCATION.lng;
            break;
        case 'geocode':
            var address  = $('#directions_address').val();
            if (! address) return alert("Please enter an address, city, or landmark.");
            var is_coords = /^(\d+\.\d+)\,(\-\d+\.\d+)$/.exec(address); // regional assumption in this regular expression: negative lng, positive lat
            if (is_coords) {
                sourcelat = parseFloat( is_coords[1] );
                sourcelng = parseFloat( is_coords[2] );
                getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
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
                    if (! MAX_BOUNDS.contains(L.latLng(sourcelat,sourcelng)) ) {
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
                $('#directions_source_gid').val( reply[0].gid );
                $('#directions_source_type').val( reply[0].type );

                sourcelat = parseFloat(reply[0].lat);
                sourcelng = parseFloat(reply[0].lng);
            },'json');
            if (! sourcelat || ! sourcelng) return;
            break;
    } // end of switch for address type

    // now get this: sometimes we don't actually route between these two points, but use the type&gid to
    // find the closest target points, e.g. the closest entry gate at a Reservation, or a parking lot for a POI or Building
    // do this for both the Target (the chosen location before the Directions panel opened)
    // and for the Source (whatever address or park feature they entered/selected as the other endpoint)
    var targetlat = parseFloat( $('#directions_target_lat').val() );
    var targetlng = parseFloat( $('#directions_target_lng').val() );

    var source_gid  = $('#directions_source_gid').val();
    var source_type = $('#directions_source_type').val();
    if (source_type == 'poi' || source_type == 'attraction' ||source_type == 'reservation' || source_type == 'building' || source_type == 'trail') {
        var params = {};
        params.type = source_type;
        params.gid  = source_gid;
        params.lat  = targetlat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = targetlng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
            sourcelat = reply.lat;
            sourcelng = reply.lng;

            // save them into the input fields too, so they'd get shared
            $('#directions_source_lat').val(reply.lat);
            $('#directions_source_lng').val(reply.lng);
        }, 'json');
    }

    var target_gid  = $('#directions_target_gid').val();
    var target_type = $('#directions_target_type').val();
    if (target_type == 'poi' || source_type == 'attraction' || target_type == 'reservation' || target_type == 'building' || target_type == 'trail') {
        var params = {};
        params.type = target_type;
        params.gid  = target_gid;
        params.lat  = sourcelat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = sourcelng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get(API_BASEPATH + 'ajax/geocode_for_directions', params, function (reply) {
            targetlat = reply.lat;
            targetlng = reply.lng;

            // save them into the input fields too, so they'd get shared
            $('#directions_target_lat').val(reply.lat);
            $('#directions_target_lng').val(reply.lng);
        }, 'json');
    }

    if (! targetlat || ! targetlng) return alert("Please close the directions panel, and pick a location.");

    // great! we have resolved the targetlat and targetlng from the best possible location,
    // and resolved the sourcelat and sourcelng from a combination of data source and current location
    // re-enable asynchronous AJAX and request directions
    $.ajaxSetup({ async:true });
    getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
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
function renderDirectionsStructure(directions,target,options) {
    // no options, no problem
    if (! options) options = {};

    // phase 1: remove any old route line, draw the route on the map
    clearDirectionsLine();
    var polyline   = lineWKTtoFeature(directions.wkt, DIRECTIONS_LINE_STYLE);
    var startpoint = L.latLng(directions.start.lat,directions.start.lng);
    var endpoint   = L.latLng(directions.end.lat,directions.end.lng);
    placeDirectionsLine(polyline, startpoint, endpoint);

    // for the bounding box, we save the bbox LatLngBounds into DIRECTIONS_LINE
    // because on Mobile, zooming the map now is an error and the map must be zoomed later, using the DIRECTIONS_LINE global
    DIRECTIONS_LINE.extent = WSENtoBounds(directions.bounds.west,directions.bounds.south,directions.bounds.east,directions.bounds.north);
    var bbox = DIRECTIONS_LINE.extent.pad(0.15);
    MAP.fitBounds(bbox);

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
            populateShareBox();
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
 * Clear directions line
 */
function clearDirectionsLine() {
    // this line actually gets deleted
    if (DIRECTIONS_LINE) {
        MAP.removeLayer(DIRECTIONS_LINE);
        DIRECTIONS_LINE = null;
    }
    // the markers get set to 0,0 and removed from the map
    if (MAP.hasLayer(MARKER_FROM)) {
        MARKER_FROM.setLatLng( L.latLng(0,0) );
        MAP.removeLayer(MARKER_FROM);
    }
    if (MAP.hasLayer(MARKER_TO)) {
        MARKER_TO.setLatLng( L.latLng(0,0) );
        MAP.removeLayer(MARKER_TO);
    }

    // and both the Directions and Measure need their content erased, so they aren't confused with each other
    // don't worry, clearDirectionsLine() is always a prelude to repopulating one of these
    $('#directions_steps').empty();
    $('#measure_steps').empty();
}

/**
 * Place directions line
 */
function placeDirectionsLine(polyline,startll,endll) {
    // save the polyline to the global
    DIRECTIONS_LINE = polyline;

    // lay down the polyline as-is
    MAP.addLayer(DIRECTIONS_LINE);

    // place the markers on the start and end vertices, and disable their dragging
    MARKER_FROM.setLatLng(startll);
    MAP.addLayer(MARKER_FROM);
    MARKER_TO.setLatLng(endll);
    MAP.addLayer(MARKER_TO);
    MARKER_FROM.dragging.disable();
    MARKER_TO.dragging.disable();
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
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        sidebar.open('pane-getdirections');
    }

    // the directions-type picker (GPS, address, POI, etc) mostly shows and hides elements
    // its value is used in processGetDirectionsForm() for choosing how to figure out which element to use
    $('#directions_type').change(function () {
        var which  = $(this).val();
        var target = $('#directions_type_geocode_wrap');
        if (which == 'gps') target.hide();
        else                target.show();
    });

    // the To/From selectior should update all of the selector options to read To XXX and From XXX
    $('#directions_reverse').change(function () {
        var tofrom = $(this).val() == 'to' ? 'from' : 'to';
        $('#directions_type option').each(function () {
            var text = $(this).text();
            text = tofrom + ' ' + text.replace(/^to /, '').replace(/^from /, '');
            $(this).text(text);
        });
        $('#directions_type').selectmenu('refresh', true)
    });

    // this button triggers a geocode and directions, using the common.js interface
    $('#directions_button').click(function () {
        $('#directions_steps').empty();
        $('.directions_functions').remove();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    // this button changes over to the Find subpage, so they can pick a destination
    $('#change_directions_target2').click(function () {
        sidebar.open('pane-browse');

        // if they clicked this button, it means that they will be looking for a place,
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

    // the vertices have horizontal and vertical info (feet and elev). make a pair of arrays
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

    // selecting By Trail, By Car, etc. shows & hides the second filter, e.g. paved/unpaved for "By foot" only
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
