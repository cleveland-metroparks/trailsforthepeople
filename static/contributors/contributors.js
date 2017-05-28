var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:0.80, clickable:false };
var ROUGHCUT_LINE         = null;
var ROUGHCUT_LINE_STYLE   = { color: "#FFFFFF", weight:5, opacity:0.5, clickable:false };

var MARKERS = [];

///// replace the map layers with our own version
///// This is identical to the public-facing version, except that we must use SSL
///// because Chrome and IE can't cope with mixing HTTP and HTTPS on the same page

//var OVERLAYS  = [];
//OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("//maps.clevelandmetroparks.com/wms", { id:'closures', visibility:true, layers:'cm:closures,cm:markers_other,cm:markers_swgh', format:'image/png', transparent:'TRUE' });
//OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("//maps.clevelandmetroparks.com/gwc", { id:'labels', visibility:true, layers:'group_overlays', format:'image/png', transparent:'TRUE' });

// almost identical: we enable the Route Debugging layer for these maps
//OVERLAYS[OVERLAYS.length] = new L.TileLayer.WMS("//maps.clevelandmetroparks.com/wms", { id:'routedebug', visibility:false, layers:'cm:routing_barriers,cm:routing_segments,cm:routing_nodes,cm:route_problem_intersections', format:'image/png', transparent:'TRUE' });


/**
 * An addon to the Date object, to return the date in yyyy-mm-dd format
 */
Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
};

/**
 * Initialize the map (on admin/contributor pages)
 */
function initContributorMap() {
    var options = {
        attributionControl: false,
        zoomControl: false, // add manually, below
        dragging: true,
        closePopupOnClick: true,
        crs: L.CRS.EPSG3857,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomSnap: 0, // fractional zoom
        layers : [ LAYER_MAPBOX_SAT ]
    };

    // Create the map
    MAP = new L.Map('map_canvas', options);
    new L.Control.Zoom({ position: 'bottomright' }).addTo(MAP);

    // Zoom to max extent
    MAP.fitBounds(MAX_BOUNDS);

    // Additional Controls
    L.control.scale().addTo(MAP);

    //// add the overlay layers
    //for (var i=0, l=OVERLAYS.length; i<l; i++) {
    //    var layer = OVERLAYS[i];
    //    if (layer.options.visibility) MAP.addLayer(layer);
    //}

    //// the layer picker
    //MAP.addControl(new L.Control.Layers({
    //},{
    //    'Route debugging' : OVERLAYS[OVERLAYS.length-1]
    //}));

    // debugging: when the viewport changes, log the current bbox and zoom
    function debugOutput () {
        console.log([ 'zoom', MAP.getZoom() ]);
        console.log([ 'center', MAP.getCenter() ]);
        console.log([ 'bounds', MAP.getBounds() ]);
    }
    //MAP.on('moveend', debugOutput);
    //MAP.on('zoomend', debugOutput);

    ///// THE REST OF THESE ELEMENTS
    ///// set up event handlers which are very common to maps in the Contributors system: the geocoder, the park features search, GPS zoom, etc.

    // the Cleveland Metroparks keyword search (cleocoding? ha ha) button
    $('#cleocode_button').click(function () {
        var keyword   = $('#cleocode_address').val();
        var targetdiv = $('#results');
        if (! keyword) return false;

        // empty the previous results
        targetdiv.empty();

        // add a fake result: Address Search, which runs that address as a Bing search
        var addrsearch = $('<li></li>').text('Run a Bing address search').appendTo(targetdiv).addClass('fakelink');
        addrsearch.click(function () {
            geocodeAndZoomContributorMap(MAP , $('#cleocode_address').val() );
        });

        // proceed to search for Cleveland features
        geocodeParkFeature(keyword,targetdiv);
    });
    $('#cleocode_address').keydown(function (event) {
        if (event.keyCode == '13') {
            $('#cleocode_button').click();
            return false;
        }
    });

    // the Current GPS Location button
    $('#gps_button').click(function () {
        MAP.locate({ setView:true, enableHighAccuracy:true });
    });
}

