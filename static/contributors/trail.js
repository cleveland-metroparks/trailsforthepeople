var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:0.80, clickable:false };
var ROUGHCUT_LINE         = null;
var ROUGHCUT_LINE_STYLE   = { color: "#FFFFFF", weight:5, opacity:0.5, clickable:false };

//var MARKERS = { 0:null, 1:null, 2:null, 3:null, 4:null, 5:null, 6:null, 7:null, 8:null, 9:null };
var MARKERS = new Array();
var ICONS = {
    0 : L.icon({ iconUrl: '/static/contributors/wp0.png', iconSize:[20,34], iconAnchor:[10,34] }),
    1 : L.icon({ iconUrl: '/static/contributors/wp1.png', iconSize:[20,34], iconAnchor:[10,34] }),
    2 : L.icon({ iconUrl: '/static/contributors/wp2.png', iconSize:[20,34], iconAnchor:[10,34] }),
    3 : L.icon({ iconUrl: '/static/contributors/wp3.png', iconSize:[20,34], iconAnchor:[10,34] }),
    4 : L.icon({ iconUrl: '/static/contributors/wp4.png', iconSize:[20,34], iconAnchor:[10,34] }),
    5 : L.icon({ iconUrl: '/static/contributors/wp5.png', iconSize:[20,34], iconAnchor:[10,34] }),
    6 : L.icon({ iconUrl: '/static/contributors/wp6.png', iconSize:[20,34], iconAnchor:[10,34] }),
    7 : L.icon({ iconUrl: '/static/contributors/wp7.png', iconSize:[20,34], iconAnchor:[10,34] }),
    8 : L.icon({ iconUrl: '/static/contributors/wp8.png', iconSize:[20,34], iconAnchor:[10,34] }),
    9 : L.icon({ iconUrl: '/static/contributors/wp9.png', iconSize:[20,34], iconAnchor:[10,34] })
};




$(window).load(function () {

/////
///// load the map, bare bones with layers but not much else
/////
initContributorMap();

// our version of a WMS GetFeatureInfo control: a map click calls query.php to get JSON info, and we construct a bubble
MAP.on('contextmenu', function (event) {

    var data = {};

    // buffer the click point a little to make a box
    var sw = MAP.layerPointToLatLng(new L.Point(event.layerPoint.x - 15 , event.layerPoint.y - 15));
    var ne = MAP.layerPointToLatLng(new L.Point(event.layerPoint.x + 15 , event.layerPoint.y + 15));
    data.w = sw.lng;
    data.s = sw.lat;
    data.e = ne.lng;
    data.n = ne.lat;
    data.zoom = MAP.getZoom();
    var anchor = new L.LatLng(event.latlng.lat,event.latlng.lng);

    // do the AJAX thing
    $.get('../../ajax/query', data, function (html) {
        if (!html) return;
        var popup = new L.Popup();
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
});



/////
///// enable TinyMCE on the description editor
/////
$('textarea[name="description"]').tinymce({
    // Location of TinyMCE script
    script_url : '/static/tinymce/jscripts/tiny_mce/tiny_mce.js',

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
 * Closure schedule
 */
// Only show the "Schedule" fieldset when "By schedule" is selected
$(".form-control[name='status']").change(function() {
    if (this.value == 'By schedule') {
        $('.schedule-options-group').slideDown();
    } else {
        $('.schedule-options-group').slideUp();
    }
})
// Open date datepicker
$('input[name="schedule-open-date"]').datepicker({
    dateFormat: 'yy-mm-dd'
});
$('#schedule-open-date-today').click(function () {
    var today = new Date().yyyymmdd();
    $('input[name="schedule-open-date"]').val(today);
});
// Close date datepicker
$('input[name="schedule-close-date"]').datepicker({
    dateFormat: 'yy-mm-dd'
});
$('#schedule-close-date-never').click(function () {
    $('input[name="schedule-close-date"]').val('');
});



/////
///// Various buttons and clicks
/////

/**
 * Geocode
 */
$('#geocode_button').click(function () {
    var address = $('#geocode_text').val();
    geocodeAndZoomContributorMap(MAP, address);
});

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
        var icon = ICONS[wp_num];

        MARKERS[wp_num] = new L.Marker(center, { clickable:true, draggable:true, icon:icon });
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
    $('#elevation_profile').prop('src','/static/common/blank.png');

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
    $.get('../../ajax/routewaypoints', params, function (reply) {
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

// Since the embedded map is initially hidden in an inactive tab,
// we have to re-initialize the size/zoom when we show it for the
// first time.
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


//
// Load the trail
//
loadTrail();


});
// end of window.load callback


/**
 * if there's a trail, a technique for loading the existing trail into the waypoint boxes and the map
 * if not, simply hide the 'remove' buttons because there's nothing yet and we're already done
 */
function loadTrail() {
    // phase 1: lay down markers for any waypoints that are populated
    $('#waypoints .waypoint').each(function () {
        // the waypoint's lat/lng are already loaded into the text fields
        var lat = parseFloat( $(this).find('.lat').val() );
        var lng = parseFloat( $(this).find('.lng').val() );

        // click either the Add or Remove button; their actions will show/hide markers, show/hide buttons, et cetera
        if (lat && lng) {
            $(this).find('.wp_place').click();
        } else {
            $(this).find('.wp_remove').click();
        }
    });

    // phase 2: zoom to the collected extent of the markers
    zoomToMarkersExtent();

    // phase 3: load the saved geometry (if any), the rough cut (marker-to-marker segments), and the elevation profile
    generateRoughCut();
    var wkt = $('input[name="wkt"]').val();
    if (wkt) renderWKTtoMap(wkt);
    //var elev = $('input[name="elevation_profile"]').val();
    //if (elev) renderElevationProfile(elev);

    // phase 4: load the directions
    // @TODO: Fix this now that we don't have PHP access in our JS.
    //renderDirections(<?= $trail ? $trail->steps : '' ?>);
    renderDirections(trail_steps);
}

/**
 *
 */
function zoomToMarkersExtent() {
    var extent = [];
    for (var wp_num in MARKERS) {
        if (MARKERS[wp_num]) extent[extent.length] = MARKERS[wp_num].getLatLng();
    }
    if (extent.length) MAP.fitBounds( new L.LatLngBounds(extent) );
}

/**
 *
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
        ROUGHCUT_LINE = new L.MultiPolyline([latlngs], ROUGHCUT_LINE_STYLE);
        MAP.addLayer(ROUGHCUT_LINE);
    }
}

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

    $('#elevation_profile').prop('src','/static/common/blank.png');
    $.post('../../ajax/elevationprofilebysegments', { 'x':x, 'y':y }, function (url) {
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