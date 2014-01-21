var BBOX_SOUTHWEST = new L.LatLng(41.11816, -82.08504);
var BBOX_NORTHEAST = new L.LatLng(41.70009, -81.28029);
var MAX_BOUNDS     = new L.LatLngBounds(BBOX_SOUTHWEST,BBOX_NORTHEAST);

// the Bing API key, and a bias bbox for focusing Bing's geocoder, so we don't find so we don't find Cleveland, Oregon
var BING_API_KEY = "AjBuYw8goYn_CWiqk65Rbf_Cm-j1QFPH-gGfOxjBipxuEB2N3n9yACKu5s8Dl18N";
var GEOCODE_BIAS_BOX = "41.202048178648,-81.9627793163304,41.5885467839419,-81.386224018357";

var SUBDOMAINS = [ '1', '2', '3' ];
var BASEMAP = new L.TileLayer("http://maps{s}.clemetparks.com/tilestache/tilestache.cgi/basemap/{z}/{x}/{y}.jpg", { subdomains:SUBDOMAINS });
var LABELS  = new L.TileLayer.WMS("http://maps{s}.clemetparks.com/gwc", { layers:'group_overlays', format:'image/png', transparent:'TRUE', subdomains:SUBDOMAINS });

var MARKER_ICON = L.Icon.extend({ iconUrl:'/static/cms/marker.png', iconSize:new L.Point(30,34) });

var HIGHLIGHT_LINE       = null;
var HIGHLIGHT_LINE_STYLE = { color:"#006600", weight:2, opacity:0.5000, clickable:false, fill:false };

var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:1.00, clickable:false };
var ICON_FROM    = L.Icon.extend({ iconUrl:'/static/desktop/measure1.png' });
var ICON_TO      = L.Icon.extend({ iconUrl:'/static/desktop/measure2.png' });
var MARKER_START  = new L.Marker(new L.LatLng(0,0), { clickable:false, icon:new ICON_FROM() });
var MARKER_END    = new L.Marker(new L.LatLng(0,0), { clickable:false, icon:new ICON_TO() });

var MIN_ZOOM = 10;
var MAX_ZOOM = 17;

///// autoload: initialize the map
$(window).load(function () {
    // this set of startup, only happens if there's a map
    if (! $('#map_canvas').length) return;

    // start the map, dead simple
    MAP = new L.Map('map_canvas', {
        attributionControl: false, zoomControl: true, dragging: true,
        closePopupOnClick: false,
        crs: L.CRS.EPSG3857,
        minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
        layers : [ BASEMAP, LABELS ]
    });
    //MAP.fitBounds(MAX_BOUNDS);

    // go over MARKERS, which are in fact object literals embedded in the HTML, and convert them to true L.Marker instances on the map
    var bounds = [];
    for (var i=0, l=MARKERS.length; i<l; i++) {
        // generate the Marker onto the map, and store a copy of the raw data into the marker as well, for later display
        var m      = MARKERS[i];
        var icon   = new MARKER_ICON();
        var latlng = new L.LatLng(m.lat,m.lng);
        var marker = new L.Marker(latlng, { clickable:true, icon:icon });
        MAP.addLayer(marker);

        // compose some HTML and bind it to this marker, so it opens a popup
        var html = "";
        if (m.imageurl) html += '<img src="' + m.imageurl + '" class="picture" />';
        html += '<p class="title">' + m.title + '</p>';
        html += m.description;

        if (m.externalurl) html += "<br/>" + '<a id="link_moreinfo" target="_top" href="' + m.externalurl + '">More Info</a>';

        if (m.mapquerystring) html += "<br/>" + '<a id="link_fullmap" target="_blank" href="/desktop/map?' + m.mapquerystring + '">View on full map</a>' + ' <a id="link_mobilemap" target="_blank" href="/mobile/map?' + m.mapquerystring + '">(mobile)</a>';

        html += "<br/>" + '<span class="fakelink" onClick="openMarkerDirections(\''+m.type+'\',\''+m.id+'\');">Get Directions</span>';

        marker.htmlcontent = html;
        marker.on('click', function () {
            MAP.closePopup();
            //var popup = new L.Popup({ minWidth:500, maxWidth:700, minHeight:500 });
            var popup = new L.Popup({ minWidth:300, maxWidth:400 });
            popup.setLatLng(this.getLatLng());
            popup.setContent(this.htmlcontent);
            MAP.openPopup(popup);
        });

        // log the marker's latlng to the bounds, so we can later zoom to the data extent
        bounds[bounds.length] = latlng;
    }
    if (bounds.length > 1) {
        bounds = new L.LatLngBounds(bounds);
        bounds = bounds.pad(0.25);
    } else {
        var buffer = 0.050;
        bounds = new L.LatLngBounds(new L.LatLng(bounds[0].lat - buffer,bounds[0].lng - buffer) , new L.LatLng(bounds[0].lat + buffer, bounds[0].lng + buffer));
    }
    MAP.fitBounds(bounds);

    // MARKERS, pass two. go over them and see if there's WKT. if so, plot it onto the map and zoom to its extent
    // yeah, a bit redundant with the marker but this is a rarecase and that many ifs in one place gets unreadable
    if (MARKERS.length == 1 && MARKERS[0].wkt) {
        var only_marker = MARKERS[0];
        HIGHLIGHT_LINE = L.WKTtoFeature(only_marker.wkt, HIGHLIGHT_LINE_STYLE);

        MAP.addLayer(HIGHLIGHT_LINE);
        LABELS.bringToFront();

        var bounds = new L.LatLngBounds(new L.LatLng(only_marker.boxs,only_marker.boxw) , new L.LatLng(only_marker.boxn,only_marker.boxe));
        MAP.fitBounds(bounds);
    }

    // Afterthought: Add a click handler to the map to do a query
    // This is a stripped-down version of the AJAX query used by the main map; it only does Use Areas, and delivers fairly little information
    MAP.on('click', function (event) {
        // is there a popup currently visible? If so, no query at all but close the popup and bail
        // sorry, Leaflet: closePopupOnClick doesn't work for this cuz it clears the popup before we get the click
        if ($('.leaflet-popup').length) return MAP.closePopup();

        // got here? good, do a query
        wmsGetFeatureInfoByPoint(event.layerPoint);
    });
});