/**
 * Enable TinyMCE on the description editor
 */
$('textarea[name="description"]').tinymce({
    // Location of TinyMCE script
    script_url : '/static/lib/tinymce/jscripts/tiny_mce/tiny_mce.js',

    // General options
    theme : "advanced",
    plugins : "autolink,lists,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template,advlist",

    // Reduced options
    theme_advanced_buttons1 : "code,|,bold,italic,|,bullist,numlist,|,link,unlink",

    // Theme options
    //theme_advanced_buttons1 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,undo,redo,|,hr,removeformat,|,charmap,emotions,media",
    //theme_advanced_buttons2 : "code,|,bold,italic,underline,strikethrough,sub,sup,|,formatselect,fontselect,fontsizeselect",
    //theme_advanced_buttons3 : "justifyleft,justifycenter,justifyright,justifyfull,|,bullist,numlist,|,outdent,indent,blockquote,|,link,unlink,anchor,image,|,forecolor,backcolor",
    //theme_advanced_buttons4 : "tablecontrols",

    theme_advanced_toolbar_location : "top",
    theme_advanced_toolbar_align : "left",
    theme_advanced_statusbar_location : "bottom",
    theme_advanced_resizing : true,

    // Example content CSS (should be your site CSS)
    //content_css : "css/content.css",

    // Drop lists for link/image/media/template dialogs
    template_external_list_url : "lists/template_list.js",
    external_link_list_url : "lists/link_list.js",
    external_image_list_url : "lists/image_list.js",
    media_external_list_url : "lists/media_list.js"
});

/**
 *
 */
function geocodeAndZoomContributorMap(map, searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $('#cleocode_button').attr('disabled',true);
    $('#cleocode_button').val('Loading');

    $.get(API_BASEPATH + 'ajax/geocode', params, function (result) {
        $('#cleocode_button').removeAttr('disabled');
        $('#cleocode_button').val('Go >');
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");

        var latlng = new L.LatLng(result.lat,result.lng);
        MAP.setView(latlng,16);

        if (typeof CENTER_MARKER_AFTER_GEOCODE !== 'undefined') {
            CENTER_MARKER_AFTER_GEOCODE.setLatLng( MAP.getCenter() );
            CENTER_MARKER_AFTER_GEOCODE.fire('drag');
        }

    }, 'json');
}

/**
 * do an AJAX call to fetch a park feature (building, reservation, etc) by keyword and feature type
 * see marker.phtml for a <select> element with all feature types, or see ajax.php::keyword()
 * this assumes that targetdiv is a UL, and appends LIs to it with results
 */
function geocodeParkFeature(keyword,targetdiv) {
    $('#cleocode_button').attr('disabled',true);
    $('#cleocode_button').val('Loading');

    $.get(API_BASEPATH + 'ajax/keyword', { keyword:keyword, limit:20 }, function (reply) {
        $('#cleocode_button').removeAttr('disabled');
        $('#cleocode_button').val('Go >');
        if (! reply || !reply.length) {
            $('<li></li>').text("No matching park features.").appendTo(targetdiv);
            return;
        }

        // go over the results and see if any have an exact match for the "keyword"; if so, then call that our one and only result
        var matchme = keyword.replace(/\W/g,'').toLowerCase();
        for (var i=0, l=reply.length; i<l; i++) {
            var stripped = reply[i].name.replace(/\W/g,'').toLowerCase();
            if (stripped == matchme) {
                reply = [ reply[i] ];
                break;
            }
        }

        // if there was exactly 1 result, simply zoom the map and exit
        if (reply.length == 1) {
            var center = new L.LatLng(reply[0].lat,reply[0].lng);
            MAP.panTo(center);
            return;
        }

        // otherwise, iterate and populate a Did You Mean sort of listing
        for (var i=0, l=reply.length; i<l; i++) {
            var item = reply[i];

            var li = $('<li></li>').text(item.name + ' (' + item.type + ')').addClass('fakelink');
            li.attr('w', item.w);
            li.attr('s', item.s);
            li.attr('e', item.e);
            li.attr('n', item.n);

            li.click(function () {
                MAP.fitBounds(new L.LatLngBounds(new L.LatLng($(this).attr('s'),$(this).attr('w')),new L.LatLng($(this).attr('n'),$(this).attr('e'))));
                if (typeof CENTER_MARKER_AFTER_GEOCODE !== 'undefined') {
                    CENTER_MARKER_AFTER_GEOCODE.setLatLng( MAP.getCenter() );
                    CENTER_MARKER_AFTER_GEOCODE.fire('drag');
                }
            });

            targetdiv.append(li);
        }
    }, 'json');
}

