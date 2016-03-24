var MOBILE; // set in desktop.js and mobile.js, so we can work around some things in shared code

var ICON_TARGET = L.icon({
    iconUrl: 'https://maps.clevelandmetroparks.com/static/common/marker-target.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ]
});
var MARKER_TARGET = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_TARGET });

var ICON_GPS = L.icon({
    iconUrl: 'https://maps.clevelandmetroparks.com/static/common/marker-gps.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ]
});
var MARKER_GPS     = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_GPS });

var ICON_FROM = L.icon({
    iconUrl: 'https://maps.clevelandmetroparks.com/static/desktop/measure1.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var ICON_TO = L.icon({
    iconUrl: 'https://maps.clevelandmetroparks.com/static/desktop/measure2.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var MARKER_FROM  = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_FROM });
var MARKER_TO    = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_TO });

var CIRCLE         = new L.Circle(L.latLng(0,0), 1);

var ELEVATION_PROFILE     = null;

var DIRECTIONS_TARGET     = L.latLng(0,0);

var DIRECTIONS_LINE       = null;
var DIRECTIONS_LINE_STYLE = { color:"#0000FF", weight:5, opacity:1.00, clickable:false, smoothFactor:0.25 };

var HIGHLIGHT_LINE       = null;
var HIGHLIGHT_LINE_STYLE = { color:"#FF00FF", weight:3, opacity:0.75, clickable:false, smoothFactor:0.25 };

var URL_PARAMS = null; // this becomes a pURL object for fetching URL params
var SHARE_URL_STRING = null; // a query string for sharing the map in the current state, updated by updateShareUrl() and later minified by populateShareBox()

var ENABLE_MAPCLICK = true; // a flag indicating whether to allow click-query; on Mobile we disable it after switchToMap()

var SKIP_TO_DIRECTIONS = false; // should More Info skip straight to directions? usually not, but there is one button to make it so

///// JavaScript code common to both Mobile and Desktop maps


// extend Leaflet: add to LatLng the ability to calculate the bearing to another LatLng
L.LatLng.prototype.bearingTo= function(other) {
    var d2r  = L.LatLng.DEG_TO_RAD;
    var r2d  = L.LatLng.RAD_TO_DEG;
    var lat1 = this.lat * d2r;
    var lat2 = other.lat * d2r;
    var dLon = (other.lng-this.lng) * d2r;
    var y    = Math.sin(dLon) * Math.cos(lat2);
    var x    = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
    var brng = Math.atan2(y, x);
    brng = parseInt( brng * r2d );
    brng = (brng + 360) % 360;
    return brng;
};
L.LatLng.prototype.bearingWordTo = function(other) {
    var bearing = this.bearingTo(other);
    var bearingword = '';
     if (bearing >= 22  && bearing <= 67)  bearingword = 'NE';
    else if (bearing >= 67 && bearing <= 112)  bearingword = 'E';
    else if (bearing >= 112 && bearing <= 157) bearingword = 'SE';
    else if (bearing >= 157 && bearing <= 202) bearingword = 'S';
    else if (bearing >= 202 && bearing <= 247) bearingword = 'SW';
    else if (bearing >= 247 && bearing <= 292) bearingword = 'W';
    else if (bearing >= 292 && bearing <= 337) bearingword = 'NW';
    else if (bearing >= 337 || bearing <= 22)  bearingword = 'N';
    return bearingword;
};





// compatibility: make click and tap events equivalent so we don't have to "if mobile tap, else click"
// While jQM has a .click() handler, it specifically has a half-second delay built in, which makes the app feel slow.
if (! jQuery.fn.tap ) {
    jQuery.fn.tap = jQuery.fn.click;
} else {
    jQuery.fn.click = jQuery.fn.tap;
}