///// autoload: set up the Marker Directions
///// this is parallel to and separate from the Directions system used when we're routing to one known location
$(window).load(function () {
    $('#marker_directions_address').keydown(function (key) {
        if(key.keyCode != 13) return;
        getMarkerDirections();
    });

    $('#dialog_marker_directions').dialog({
        modal:false, closeOnEscape:true, autoOpen:false,
        resizable: false,
        width:400, height:175,
        position: 'center',
        title: 'Get Bing driving directions',
        buttons: {
            'Get Directions': function () {
                getMarkerDirections();
            },
            'Clear': function () {
                $('#directions_address').val('');
                $('#directions_address').blur();
                clearDirections();
            },
            'Close': function () {
                $(this).dialog('close');
            }
        }
    });

    $('#dialog_wait').dialog({
        modal:true, closeOnEscape:false, autoOpen:false, resizable: false,
        width:'auto', height:'auto',
        title: '',
        buttons: { }
    });
});

function openMarkerDirections(type,id) {
    // the type and ID are used to find the Directions, as together they uniquely identify
    // an item system-wide. The type is necessary, as some Things such as Parks/Reservations
    // will pick a different destination point, e.g. Park will pick the entrance nearest you,
    // while Trails have a driving_lat/driving_lng
    clearDirections();
    $('#dialog_marker_directions').data('location_type',type);
    $('#dialog_marker_directions').data('location_id',id);
    $('#dialog_marker_directions').dialog('open');
}