/**
 * utility functions: given a WSEN bounds, construct a real LatLngBounds from it so we can zoom
 */
function WSENtoBounds(west,south,east,north) {
    return L.latLngBounds([ [south,west] , [north,east] ]);
}

/**
 *
 */
function zoomToMarkersExtent() {
    var extent = [];
    for (var wpid in MARKERS) {
        if (MARKERS[wpid]) {
            extent.push(MARKERS[wpid].getLatLng());
        }
    }
    if (extent.length) {
        //MAP.fitBounds(new L.LatLngBounds(extent));
        MAP.fitBounds(new L.LatLngBounds(extent), { padding: [50,50] });
    }
}

/**
 * Geocode
 */
$('#geocode_button').click(function () {
    var address = $('#geocode_text').val();
    geocodeAndZoomContributorMap(MAP, address);
});

/**
 * Generate Rough Cut
 */
function generateRoughCut() {
    if (ROUGHCUT_LINE) {
        MAP.removeLayer(ROUGHCUT_LINE);
        ROUGHCUT_LINE = null;
    }

    var latlngs = [];
    $('#waypoints .waypoint').each(function () {
        var lat = parseFloat( $(this).find('.lat').val() );
        var lng = parseFloat( $(this).find('.lng').val() );
        if (lat && lng) latlngs[latlngs.length] = new L.LatLng(lat,lng);
    });

    if (latlngs.length >= 2) {
        ROUGHCUT_LINE = new L.Polyline([latlngs], ROUGHCUT_LINE_STYLE);
        MAP.addLayer(ROUGHCUT_LINE);
    }
}

/**
 * Place Waypoint button
 *
 * Pick the map's center, create a marker, populate the text fields, make rough route calculation.
 */
$('#waypoints').on("click", ".wp_place", function () {
    var row    = $(this).closest('li');
    var wp_id = row.prop('id');
    var wp_num = get_wp_num_from_wp_id(wp_id);

    // Load marker lat/lng from text fields.
    var lat = parseFloat( row.find('.lat').val() );
    var lng = parseFloat( row.find('.lng').val() );
    var center = new L.LatLng(lat,lng);
    // If the fields currently have no value, use the map center and set the text.
    if (!lat || !lng) {
        center = MAP.getCenter();
        lat = row.find('.lat').val(center.lat);
        lng = row.find('.lng').val(center.lng);
    }

    // add the marker and its drag handler (which updates the text box)
    if (! MARKERS[wp_num]) {
        MARKERS[wp_num] = new L.marker(center, {
            clickable: true,
            draggable: true,
            icon: L.mapbox.marker.icon({
                'marker-symbol': wp_num
            })
        });

        MARKERS[wp_num].wp_id = wp_id;
        MAP.addLayer(MARKERS[wp_num]);

        MARKERS[wp_num].on('dragend', function (event) {
            var latlng = this.getLatLng();
            $('#' + this.wp_id).find('.lat').val(latlng.lat);
            $('#' + this.wp_id).find('.lng').val(latlng.lng);
            generateRoughCut();
        });
    }

    // recalculate the rough cut
    generateRoughCut();

    // hide this button, show the opposite
    $(this).hide();
    $(this).siblings('.wp_remove').show();
});