// on page load: start the map
function initMap () {
    // in mobile mode, render the Settings panel because we may need to check checkboxes in it
    if (MOBILE) $('#page-settings').page();

    // URL param: the base map; defaults to the "map" basemap
    var base = URL_PARAMS.param('base');
    if (! base) base = 'map';
    var basemap; // which L.TileLayer instance to use?
    switch (base) {
        case 'photo':
            var checkbox = $('input[name="basemap"][value="photo"]').prop('checked',true);
            if (MOBILE) checkbox.checkboxradio('refresh');
            basemap = PHOTOBASE;
            break;
        case 'map':
            var checkbox = $('input[name="basemap"][value="map"]').prop('checked',true);
            if (MOBILE) checkbox.checkboxradio('refresh');
            basemap = MAPBASE;
            break;
        default:
            throw "Invalid basemap given?";
            break;
    }

    // start the map, only the basemap for starters
    // do some detection of browser to find Android 4+ and override the animation settings, hoping to enable pinch-zoom without breaking the app entirely
    // this is specifically contraindicated by Leaflet's own feature detection
    var options = {
        attributionControl: false, zoomControl: true, dragging: true,
        closePopupOnClick: false,
        crs: L.CRS.EPSG3857,
        minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
        layers : [ basemap ]
    };
    var android4 = navigator.userAgent.match(/Android (4|5)/);
    if (android4) {
        options.fadeAnimation       = true;
        options.zoomAnimation       = true;
        options.markerZoomAnimation = true;
    }
    MAP = new L.Map('map_canvas', options);

    // zoom to the XYZ given in the URL, or else to the max extent
    if (URL_PARAMS.param('x') && URL_PARAMS.param('y') && URL_PARAMS.param('z')) {
        var x = parseFloat( URL_PARAMS.param('x') );
        var y = parseFloat( URL_PARAMS.param('y') );
        var z = parseInt( URL_PARAMS.param('z') );
        MAP.setView( L.latLng(y,x),z);

        MAP.addLayer(MARKER_TARGET);
        MARKER_TARGET.setLatLng(L.latLng(y,x));
    } else {
        MAP.fitBounds(MAX_BOUNDS);
    }

    // additional Controls
    L.control.scale().addTo(MAP);

    // debugging: when the viewport changes, log the current bbox and zoom
    function debugBoundsOutput() {
        console.log([ 'zoom', MAP.getZoom() ]);
        console.log([ 'center', MAP.getCenter() ]);
        console.log([ 'bounds', MAP.getBounds() ]);
    }
    function debugScaleZoomOutput() {
        var DOTS_PER_INCH    = 72;
        var INCHES_PER_METER = 1.0 / 0.02540005080010160020;
        var INCHES_PER_KM    = INCHES_PER_METER * 1000.0;
        var sw       = MAP.getBounds().getSouthWest();
        var ne       = MAP.getBounds().getNorthEast();
        var halflng   = ( sw.lng + ne.lng ) / 2.0;
        var midBottom = L.latLng(sw.lat,halflng);
        var midTop    = L.latLng(ne.lat,halflng);
        var mheight   = midTop.distanceTo(midBottom);
        var pxheight  = MAP.getSize().x;
        var kmperpx   = mheight / pxheight / 1000.0;
        var scale    = Math.round( (kmperpx || 0.000001) * INCHES_PER_KM * DOTS_PER_INCH );
        scale *= 2.0; // no idea why but it's doubled
        scale = 1000 * Math.round(scale / 1000.0); // round to the nearest 100 so we can fit MapFish print's finite set of scales
        console.log([ 'zoom & scale' , MAP.getZoom(), scale ]);
    }
    //MAP.on('moveend', debugBoundsOutput);
    //MAP.on('zoomend', debugBoundsOutput);
    //MAP.on('moveend', debugScaleZoomOutput);
    //MAP.on('zoomend', debugScaleZoomOutput);

    // our version of a WMS GetFeatureInfo control: a map click calls query.php to get JSON info, and we construct a bubble
    // BUT, we only call this if a popup is not open: if one is open, we instead close it
    MAP.on('click', function (event) {
        // are we ignoring click behaviors for the moment?
        if (! ENABLE_MAPCLICK) return;

        // is there a popup currently visible? If so, no query at all but close the popup and bail
        // sorry, Leaflet: closePopupOnClick doesn't work for this cuz it clears the popup before we get the click
        if ($('.leaflet-popup').length) {
            return MAP.closePopup();
        }

        // got here? good, do a query
        wmsGetFeatureInfoByPoint(event.layerPoint);
    });

    // URL param: if they search for a type and a name, do that search via AJAX now
    if (URL_PARAMS.param('type') && URL_PARAMS.param('name') ) {
        var params = {
            type: URL_PARAMS.param('type'),
            name: URL_PARAMS.param('name')
        };
        $.get('../ajax/exactnamesearch', params, function (reply) {
            if (!reply || ! reply.s || ! reply.w || ! reply.n || ! reply.e) return alert("Cound not find that feature.");

            // zoom to the location
            var box = L.latLngBounds( L.latLng(reply.s,reply.w) , L.latLng(reply.n,reply.e) );
            MAP.fitBounds(box);

            // lay down the WKT or a marker to highlight it
            if (reply.lat && reply.lng) {
                placeTargetMarker(reply.lat,reply.lng);
            }
            else if (reply.wkt) {
                HIGHLIGHT_LINE = lineWKTtoFeature(reply.wkt, HIGHLIGHT_LINE_STYLE);
                MAP.addLayer(HIGHLIGHT_LINE);
            }
        }, 'json');
    }

    // URL param: if they give a route in the params, fill in the boxes and run it now
    if (URL_PARAMS.param('routefrom') && URL_PARAMS.param('routeto') && URL_PARAMS.param('routevia') ) {
        // split out the params
        var sourcelat = URL_PARAMS.param('routefrom').split(",")[0];
        var sourcelng = URL_PARAMS.param('routefrom').split(",")[1];
        var targetlat = URL_PARAMS.param('routeto').split(",")[0];
        var targetlng = URL_PARAMS.param('routeto').split(",")[1];
        var via       = URL_PARAMS.param('routevia');
        var tofrom    = 'to';

        // toggle the directions panel so it shows directions instead of Select A Destination
        if (MOBILE) $('#page-getdirections').page();
        $('#getdirections_disabled').hide();
        $('#getdirections_enabled').show();

        // fill in the directions field: the title, route via, the target type and coordinate, the starting coordinates
        $('#directions_target_title').text(URL_PARAMS.param('routetitle'));
        $('#directions_via').val(URL_PARAMS.param('routevia'));
        if (MOBILE) $("#directions_via").selectmenu('refresh');
        $('#directions_type').val('geocode');
        if (MOBILE) $("#directions_type").selectmenu('refresh');
        if (MOBILE) $('#directions_type_geocode_wrap').show();
        else        $('#directions_type').change();
        $('#directions_address').val(URL_PARAMS.param('routefrom'));
        $('#directions_target_lat').val(targetlat);
        $('#directions_target_lng').val(targetlng);
        $('#directions_via').trigger('change');
        $('#directions_address').val( URL_PARAMS.param('fromaddr') );
        $('#directions_reverse').val( URL_PARAMS.param('whichway') );
        $('#directions_via_bike').val( URL_PARAMS.param('routevia_bike') );

        setTimeout(function () {
            $('#directions_reverse').trigger('change');
        },1000);
        $('#directions_type').val( URL_PARAMS.param('loctype') );

        // make the Directions request
        getDirections(sourcelat,sourcelng,targetlat,targetlng,tofrom,via);
    }

    // on map activity, update the Share box
    // have the Share box highlight when it is selected, and update the Share box right off
    $('#share_url').click(function () {
        $(this).select();
    });
    MAP.on('moveend', updateShareUrl);
    MAP.on('zoomend', updateShareUrl);
    MAP.on('layerremove', updateShareUrl);
    MAP.on('layeradd', updateShareUrl);
    updateShareUrl();
}




// decode a WKT geometry into a feature, e.g. LINESTRING(12 34, 56 78) to L.Polyline instance
// params are the WKT string, and the other options to pass to the constructor (e.g. color style and other Path options)
function lineWKTtoFeature(wkt,style) {
    var parser = new Wkt.Wkt();
    parser.read(wkt);
    return parser.toObject(style);
}

// given a WSEN set of ordinates, construct a L.LatLngBounds
function WSENtoBounds(west,south,east,north) {
    return L.latLngBounds([ [south,west] , [north,east] ]);
}