function getMarkerDirections() {
    // geocode the address they gave, if it's not blank
    var address = $('#marker_directions_address').val();
    if (!address) return;
    if (address == $('#marker_directions_address').attr('placeholder')) return;

    // call our geocoder to translate the address into sourcelat and sourcelng
    var params = {};
    params.address  = address;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $('#dialog_wait').dialog('open');
    $.get('../../../../ajax/geocode', params, function (result) {
        $('#dialog_wait').dialog('close');
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
        var sourcelat = result.lat;
        var sourcelng = result.lng;
        var title     = result.title;

            // now request from the server the destination lat/lon for this particular feature
        // again, it may be a closest point, a driving-specific point, ...
        var params = {};
        params.type = $('#dialog_marker_directions').data('location_type');
        params.gid  = $('#dialog_marker_directions').data('location_id');
        params.lat  = sourcelat;
        params.lng  = sourcelng;
        params.via  = 'car';
        $.get('../../../../ajax/geocode_for_directions', params, function (result) {
            // we know the sourcelat and sourcelng, and now we have the targetlat and targetlng
            var targetlat = result.lat;
            var targetlng = result.lng;

            // now that we have both endpoints,
            // bail if the address they gave is outside the supported area,
            // sending them to Google instead
            if (! MAX_BOUNDS.contains(new L.LatLng(sourcelat,sourcelng)) ) {
                var params = {
                    saddr : address,
                    daddr: "loc:"+targetlat+','+targetlng,
                    sll: sourcelat + ',' + sourcelng,
                    dll: targetlat + ',' + targetlng
                };
                var gmapsurl = 'https://maps.google.com/maps' + '?' + $.param(params);
                var target = $('#directions_steps');
                target.empty();
                target.append( $('<div></div>').html("The address you have chosen is outside of the covered area. Click the link below to go to Google Maps for directions.") );
                target.append( $('<a></a>').text("Click here for directions from Google Maps").prop('href',gmapsurl).prop('target','_blank') );
                return;
            }

            // request directions
            var directions_params = {
                bing_key:BING_API_KEY,
                sourcelat:sourcelat, sourcelng:sourcelng,
                targetlat:targetlat, targetlng:targetlng,
                tofrom:'to', via:'car'
            };
            $.get('../../../../ajax/directions', directions_params, function (directions) {
                if (! directions || ! directions.wkt) return alert("Could not find directions.");
                clearDirections();

                // lay down the line and the markers
                DIRECTIONS_LINE = L.WKTtoFeature(directions.wkt, DIRECTIONS_LINE_STYLE);
                MARKER_START.setLatLng( new L.LatLng(directions.start.lat,directions.start.lng) );
                MARKER_END.setLatLng( new L.LatLng(directions.end.lat,directions.end.lng) );
                MAP.addLayer(DIRECTIONS_LINE);
                MAP.addLayer(MARKER_START);
                MAP.addLayer(MARKER_END);

                // close the popup, as it obscures the route we're about to draw
                MAP.closePopup();

                // zoom to the extent of the route
                var bounds = L.WSENtoBounds(directions.bounds.west,directions.bounds.south,directions.bounds.east,directions.bounds.north);
                bounds = bounds.pad(0.25);
                MAP.fitBounds(bounds);

                // upsize the dialog panel
                $('#dialog_marker_directions').dialog('option','height', 500 );
                $('#dialog_marker_directions').dialog('option','position','center');

                // fill in the driving direction steps
                var target = $('#marker_directions_steps');
                for (var i=0, l=directions.steps.length; i<l; i++) {
                    var step     = directions.steps[i];
                    var li       = $('<li></li>');
                    var title    = step.stepnumber ? step.stepnumber + '. ' + ( step.turnword ? step.turnword : '') + ' ' + step.text : step.turnword + ' ' + step.text;
                    li.append( $('<span></span>').addClass('directions_step_title').text(title) );
                    if (step.distance && step.duration) {
                        var subtitle = step.distance + ', ' + step.duration;
                        li.append( $('<span></span>').addClass('directions_step_details').text(subtitle) );
                    }
                    target.append(li);
                }
                var total = $('<span></span>').addClass('directions_step_title').html('<b>Total:</b> ' + directions.totals.distance + ', ' + directions.totals.duration);
                target.append( $('<li></li>').addClass('directions_total').append(total) );
            }, 'json'); // end of directions callback
        },'json'); // end of target geocode callback
    },'json'); // end of geocode callback


}