/**
 * Increment Waypoint
 * 
 * Increment a waypoint's number/position. (When inserting a waypoint we
 * need to increment the number on each waypoint after it.)
 * Takes the waypoint li as "this".
 */
$.fn.increment_waypoint = function() {
    var cur_id = this.attr('id');
    var cur_num = get_wp_num_from_wp_id(cur_id);

    var new_num = cur_num + 1;
    var new_id = 'wp-' + new_num;

    this.attr('id', new_id);
    this.children('label').text(new_num + ':');

    return this;
}

/**
 * Insert Waypoint button
 *
 * Insert another waypoint row into the list, after the one clicked.
 */
$('#waypoints').on("click", ".wp_insert", function () {
    var row = $(this).closest('li');
    var wp_num = get_wp_num_from_wp_id(row.prop('id')) + 1;

    // Increment the waypoint number for each waypoint after the one we're inserting.
    row.nextAll().each(function(i) {
        $(this).increment_waypoint();
    });

    // Bump the marker icon numbers.
    for (i in MARKERS) {
        console.log(i);
        if (i >= wp_num && MARKERS[i]) {
            console.log("increasing " + i);
            var icon = ICONS[i + 1];
            MARKERS[i].icon = icon;
            MARKERS[i].wp_id = make_wp_id_from_wp_num(i + 1);
        }
    }
    // Insert a new spot into our MARKERS array.
    MARKERS.splice(wp_num, 0, null);

    row.after(make_waypoint_li(wp_num));
});

/**
 * Parse the waypoint number (position) from the waypoint id attribute (from inside the <li>).
 */
function get_wp_num_from_wp_id(wp_id) {
    return parseInt(wp_id.substr(3));
}

/**
 * Make the waypoint id attribute (for <li>) from number (position).
 */
function make_wp_id_from_wp_num(wp_num) {
    return 'wp-' + wp_num;
}

/**
 * Make Waypoint List Item
 */
function make_waypoint_li(wp_num) {
    wp_id = 'wp-' + wp_num;
    var row = $('<li class="list-group-item waypoint" id="' + wp_id + '"></li>');
    row.append('<label class="control-label">' + wp_num + ':</label> ');
    row.append('<input type="text" class="lat textonly" name="' + wp_id + '-lat" readonly="readonly" value="0" />');
    row.append('<input type="text" class="lng textonly" name="' + wp_id + '-lng" readonly="readonly" value="0" />');
    row.append('<span class="btn btn-sm btn-default wp_insert pull-right">+</span>');
    row.append('<span class="btn btn-sm btn-default wp_place pull-right">place</span>');
    row.append('<span class="btn btn-sm btn-default wp_remove pull-right">remove</span>');
    return row;
}

/**
 * Remove Waypoint button
 *
 * Remove the marker, clear the text fields, make rough route calculation.
 */
$('#waypoints').on("click", ".wp_remove", function () {
    var row  = $(this).closest('li');
    var wp_num = get_wp_num_from_wp_id(row.prop('id'));

    // clear the text fields
    row.find('.lat').val(0);
    row.find('.lng').val(0);

    // remove the marker
    if (MARKERS[wp_num]) {
        MAP.removeLayer(MARKERS[wp_num]);
        MARKERS[wp_num] = null;
    }

    // recalculate the rough cut
    generateRoughCut();

    // hide this button, show the opposite
    $(this).hide();
    $(this).siblings('.wp_place').show();
});

/**
 * Recalculate button
 *
 * Fetch a route from the server, overwrite MULTILINESTRING, draw it onto the map
 */