function selectBasemap(which) {
    switch (which) {
        case 'photo':
            if (MAP.hasLayer(MAPBASE)) MAP.removeLayer(MAPBASE);
            if (! MAP.hasLayer(PHOTOBASE)) MAP.addLayer(PHOTOBASE,true);
            PHOTOBASE.bringToBack();
            break;
        case 'map':
            if (MAP.hasLayer(PHOTOBASE)) MAP.removeLayer(PHOTOBASE);
            if (! MAP.hasLayer(MAPBASE)) MAP.addLayer(MAPBASE,true);
            MAPBASE.bringToBack();
            break;
    }
}




function placeTargetMarker(lat,lon) {
    MAP.addLayer(MARKER_TARGET);
    MARKER_TARGET.setLatLng(L.latLng(lat,lon));
}
function clearTargetMarker() {
    MAP.removeLayer(MARKER_TARGET);
}

function placeGPSMarker(lat,lon) {
    MAP.addLayer(MARKER_GPS);
    MARKER_GPS.setLatLng(L.latLng(lat,lon));
}
function clearGPSMarker() {
    MAP.removeLayer(MARKER_GPS);
}

function placeCircle(lat,lon,meters) {
    MAP.removeLayer(CIRCLE);
    CIRCLE.setLatLng(L.latLng(lat,lon));
    CIRCLE.setRadius(meters);
    MAP.addLayer(CIRCLE);
}
function clearCircle() {
    CIRCLE.setLatLng(L.latLng(0,0));
    CIRCLE.setRadius(1);
    MAP.removeLayer(CIRCLE);
}


// given a string, try to parse it as coordinates and return a L.LatLng instance
// currently supports these formats:
//      N 44 35.342 W 123 15.669
//      44.589033 -123.26115
function strToLatLng(text) {
    var text = text.replace(/\s+$/,'').replace(/^\s+/,'');

    // simplest format is decimal numbers and minus signs and that's about it
    // one of them must be negative, which means it's the longitude here in North America
    if (text.match(/^[\d\.\-\,\s]+$/)) {
        var dd = text.split(/[\s\,]+/);
        if (dd.length == 2) {
            dd[0] = parseFloat(dd[0]);
            dd[1] = parseFloat(dd[1]);
            if (dd[0] && dd[1]) {
                var lat,lng;
                if (dd[0] < 0) {
                    lat = dd[1];
                    lng = dd[0];
                } else {
                    lat = dd[0];
                    lng = dd[1];
                }
                return L.latLng([lat,lng]);
            }
        }
    }

    // okay, how about GPS/geocaching format:   N xx xx.xxx W xxx xx.xxx
    var gps = text.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);
    if (gps) {
        var latd = parseInt(gps[1]);
        var latm = parseInt(gps[2]);
        var lond = parseInt(gps[3]);
        var lonm = parseInt(gps[4]);

        var lat = latd + (latm/60);
        var lng = -lond - (lonm/60);

        return L.latLng([lat,lng]);
    }

    //if we got here then nothing matched, so bail
    return null;
}