///// autoload: initialize the social links
$(window).load(function () {
    // this set of startup, only happens if there are social links (which does mean that there's a map too)
    if (! $('#social').length) return;

    $('#share_facebook').click(function () {
        var url   = $('#social').attr('shareurl')
        var title = $('#social').attr('sharetitle')

        var url = 'http://www.facebook.com/share.php?u=' + encodeURIComponent(url);
        window.open(url);
    });

    $('#share_twitter').click(function () {
        var url   = $('#social').attr('shareurl')
        var title = $('#social').attr('sharetitle')

        var url = 'http://twitter.com/home?status=' + title + ' ' + encodeURIComponent(url);
        window.open(url);
    });

    $('#dialog_embed').dialog({
        modal:true, closeOnEscape:true, autoOpen:false,
        width:500, height:500,
        buttons: {
            'Close': function () {
                $(this).dialog('close');
            }
        }
    });
    $('#share_embed').click(function () {
        var url   = $('#social').attr('shareurl')
        var title = $('#social').attr('sharetitle')

        var width   = $(window).width();
        var height  = $(window).height();
        var out = '<iframe style="width:'+width+'px;height:'+height+'px;" src="'+url+'"></iframe>';
        $('#dialog_embed').dialog('open');
        $('#textbox_embed').val(out);
        $('#textbox_url').val(url);
    });
    $('#textbox_embed').focus(function () {
        $(this).select();
    });
    $('#textbox_url').focus(function () {
        $(this).select();
    });
});



///// autoload: initialize the Directions button and subsystem
$(window).load(function () {
    $('#dialog_directions').dialog({
        modal:false, closeOnEscape:true, autoOpen:false,
        resizable: false,
        width:400, height:175,
        position: 'center',
        title: 'Get Bing driving directions',
        buttons: {
            'Get Directions': function () {
                getDrivingDirections();
            },
            'Clear': function () {
                $('#directions_address').val('');
                $('#directions_address').blur();
                clearDirections();
            },
            'Close': function () {
                $(this).dialog('close');
            }
        }
    });

    $('#directions_address').keydown(function (key) {
        if(key.keyCode != 13) return;
        var button_callback = $('#dialog_directions').dialog('option','buttons')['Get Directions'];
        button_callback();
    });

    $('#directions_button').click(function () {
        $('#dialog_directions').dialog('open');
    });

    $('#directions_address').focus(function () {
        if ($(this).val() == $(this).attr('placeholder')) $(this).val('');
    });
    $('#directions_address').blur(function () {
        if ($(this).val() == '') $(this).val( $(this).attr('placeholder') );
    });
});

function getDrivingDirections() {
    // make sure the address isn't blank or the "enter a place name" text
    var address = $('#directions_address').val();
    if (!address) return;
    if (address == $('#directions_address').attr('placeholder')) return;

    //the destination is known: the lat-lng of the only Marker on the map
    var targetlat = MARKERS[0].lat;
    var targetlng = MARKERS[0].lng;

    // call our geocoder to translate the address into sourcelat and sourcelng
    var params = {};
    params.address  = address;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $.get('../../../../ajax/geocode', params, function (result) {
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
        var sourcelat = result.lat;
        var sourcelng = result.lng;
        var title     = result.title;

        if (! MAX_BOUNDS.contains(new L.LatLng(sourcelat,sourcelng)) ) {
            var params = {
                saddr : address,
                daddr: "loc:"+targetlat+','+targetlng,
                sll: sourcelat + ',' + sourcelng,
                dll: targetlat + ',' + targetlng
            };
            var gmapsurl = 'https://maps.google.com/maps' + '?' + $.param(params);
            var target = $('#directions_steps');
            target.empty();
            target.append( $('<div></div>').html("The address you have chosen is outside of the covered area. Click the link below to go to Google Maps for directions.") );
            target.append( $('<a></a>').text("Click here for directions from Google Maps").prop('href',gmapsurl).prop('target','_blank') );
            return;
        }

        // compose the directions request
        // we use our own server here so we can get a known-good structure for plotting onto the map
        var directions_params = { bing_key:BING_API_KEY, sourcelat:sourcelat, sourcelng:sourcelng, targetlat:targetlat, targetlng:targetlng, tofrom:'to', via:'car' };
        //console.log(params);
        $.get('../../../../ajax/directions', directions_params, function (directions) {
            if (! directions || ! directions.wkt) return alert("Could not find directions.");
            clearDirections();

            // lay down the line and the markers
            DIRECTIONS_LINE = L.WKTtoFeature(directions.wkt, DIRECTIONS_LINE_STYLE);
            MARKER_START.setLatLng( new L.LatLng(directions.start.lat,directions.start.lng) );
            MARKER_END.setLatLng( new L.LatLng(directions.end.lat,directions.end.lng) );
            MAP.addLayer(DIRECTIONS_LINE);
            MAP.addLayer(MARKER_START);
            MAP.addLayer(MARKER_END);

            // zoom to the extent of the route
            var bounds = L.WSENtoBounds(directions.bounds.west,directions.bounds.south,directions.bounds.east,directions.bounds.north);
            bounds = bounds.pad(0.25);
            MAP.fitBounds(bounds);

            // upsize the dialog panel
            $('#dialog_directions').dialog('option','height', 500 );
            $('#dialog_directions').dialog('option','position','center');

            // fill in the driving direction steps
            var target = $('#directions_steps');
            for (var i=0, l=directions.steps.length; i<l; i++) {
                var step     = directions.steps[i];
                var li       = $('<li></li>');
                var title    = step.stepnumber ? step.stepnumber + '. ' + ( step.turnword ? step.turnword : '') + ' ' + step.text : step.turnword + ' ' + step.text;
                li.append( $('<span></span>').addClass('directions_step_title').text(title) );
                if (step.distance && step.duration) {
                    var subtitle = step.distance + ', ' + step.duration;
                    li.append( $('<span></span>').addClass('directions_step_details').text(subtitle) );
                }
                target.append(li);
            }
            var total = $('<span></span>').addClass('directions_step_title').html('<b>Total:</b> ' + directions.totals.distance + ', ' + directions.totals.duration);
            target.append( $('<li></li>').addClass('directions_total').append(total) );
        }, 'json');
    },'json');
}