$('#recalculate_button').click(function () {
    // load up a list of the waypoints, really a pair of lists: lat,lat,lat & lng,lng,lng
    var lats = [];
    var lngs = [];
    $('#waypoints .waypoint').each(function () {
        var lat = parseFloat( $(this).find('.lat').val() );
        var lng = parseFloat( $(this).find('.lng').val() );
        if (lat && lng) {
            lats[lats.length] = lat;
            lngs[lngs.length] = lng;
        }
    });

    // a quick check: must be at least 2 waypoints
    if (lats.length < 2 || lngs.length < 2) return alert("Need at least 2 points.");

    // if chosen, close up the trail-loop by adding the first WP as the last WP
    var closed = parseInt( $('[name="closedloop"]').val() );
    if (closed) {
        lats[lats.length] = lats[0];
        lngs[lngs.length] = lngs[0];
    }

    // visual effects: remove the plotted route
    if (DIRECTIONS_LINE) MAP.removeLayer(DIRECTIONS_LINE);

    // visual effects: empty the steps/directions list
    $('#directions').empty();

    // visual effects: disable the button
    var button = $(this);
    button.val( button.attr('value0') );
    button.attr("disabled", "disabled");

    // visual effects: blank the elevation profile picture
    $('#elevation_profile').prop('src','/static/images/blank.png');

    // visual effects: blank the totals
    updateHiddenFormText('distance_feet', '');
    updateHiddenFormText('distancetext', '');
    updateHiddenFormText('duration_hike', '');
    updateHiddenFormText('duration_bike', '');
    updateHiddenFormText('duration_bridle', '');
    updateHiddenFormText('durationtext_hike', '');
    updateHiddenFormText('durationtext_bike', '');
    updateHiddenFormText('durationtext_bridle', '');
    $('input[name="hike"]').val('');
    $('input[name="bike"]').val('');
    $('input[name="bridle"]').val('');
    $('input[name="difficulty"]').val('');
    $('input[name="paved"]').val('');

    // GET from the server a route covering these waypoints
    var params = {};
    params.lats           = lats.join(",");
    params.lngs           = lngs.join(",");
    params.terrain_filter = $('select[name="terrain_filter"]').val();
    params.trim_spurs     = $('select[name="trim_spurs"]').val();
    $.get(APP_BASEPATH + 'ajax/routewaypoints', params, function (reply) {
        // re-enable the button
        button.val( button.attr('value1') );
        button.removeAttr("disabled");

        // warn the user of any problems, pass it on to next-stage handling
        // in this case, an error is not fatal and we continue anyway if we have WKT representing at least a partial route
        if (reply.error) alert(reply.error);
        if (! reply.wkt) return;
        renderRoute(reply);
    }, 'json');
});

/**
 * Update hidden form text
 *
 * We have some fields that need to be form inputs so we store the value
 * in the database, but are only ever calculated by the app; never editable
 * by the user and really just displayed as text.
 *
 * This function updates these fields, setting the form input value
 * as well as the html within the corresponding element.
 *
 * @param fieldName
 *   The value of hidden input's name attribute as well as the
 *   html element's id.
 *
 * @param value
 */
function updateHiddenFormText(fieldName, value) {
    hiddenField = $('input[name="' + fieldName + '"]');
    hiddenField.val(value);
    textField = $('#' + fieldName);
    textField.html(value);
}

/**
 *
 */
function renderRoute(routestruct) {
    // load the attributes and totals into the text boxes
    updateHiddenFormText('distance_feet', routestruct.totals.distance_feet);
    updateHiddenFormText('distancetext', routestruct.totals.distancetext);
    updateHiddenFormText('duration_hike', routestruct.totals.duration_hike);
    updateHiddenFormText('duration_bike', routestruct.totals.duration_bike);
    updateHiddenFormText('duration_bridle', routestruct.totals.duration_bridle);
    updateHiddenFormText('durationtext_hike', routestruct.totals.durationtext_hike);
    updateHiddenFormText('durationtext_bike', routestruct.totals.durationtext_bike);
    updateHiddenFormText('durationtext_bridle', routestruct.totals.durationtext_bridle);
    $('input[name="hike"]').val(routestruct.use_hike);
    $('input[name="bike"]').val(routestruct.use_bike);
    $('input[name="bridle"]').val(routestruct.use_bridle);
    $('input[name="mountainbike"]').val(routestruct.use_mountainbike);
    $('input[name="difficulty"]').val(routestruct.difficulty);
    $('input[name="paved"]').val(routestruct.paved);

    // parse the bbox and zoom to it
    var bbox = WSENtoBounds(routestruct.bounds.west,routestruct.bounds.south,routestruct.bounds.east,routestruct.bounds.north);
    MAP.fitBounds(bbox);

    // save the WKT to the hidden textarea, then render the represented geometry to map
    $('input[name="wkt"]').val(routestruct.wkt);
    renderWKTtoMap(routestruct.wkt);

    // save the elevation profile in serialized form to the form, so it can be saved to the server later
    var elev = [];
    for (var vi=0, vl=routestruct.elevationprofile.length; vi<vl; vi++) {
        var vpoint = routestruct.elevationprofile[vi];
        elev[elev.length] = vpoint.x + ' ' + vpoint.y;
    }
    elev = elev.join(",");
    $('input[name="elevation_profile"]').val(elev);
    renderElevationProfile(elev);

    // load the directions into a set of text fields
    renderDirections(routestruct.steps);
}