function zoomToAddress(searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $.get('../ajax/geocode', params, function (result) {
        if (! result) return alert("We couldn't find that address or city.\nPlease try again.");
        var latlng = L.latLng(result.lat,result.lng);

        // if this point isn't even in the service area, complain and bail
        // tip: "post office" finds Post Office, India
        if (! MAX_BOUNDS.contains(latlng) ) {
            return alert("The only results we could find are too far away to zoom the map there.");
        }

        // zoom the point location, nice and close, and add a marker
        switchToMap(function () {
            MAP.setView(latlng,16);
            placeTargetMarker(result.lat,result.lng);

            // add a bubble at the location indicating their interpretation of the address, so we can see how bad the match was
            // also add a specially-crafted span element with lat= lng= and title= for use with zoomElementClick()
            var html = "";
            html += '<h3 class="popup_title">' + result.title + '</h3>';
            html += '<span class="fakelink zoom" title="' + result.title + '" lat="' + result.lat + '" lng="' + result.lng + '" w="' + result.w + '" s="' + result.s + '" e="' + result.e + '" n="' + result.n + '" onClick="zoomElementClick( $(this) );">Directions</span>';
            var popup = new L.Popup();
            popup.setLatLng(latlng);
            popup.setContent(html);
            MAP.openPopup(popup);
        });
    }, 'json');
};

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
    data.zoom = MAP.getZoom();

    $.get('../ajax/query', data, function (html) {
        if (!html) return;

        // set up the Popup and load its content
        // beware of very-lengthy content and force a max height on the bubble
        var options = {};
        options.maxHeight = parseInt( $('#map_canvas').height() - $('#toolbar').height() );
        options.maxWidth = parseInt( $('#map_canvas').width() );
        var popup = new L.Popup(options);
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
}




// event handler on the map canvas: when it is resized, trigger a refresh
$(window).resize(function () {
    MAP.invalidateSize();
});






///// on page load
///// event handlers for the geocoder
$(window).load(function () {
    var thisCallback = function () {
        var address = $('#geocode_text').val();
        zoomToAddress(address);
    };
    $('#geocode_button').tap(thisCallback);

    $('#geocode_text').keydown(function (key) {
        if(key.keyCode == 13) $('#geocode_button').tap();
    });
});



///// on page load
///// event handlers for the .zoom buttons: click it to bring up info window, configure the Show On Map button
$(window).load(function () {
    // zoomElementClick() is defined by mobile.js and desktop.js
    // typically it goes to a Details page and sets up various event handlers
    var openDetailsPanel = function () {
        zoomElementClick( $(this) );
    };
    $('.zoom').tap(openDetailsPanel);

    // when Show On Map is clicked (in the detals panel) it has associated data:
    // an element with w,s,e,n,lat,lng,type,gid etc. for fetching more info or adjusting the map to zoom
    var showOnMap = function () {
        // zoom the map to the feature's bounds, and place a marker if appropriate
        var element = $(this).data('zoomelement');
        if (element) {
            //console.log(element);
            var w = element.attr('w');
            var s = element.attr('s');
            var e = element.attr('e');
            var n = element.attr('n');
            var x = element.attr('lng');
            var y = element.attr('lat');
            var type = element.attr('type');
            var wkt  = $(this).data('wkt');
            switchToMap(function () {
                // zoom the map into the stated bbox
                var bounds = L.latLngBounds( L.latLng(s,w) , L.latLng(n,e) );
                bounds = bounds.pad(0.15);
                MAP.fitBounds(bounds);

                // lay down a marker if this is a point feature
                if (type == 'poi' || type == 'loop') placeTargetMarker(y,x);

                // draw the line geometry onto the map, if this is a point feature
                if (wkt) {
                    if (HIGHLIGHT_LINE) { MAP.removeLayer(HIGHLIGHT_LINE); HIGHLIGHT_LINE = null; }
                    HIGHLIGHT_LINE = lineWKTtoFeature(wkt, HIGHLIGHT_LINE_STYLE);
                    MAP.addLayer(HIGHLIGHT_LINE);
                }
            });
        }
    };
    $('#show_on_map').tap(showOnMap);
});



///// on page load
///// event handlers for the basemap picker on the Settings page
$(window).load(function () {
    $('input[type="radio"][name="basemap"]').change(function () {
        var which = $(this).val();
        selectBasemap(which);
    });
});



///// the directions button does an async geocode on the address,
///// then an async directions lookup between the points,
///// then draws the polyline path and prints the directions

$(window).load(function () {
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

// this wrapper checks the directions_type field and other Get Directions fields,
// decides what to use for the address field and the other params,
// then calls either getDirections() et al
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
                $.get('../ajax/geocode', params, function (result) {
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
            params.lat     = MOBILE ? LAST_KNOWN_LOCATION.lat : MAP.getCenter().lat;
            params.lng     = MOBILE ? LAST_KNOWN_LOCATION.lng : MAP.getCenter().lng;
            params.via     = via;

            $.get('../ajax/keyword', params, function (reply) {
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
    if (source_type == 'poi' || source_type == 'reservation' || source_type == 'building' || source_type == 'trail') {
        var params = {};
        params.type = source_type;
        params.gid  = source_gid;
        params.lat  = targetlat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = targetlng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get('../ajax/geocode_for_directions', params, function (reply) {
            sourcelat = reply.lat;
            sourcelng = reply.lng;

            // save them into the input fields too, so they'd get shared
            $('#directions_source_lat').val(reply.lat);
            $('#directions_source_lng').val(reply.lng);
        }, 'json');
    }

    var target_gid  = $('#directions_target_gid').val();
    var target_type = $('#directions_target_type').val();
    if (target_type == 'poi' || target_type == 'reservation' || target_type == 'building' || target_type == 'trail') {
        var params = {};
        params.type = target_type;
        params.gid  = target_gid;
        params.lat  = sourcelat; // if this data source uses weighting, this will pick the closest one to our starting location
        params.lng  = sourcelng; // if this data source uses weighting, this will pick the closest one to our starting location
        params.via  = via;
        $.get('../ajax/geocode_for_directions', params, function (reply) {
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

function populateDidYouMean(results) {
    var target = $('#directions_steps');
    target.empty();

    // item 0 is not a result, but the words "Did you mean..."
    var item = $('<li></li>').append( $('<span></span>').addClass('ui-li-heading').text("Did you mean one of these?") );
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
        if (MOBILE) item.tap(tapToFill);
        else        item.click(tapToFill);

        item.css({ cursor:'pointer' }); // more for Desktop

        target.append(item);
    }

    // now if we're mobile, do the styling
    if (MOBILE) target.listview('refresh');
}


// part of the Get Directions system: given lat,lng and lat,lng and route params, request directions from the server
// then render them to the screen and to the map
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
    //console.log(params);
    $.get('../ajax/directions', params, function (reply) {
        enableDirectionsButton();

        if (! reply || ! reply.wkt) {
            var message = "Could not find directions.";
            if (via != 'hike') message += "\nTry a different type of trail, terrain, or difficulty.";
            return alert(message);
        }
        renderDirectionsStructure(reply);
    }, 'json');
}

function disableDirectionsButton() {
    var button = $('#directions_button');
    if (MOBILE) {
        button.button('disable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
    }
    else {
        button.prop('disabled',true);
        button.val( button.attr('value0') );
    }
}

function enableDirectionsButton() {
    var button = $('#directions_button');
    if (MOBILE) {
        button.button('enable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
    }
    else {
        button.prop('disabled',false);
        button.val( button.attr('value1') );
    }
}

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
    if (! MOBILE || $.mobile.activePage.prop('id') == 'page-map') {
        var bbox = DIRECTIONS_LINE.extent.pad(0.15);
        MAP.fitBounds(bbox);
    }

    // phase 2: put the directions into the panel
    if (! target) target = $('#directions_steps');
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

    var funcs = $('<li></li>').addClass('directions_functions');
    if (directions.elevationprofile) {
        var profile = $('<img></img>').prop('title','Elevation Profile').prop('id','elevationprofile_button').addClass('fakelink').prop('src','/static/common/elevprofile.png');
        profile.attr('value1', 'Elevation Profile').attr('value0', 'Loading');
        profile.tap(function () {
            openElevationProfileBySegments();
        });
        funcs.append(profile);
    }
    if (MOBILE) {
        funcs.append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
        var showonmap = $('<img></img>').prop('title','Map').addClass('fakelink').prop('src','/static/common/map.png');
        showonmap.tap(function () {
            switchToMap(function () {
                if (DIRECTIONS_LINE) MAP.fitBounds(DIRECTIONS_LINE.extent);
            });
        });
        funcs.append(showonmap);
        var clearmap = $('<img></img>').prop('title','Clear').addClass('fakelink').prop('src','/static/common/smallclear.png');
        clearmap.tap(function () {
            $('#directions_steps').empty();
            clearDirectionsLine();
        });
        funcs.append(clearmap);
    }
    if (! options.noshare) {
        // if there are options given, check for noshare:true and skip on the Share link
        var shareroute = $('<img></img>').prop('title','Share').addClass('fakelink').prop('id','share_route_button').prop('src','/static/common/share.png');
        shareroute.click(function () {
            updateShareUrlByDirections();
            if (MOBILE) {
                $.mobile.changePage('#page-share');
            } else {
                $('.dialog').dialog('close');
                $('#share').dialog('open');
            }
        });
        funcs.append(shareroute);
    }
    if (! MOBILE) {
        var printme = $('<img></img>').attr('title','Print').addClass('fakelink').prop('src','/static/common/print.png');
        printme.click(function () {
            $('#button_print').click();
        });
        funcs.append(printme);
    }
    target.append(funcs);

    // phase 3: save the elevation profile given, if any, so it can be recalled later
    ELEVATION_PROFILE = [];
    if (directions.elevationprofile) {
        ELEVATION_PROFILE = directions.elevationprofile;
    }

    // phase 4: any additional postprocessing
    // give the list that jQuery Mobile magic
    if (MOBILE) {
        target.listview('refresh');
        $('.directions_functions img:first').removeClass('ui-li-thumb'); // jQM assigns this class, screwing up the position & size of the first button IMG
    }
}

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

    $.post('../ajax/elevationprofilebysegments', { 'x':x, 'y':y }, function (url) {
        if (url.indexOf('http') != 0) return alert(url);
        showElevation(url);
    });
}



function disableKeywordButton() {
    var button = $('#search_keyword_button');
    if (MOBILE) {
        button.button('disable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
    }
    else {
        button.prop('disabled',true);
        button.val( button.attr('value0') );
    }
}

function enableKeywordButton() {
    var button = $('#search_keyword_button');
    if (MOBILE) {
        button.button('enable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
    }
    else {
        button.prop('disabled',false);
        button.val( button.attr('value1') );
    }
}





///// functions and supporting code regarding printing
// printMap() is in common.js; it loads the various form values and POSTs them to MapFish, and receives back an URL.
// It then passes the URL to printMapDone(url) which is defined in desktop.js and mobile.js separately
function printMapPrepare() {
    $('#print_waiting').show();
    $('#print_ready').hide();
}
function printMapDone(url) {
    $('#print_waiting').hide();

    if (url) {
        $('#print_link').prop('href', url);
        $('#print_ready').show();
    }
}
function printMap() {
    // their printing options
    var comment    = $('#print_comment').val();
    var paper      = $('#print_paper').val();
    var page2title  = ""; // the title for Page 2, if any
    var page2text1  = ""; // the text content for Page 2, if any, column 1 (left-hand)
    var page2text2  = ""; // the text content for Page 2, if any, column 2 (right-hand)

    // compose the bounding box of the print
    // we can't just use the map's bbox since the monitor and the "paper" aren't the same size,
    // so the resulting maps are completely dissimilar
    // strategy:
    // - fetch the map size for their chosen layout ("paper") so we know the target width & height
    // - create a bounding box from the map's center, plus and minus half the width & height
    // - reproject to EPSG:3734 so the output looks good
    var mapwidth  = PRINT_SIZES[paper][0];
    var mapheight = PRINT_SIZES[paper][1];
    var pixelcenter = MAP.latLngToLayerPoint(MAP.getCenter());
    var sw = wgsToLocalSRS( MAP.layerPointToLatLng( new L.Point(pixelcenter.x - (mapwidth/2), pixelcenter.y + (mapheight/2) ) ) );
    var ne = wgsToLocalSRS( MAP.layerPointToLatLng( new L.Point(pixelcenter.x + (mapwidth/2), pixelcenter.y - (mapheight/2) ) ) );
    var projbbox = [ sw[0], sw[1], ne[0], ne[1] ];

    // the layers to include into the map: WMS, vectors for markers
    // we effectively emulate the OpenLayers-centric structure for each Layer
    /*
    {"baseURL":"http://labs.metacarta.com/wms/vmap0","opacity":1,"singleTile":false,"type":"WMS","layers":["basic"],"format":"image/jpeg","styles":[""],"customParams":{}},
    {"type":"Vector",
        "styles":{
            "1":{"externalGraphic":"http://openlayers.org/dev/img/marker-blue.png","strokeColor":"red","fillColor":"red","fillOpacity":0.7,"strokeWidth":2,"pointRadius":12}
        },
        "styleProperty":"_gx_style",
        "geoJson":{"type":"FeatureCollection",
        "features":[
            {"type":"Feature","id":"OpenLayers.Feature.Vector_52","properties":{"_gx_style":1},"geometry":{"type":"Polygon","coordinates":[[[15,47],[16,48],[14,49],[15,47]]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_61","properties":{"_gx_style":1},"geometry":{"type":"LineString","coordinates":[[15,48],[16,47],[17,46]]}},
            {"type":"Feature","id":"OpenLayers.Feature.Vector_64","properties":{"_gx_style":1},"geometry":{"type":"Point","coordinates":[16,46]}}]}
        ],
        "name":"vector","opacity":1}
    }
    */
    var wmsparams = {
        format_options : "dpi:300"
    };
    var layers = [];
    if ( MAP.hasLayer(PHOTOBASE) ) {
        if ( MAP.getZoom() < 14 ) return alert("Before printing, zoom in closer.");

        // the photo base layer is a GeoServer cascade to a State of Ohio WMS service, but the Ohio WMS doesn't support large requests for printing
        // swap in the URL of a proxy service which fixes that
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/proxy/ohioimagery", opacity:1, singleTile:false, type:"WMS", layers:["0"], format:"image/png", styles:[""]  };
    }
    if ( MAP.hasLayer(MAPBASE) ) {
        // the basemap is a tile service from TileStache, but printing can't do tile services
        // so we use the GeoServer WMS version, which does lack a bit in the image quality but does get the job done
        layers[layers.length] = { baseURL:"http://maps.clevelandmetroparks.com/gwms", opacity:1, singleTile:true, type:"WMS", layers:["group_basemap"], format:"image/jpeg", styles:[""], customParams:wmsparams };
    }
    if (DIRECTIONS_LINE && MAP.hasLayer(DIRECTIONS_LINE) ) {
        // Construct a list-of-lists multilinestring. Remember that OpenLayers and MFP do lng,lat instead of lat,lng
            // use non-API methods to iterate over the line components, collecting them into "vertices" to form a list of lists
        var vertices = [];
        for (var li in DIRECTIONS_LINE._layers) {
            var subline = DIRECTIONS_LINE._layers[li];
            var subverts = [];
            for (var i=0, l=subline._latlngs.length; i<l; i++) {
                subverts[subverts.length] = wgsToLocalSRS([ subline._latlngs[i].lng, subline._latlngs[i].lat ]);
            }
            vertices[vertices.length] = subverts;
        }

        // the styling is simply pulled from the styling constant
        var opacity = DIRECTIONS_LINE_STYLE.opacity;
        var color   = DIRECTIONS_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Directions Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // now the Start marker, which will always be present if there's a line
        var iconurl  = ICON_FROM.options.iconUrl;
        var projdot  = wgsToLocalSRS(MARKER_FROM.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and the End marker, which will always be present if there's a line; copied from the Start marker above
        var iconurl  = ICON_TO.options.iconUrl
        var projdot  = wgsToLocalSRS(MARKER_TO.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error
        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };

        // and as an afterthought, the text directions: try the Directions first, then see if there are Measure directions
        paper += " with directions";
        var tofrom1   = $('#directions_reverse').val()
        var tofrom2   = tofrom1 == 'to' ? 'from' : 'to';
        var placename = $('#directions_target_title').text();
        var addrname  = $('#directions_address').val();
        var via       = $('#directions_via option:selected').text().toLowerCase();
        var steps;
        if (tofrom1 && tofrom2 && placename && addrname) {
            page2title = "Directions\n" + tofrom1 + " " + placename + "\n" + tofrom2 + " " + addrname + "\n" + via;
            steps = $('#directions_steps li');
        } else {
            page2title = "Measurement directions";
            steps = $('#measure_steps li');
        }

        // process the directions steps into a plain text output
        // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
        var maxstepsperpage = 25;
        switch (paper) {
            case 'Letter portrait with directions':
                maxstepsperpage = 40;
                break;
            case 'Letter landscape with directions':
                maxstepsperpage = 31;
                break;
            case 'Ledger portrait with directions':
                maxstepsperpage = 65;
                break;
            case 'Ledger landscape with directions':
                maxstepsperpage = 45;
                break;
        }
        page2text1 = [];
        page2text2 = [];

        steps.each(function () {
            var steptext = $(this).find('.ui-li-heading').eq(0).text();
            var timedist = $(this).find('.ui-li-desc').eq(0).text();
            var linetext = steptext + "\n" + "     " + timedist;
            if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
            else                                     page2text2[page2text2.length] = linetext;
        });
        page2text1 = page2text1.join("\n");
        page2text2 = page2text2.join("\n");
    }
    if (HIGHLIGHT_LINE && MAP.hasLayer(HIGHLIGHT_LINE) ) {
        // the highlighting line, which we know to be a multilinestring
        // Remember that OpenLayers and MFP do lng,lat instead of lat,lng
        var vertices = [];
        var lines = HIGHLIGHT_LINE.getLatLngs();
        for (var li=0, ll=lines.length; li<ll; li++) {
            var thisline = [];
            for (vi=0, vl=lines[li].length; vi<vl; vi++) {
                thisline[thisline.length] = wgsToLocalSRS([ lines[li][vi].lng , lines[li][vi].lat ]);
            }
            vertices[vertices.length] = thisline;
        }

        // the styling is simply pulled from the styling constant
        var opacity = HIGHLIGHT_LINE_STYLE.opacity;
        var color   = HIGHLIGHT_LINE_STYLE.color;
        var weight  = 3;

        layers[layers.length] = {
            type:"Vector", name:"Highlight Line", opacity:opacity,
            styles:{
                "default":{ strokeColor:color, strokeWidth:weight, strokeLinecap:"round" }
            },
            styleProperty:"style_index",
            geoJson:{
                type: "FeatureCollection",
                features:[
                    { type:"Feature", properties:{"style_index":"default"}, geometry:{ type:"MultiLineString", coordinates:vertices } }
                ]
            }
        };

        // if we're adding the HIGHLIGHT_LINE then perhaps this is a Loop we're showing
        // in which case add the directions text
        // the View On Map button, as usual, is our clearinghouse for the "last item of interest"
        var whats_showing = $('#show_on_map').data('zoomelement').attr('type');
        if (whats_showing == 'loop') {
            var steps = $('#moreinfo_steps li');
            paper += " with directions";
            page2title = $('#show_on_map').data('zoomelement').attr('title');

            // process the directions steps into a plain text output
            // first question: which paper layout, so how many directions fit onto a page, so how much do we pad the steps ot fit the page nicely?
            var maxstepsperpage = 25;
            switch (paper) {
                case 'Letter portrait with directions':
                    maxstepsperpage = 40;
                    break;
                case 'Letter landscape with directions':
                    maxstepsperpage = 31;
                    break;
                case 'Ledger portrait with directions':
                    maxstepsperpage = 65;
                    break;
                case 'Ledger landscape with directions':
                    maxstepsperpage = 45;
                    break;
            }
            page2text1 = [];
            page2text2 = [];

            steps.each(function () {
                var steptext = $(this).find('.ui-li-heading').eq(0).text();
                var timedist = $(this).find('.ui-li-desc').eq(0).text();
                var linetext = steptext + "\n" + "     " + timedist;
                if (page2text1.length < maxstepsperpage) page2text1[page2text1.length] = linetext;
                else                                     page2text2[page2text2.length] = linetext;
            });
            page2text1 = page2text1.join("\n");
            page2text2 = page2text2.join("\n");
        }
    }
    if (MARKER_TARGET && MAP.hasLayer(MARKER_TARGET) ) {
        var iconurl  = ICON_TARGET.options.iconUrl;
        var projdot  = wgsToLocalSRS(MARKER_TARGET.getLatLng());
        var iconxoff = -10; // offset to place the marker; MFP drifts it for some reason
        var iconyoff = 0; // offset to place the marker; MFP drifts it for some reason
        var iconsize = 15; // the scaling factor for the icon; like the xoff and yoff this is determined through trial and error

        // all of this is required: styleProperty and properties form the link to a style index, fillOpacity really works
        layers[layers.length] = {
            type:"Vector", name:"Target Marker", opacity:1.0,
            styleProperty: "style_index",
            styles:{
                "default":{ externalGraphic:iconurl, fillOpacity:1.0, pointRadius:iconsize, graphicXOffset: iconxoff, graphicYOffset: iconyoff }
            },
            geoJson:{
                type:"FeatureCollection",
                features:[
                    { type:"Feature", properties:{ style_index:"default" }, geometry:{ type:"Point", coordinates:projdot } }
                ]
            }
        };
    }

    // finally done composing layers!
    // compose the client spec for MapFish Print
    var params = {
        "units":"feet",
        "srs":"EPSG:3734",
        "layout":paper,
        "dpi":300,
        "layers":layers,
        "pages": [
            { bbox:projbbox, rotation:"0", comment:comment }
        ],
        "layersMerging" : true,
        page2title:page2title, page2text1:page2text1, page2text2:page2text2
    };

    printMapPrepare(); // hide the Ready, show a Waiting spinner

    $.ajax({
        url: PRINT_URL, type:'POST',
        data: JSON.stringify(params), processData:false, contentType: 'application/json',
        success: function (reply) {
            // the returned URL has internal references, e.g. http://localhost/
            var url = reply.getURL;
            url = url.split('/'); url = url[url.length-1];
            url = PRINT_PICKUP_BASEURL + url;
            printMapDone(url); // hide the spinner, display a link, etc.
        },
        error: function (xhr,status,text) {
            alert("Printing failed. Please try again.");
            printMapDone(); // hide the spinner, display a link, etc.
        }
    });
}


// reproject from WGS84 (Leaflet coordinates) to Web Mercator (primarily for printing)
// accepts a L.LatLng or a two-item array [lng,lat]    (note that array is X,Y)
// returns a two-item list:  [ x,y ]  in Web mercator coordinates
function wgsToLocalSRS(dot) {
    var srsin    = new Proj4js.Proj('EPSG:4326');
    var srsout   = new Proj4js.Proj('EPSG:3734');
    var newdot   = dot.lat ? new Proj4js.Point(dot.lng,dot.lat) : new Proj4js.Point(dot[0],dot[1]);
    Proj4js.transform(srsin,srsout,newdot);
    return  [ newdot.x, newdot.y ];
}



/////
///// functions pertaining to the Twitter panel
/////
function loadTwitter() {
    // empty the tweets target, and print a Loading statement
    var target = $('#tweets');
    target.empty();
    target.append( $('<tr></tr>').append( $('<td></td>').text('Loading...') ) );

    // fetch the tweets via AJAX
    var params = {};
    $.get('../ajax/fetch_tweets', params, function (tweets) {
        target.empty();
        for (var i=0, l=tweets.length; i<l; i++) {
            var tweet = tweets[i];
            var row = $('<tr></tr>');

            var cell1 = $('<td></td>').addClass('twitter_lhs');
            var userpic = $('<img></img>').prop('src', tweet.picture);
            var userlink = $('<a></a>').prop('target','_blank').text(tweet.username).prop('href','http://twitter.com/' + tweet.username);
            cell1.append(userpic);
            cell1.append( $('<br></br>') );
            cell1.append(userlink);

            var cell2 = $('<td></td>').addClass('twitter_rhs');
            var content = $('<span></span>').html(tweet.prettydate + ': ' + tweet.content);
            cell2.append(content);

            // append to the output
            row.append(cell1);
            row.append(cell2);
            target.append(row);
        }
    }, 'json');
}



/////
///// on page load: event handlers for Trail Finder
///// these used to be identical but then they diverged so desktop has these clicky icons, while mobile is still a selector (for now)
/////
$(window).load(function () {
    if (MOBILE) $('#page-trailfinder').page();

    // the icons for the trail type, trigger the underlying checkboxes so we're still using real form elements
    $('#trailfinder_typeicons img').tap(function () {
        // uncheck all of the invisible checkboxes, then check the one corresponding to this image
        var $this = $(this);
        var value = $this.attr('data-value');
        $('input[name="trailfinder_uses"]').removeAttr('checked').filter('[value="'+value+'"]').attr('checked','checked');

        // adjust the images: change the SRC to the _off version, except this one which gets the _on version
        $('#trailfinder_typeicons img').each(function () {
            var src = $(this).prop('src');

            if ( $(this).is($this) ) {
                src  = src.replace('_off.png', '_on.png');
            } else {
                src  = src.replace('_on.png', '_off.png');
            }
            $(this).prop('src', src);
        });

        // then click the GO button to submit the search for them
        $('#trailfinder_go').click();
    }).first().tap();

    $('#trailfinder_go').click(function () {
        // compile the params from the form for passing to searchTrails()
        // most notably the difficulty checkboxes, and making sure at least one is checked
        var params = {};
        params.reservation = $('select[name="trailfinder_reservation"]').val();
        params.paved       = $('select[name="trailfinder_paved"]').val();

        // this is a list of selected trail uses, now only 1 will be checked but it was made to accept a list and that will likely become the case again in the future
        params.uses = [];
        $('input[name="trailfinder_uses"]:checked').each(function () {
            params.uses[params.uses.length] = $(this).val();
        });
        params.uses = params.uses.join(",");

        // pass it to the search called
        searchTrails(params);
    });

    // when the selectors change, click the GO button so they don't have to
    $('select[name="trailfinder_reservation"]').change(function () { $('#trailfinder_go').click(); });
    $('select[name="trailfinder_paved"]').change(function () { $('#trailfinder_go').click(); });
});

function searchTrails(params) {
    // clear out any old search results
    var target = $('#trailfinder_results');
    target.empty();

    // disable the Search button
    var button = $('#trailfinder_go');
    if (MOBILE) {
        $('#page-trailfinder .sortpicker').hide();
        button.button('disable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
    }
    else {
        button.prop('disabled',true);
        button.val( button.attr('value0') );
    }

    // AJAX to fetch results, and render them as LIs with .zoom et cetera
    $.get('../ajax/search_trails', params, function (results) {
        // re-enable the Search button
        if (MOBILE) {
            $('#page-trailfinder .sortpicker').show();
            button.button('enable');
            button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
        }
        else {
            button.prop('disabled',false);
            button.val( button.attr('value1') );
        }

        // iterate over the results and add them to the output
        if (results.length) {
            for (var i=0, l=results.length; i<l; i++) {
                // initialize the result's LI entry; a whole lot of attributes to set pertaining to .zoom handling
                var result = results[i];
                var li = $('<li></li>').addClass('zoom');
                li.attr('title', result.name );
                li.attr('gid',result.gid).attr('type',result.type).attr('w',result.w).attr('s',result.s).attr('e',result.e).attr('n',result.n).attr('lat',result.lat).attr('lng',result.lng);
                li.attr('backbutton', '#page-trailfinder'); // used by Mobile only, but not harmful on Desktop

                // and the DIV with SPANs for styling substitles, etc.
                var div = $('<div></div>').addClass('ui-btn-text');
                div.append( $('<span></span>').addClass('ui-li-heading').text(result.name) );
                if (result.note) {
                    div.append( $('<span></span>').addClass('ui-li-desc').html(result.note) );
                }

                // if this is Mobile mode, add some distance placeholders
                if (MOBILE) {
                    div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text('0 mi') );
                }

               // the click handler is to call zoomElementClick(element), which will center the map, load More Info content, etc.
                li.click(function () {
                    zoomElementClick( $(this) );
                });

                // ready, add it to the list!
                li.append(div);
                target.append(li);
            }
        } else {
            target.append($('<li></li>').text("No results."));
        }

        // finalize the list, have jQuery Mobile do its styling magic on the newly-loaded content and then sort it
        if (MOBILE) target.listview('refresh');
        if (MOBILE) sortLists(target);
    }, 'json');
}




/////
///// pertaining to the Share box and RESTful params for loading map state
///// The basic workflow is:
///// - A map movement event triggers a call to udpateShareUrl(() et al,
///// - which compose the URL string and save it to SHARE_URL_STRING
///// - At a later time, when the user opens up the appropriate panel or sub-page as defined in mobile.js and desktop.js,
/////   an AJAX request is made to save the long URL and get a short URL in return
///// - This short URL is displayed in the #share_url panel for the end user.
///// We do not want to request a short URL with every single map movement; that would consume network resources unnecessarily.
/////

// read the globally stored SHARE_URL_STRING and request a shortened URL from the server
function populateShareBox() {
    // submit the long URL param string to the server, get back a short param string
    var params = {
        uri : URL_PARAMS.attr('path'),
        querystring : SHARE_URL_STRING
    };
    //console.log(params);
    $.get('../ajax/make_shorturl', params, function (shortstring) {
        if (! shortstring) return alert("Unable to fetch a short URL.\nPlease try again.");
        var url = URL_PARAMS.attr('protocol') + '://' + URL_PARAMS.attr('host') + '/url/' + shortstring;

        // mobile uses a div.fakeinput cuz iOS "copy" copies a whole lot more than your input field content (sigh)
        if (MOBILE) {
            $('#share_url').text(url);
        } else {
            $('#share_url').val(url);
        }
    });
}

// simple form: collect the X, Y, Z, basemap, etc.
function updateShareUrl() {
    // the basic params: center and zoom, basemap
    var params = {};
    params.z = MAP.getZoom();
    params.x = MAP.getCenter().lng;
    params.y = MAP.getCenter().lat;
    if (MAP.hasLayer(PHOTOBASE)) params.base = 'photo';
    if (MAP.hasLayer(MAPBASE))   params.base = 'map';

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
}

// element form: take an element compatible with zoomToElement() and create an URL which will load its info on page load
function updateShareUrlByFeature(element) {
    // only 2 params, taken from the element: its type and its name
    var params = {};
    params.type = element.attr('type');
    params.name = element.attr('title');

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
}

// directions form: processes the directions form and fills in the Share to recreate the route
function updateShareUrlByDirections() {
    // if the directions aren't filled in, we can't do this
    if (! $('#directions_source_lat').val() ) return;

    // compose the params to bring up this route at page load: route title, to and from coordinates, via type, etc
    var params = {};
    if (MAP.hasLayer(PHOTOBASE)) params.base = 'photo';
    if (MAP.hasLayer(MAPBASE))   params.base = 'map';
    params.routevia        = $('#directions_via').val();
    params.routevia_bike   = $('#directions_via_bike').val();
    params.routefrom       = $('#directions_source_lat').val() + ',' + $('#directions_source_lng').val();
    params.routeto         = $('#directions_target_lat').val() + ',' + $('#directions_target_lng').val();
    params.routetitle      = $('#directions_target_title').text();
    params.whichway        = $('#directions_reverse').val();
    params.loctype         = $('#directions_type').val();
    params.fromaddr        = $('#directions_address').val();
    if (params.routevia == 'trail') params.routevia = $('#directions_via_trail').val();

    // compile all of the params together and save it to the global. this is later read by populateShareBox()
    SHARE_URL_STRING = $.param(params);
}



/////
///// pertaining to the Welcome panel and whether it should be shown, as determined by a cookie
/////

$(window).load(function () {
    if (MOBILE) {
        $('#page-settings').page();
        $('#page-welcome').page();
    }

    // in the Settings panel, check or uncheck the Show Welcome box to match the cookie
    var show_welcome = cookieGet('show_welcome');
    if (show_welcome) {
        $('#settings_show_welcome').prop('checked','checked');
        if (MOBILE) $('#settings_show_welcome').checkboxradio('refresh');
        $('#show_welcome').prop('checked','checked');
        if (MOBILE) $('#show_welcome').checkboxradio('refresh');
    } else {
        $('#settings_show_welcome').removeAttr('checked');
        if (MOBILE) $('#settings_show_welcome').checkboxradio('refresh');
        $('#show_welcome').prop('checked','checked');
        if (MOBILE) $('#show_welcome').checkboxradio('refresh');
    }

    // enable the checkbox in the Welcome panel, to toggle the cookie that suppresses the Welcome panel
    $('#show_welcome').change(function () {
        toggleWelcome( $(this).is(':checked') );
    });
    $('#settings_show_welcome').change(function () {
        toggleWelcome( $(this).is(':checked') );
    });
});


// a wrapper to toggle the Welcome panel, and to adjust the numerous (okay, two) checkboxes that set it
// and which should update to reflect it
function toggleWelcome(show_welcome) {
    if (show_welcome) {
        cookieSet('show_welcome',1);
    } else {
        cookieDelete('show_welcome');
    }
}



///// on page load
///// event handler for the Share Map button, which reads from the Show On Map button to populate the Share Your Map box
$(window).load(function () {
    $('#share_feature').click(function () {
        var element = $('#show_on_map').data('zoomelement');
        if (! element) return;
        updateShareUrlByFeature(element);
        if (! MOBILE) $('#share').dialog('open');
    });
});