function clearDirections() {
    // empty out the listing and downsize the window
    $('#directions_steps').empty();
    $('#dialog_directions').dialog('option','height', 175 );
    $('#dialog_directions').dialog('option','position','center');

    // empty out the listing and downsize the window
    $('#marker_directions_steps').empty();
    $('#dialog_marker_directions').dialog('option','height', 175 );
    $('#dialog_marker_directions').dialog('option','position','center');

    // if there was a route and markers, delete them
    if (DIRECTIONS_LINE) {
        MAP.removeLayer(DIRECTIONS_LINE);
        DIRECTIONS_LINE = null;
    }
    if (MAP.hasLayer(MARKER_START)) {
        MARKER_START.setLatLng( new L.LatLng(0,0) );
        MAP.removeLayer(MARKER_START);
    }
    if (MAP.hasLayer(MARKER_END)) {
        MARKER_END.setLatLng( new L.LatLng(0,0) );
        MAP.removeLayer(MARKER_END);
    }
}


///// autoload: initialize the Search By Name system, if it exists
$(window).load(function () {
    // this set of startup, only happens if there is a Search By Name selector (which does mean that there's a map too)
    if (! $('#searchbyname').length) return;

    $('#searchbyname').change(function () {
        var bbox = $(this).val();
        if (! bbox) return;
        bbox = bbox.split(',');
        bbox = new L.LatLngBounds( new L.LatLng(bbox[1],bbox[0]) , new L.LatLng(bbox[3],bbox[2]) );
        MAP.closePopup();
        MAP.fitBounds(bbox);
    });
});


///// autoload: if there's an image in #image, set the #rightmargin to the same width
///// so the Availability Calendar etc are all nicely aligned
$(window).load(function () {
    var w = $('#image').width();
    $('#rightmargin').width(w);
});



function wmsGetFeatureInfoByPoint(pixel) {
    var pixelbuffer = 20;
    var sw = MAP.layerPointToLatLng(new L.Point(pixel.x - pixelbuffer , pixel.y + pixelbuffer));
    var ne = MAP.layerPointToLatLng(new L.Point(pixel.x + pixelbuffer , pixel.y - pixelbuffer));
    var bbox   = { w:sw.lng, s: sw.lat, e:ne.lng , n:ne.lat };
    var anchor = MAP.layerPointToLatLng(new L.Point(pixel.x,pixel.y));
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

function wmsGetFeatureInfoByLatLng(latlng) {
    var bbox   = { w:latlng.lng, s: latlng.lat, e:latlng.lng , n:latlng.lat };
    var anchor = latlng;
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

function wmsGetFeatureInfoByLatLngBBOX(bbox,anchor) {
    var data = bbox;

    $.get('/cms/query', data, function (html) {
        if (!html) return;
        var popup = new L.Popup({ maxWidth:999, maxHeight:999 });
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
}