/**
 *
 */
function renderWKTtoMap(wkt) {
    // remove the existing route line from the map
    if (DIRECTIONS_LINE) { MAP.removeLayer(DIRECTIONS_LINE); DIRECTIONS_LINE = null; }

    // parse the WKT to get a new line, add the new line to the map
    var parser = new Wkt.Wkt();
    parser.read(wkt);
    DIRECTIONS_LINE = parser.toObject(DIRECTIONS_LINE_STYLE);
    MAP.addLayer(DIRECTIONS_LINE);
}

/**
 *
 */
function renderElevationProfile(vpoints) {
    // the vertices have horizontal and vertical info (feet and elev). make a pair of arrays
    var x = [];
    var y = [];
    vpoints = vpoints.split(",");
    for (var i=0, l=vpoints.length; i<l; i++) {
        var xy = vpoints[i].split(" ");
        x[x.length] = xy[0];
        y[y.length] = xy[1];
    }
    x = x.join(',');
    y = y.join(',');

    $('#elevation_profile').prop('src','/static/images/blank.png');
    $.post(APP_BASEPATH + 'ajax/elevationprofilebysegments', { 'x':x, 'y':y }, function (url) {
        if (url.indexOf('http') != 0) return alert(url);
        $('#elevation_profile').prop('src',url);
        $('input[name="elevation_profile_image"]').val(url);
    });
}

/**
 *
 */
function renderDirections(steps) {
    if (! steps) return;

    var target = $('#directions');
    target.empty();
    target.append($('<tr> <th>#</th> <th>Text</th> <th>Dist</th> <th>Hike</th> <th>Bike</th> <th>Bridle</th> </tr>'));

    for (var i=0, l=steps.length; i<l; i++) {
        var step = steps[i];
        //console.log(step);
        var row = $('<tr></tr>');
        row.append($('<td></td>').append( $('<span></span>').prop('id','stepnumber').html(step.stepnumber) ));
        row.append($('<td></td>').append( $('<span></span>').prop('id','text').html(step.text) ));
        row.append($('<td></td>').append( $('<span></span>').prop('id','distance').html(step.distance) ));
        row.append($('<td></td>').append( $('<span></span>').prop('id','timehike').html(step.timehike) ));
        row.append($('<td></td>').append( $('<span></span>').prop('id','timebike').html(step.timebike) ));
        row.append($('<td></td>').append( $('<span></span>').prop('id','timebridle').html(step.timebridle) ));
        target.append(row);
    }
}

/**
 * Since the embedded map is initially hidden in an inactive tab,
 * we have to re-initialize the size/zoom when we show it for the
 * first time.
 */
$('body').on('shown.bs.tab', function (e) {
    if ($(e.target).attr("href") == '#waypoints-route') {
        if (MAP._shown !== true) {
            MAP.invalidateSize(false);
            MAP.fitBounds(MAX_BOUNDS);
            zoomToMarkersExtent();
            MAP._shown = true;
        }
    }
});
