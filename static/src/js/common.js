 /**
 * common.js
 *
 * JS for common app functionality.
 *
 * Cleveland Metroparks
 */

var MOBILE; // Our old desktop vs. mobile flag. @TODO: Deprecate.
var isMobile = /Mobi/.test(navigator.userAgent); // Simple mobile device detection.

var ICON_TARGET = L.icon({
    iconUrl: APP_BASEPATH + 'static/images/markers/marker-target.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ],
    popupAnchor: [ 0, -41 ]
});
var MARKER_TARGET = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_TARGET });

var ICON_GPS = L.icon({
    iconUrl: APP_BASEPATH + 'static/images/markers/marker-gps.png',
    iconSize: [ 25, 41 ],
    iconAnchor: [ 13, 41 ],
    popupAnchor: [ 0, -41 ]
});
var MARKER_GPS     = L.marker(L.latLng(0,0), { clickable:false, draggable:false, icon:ICON_GPS });

var ICON_FROM = L.icon({
    iconUrl: APP_BASEPATH + 'static/images/markers/measure1.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var ICON_TO = L.icon({
    iconUrl: APP_BASEPATH + 'static/images/markers/measure2.png',
    iconSize: [ 20, 34 ],
    iconAnchor: [ 10, 34 ]
});
var MARKER_FROM  = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_FROM });
var MARKER_TO    = L.marker(L.latLng(0,0), { clickable:true, draggable:true, icon:ICON_TO });

var INFO_POPUP_OPTIONS = {
    'className' : 'info-popup'
};
var INFO_POPUP = L.popup(INFO_POPUP_OPTIONS);

var CIRCLE         = new L.Circle(L.latLng(0,0), 1);

var ELEVATION_PROFILE     = null;

var HIGHLIGHT_LINE       = null;
var HIGHLIGHT_LINE_STYLE = { color:"#FF00FF", weight:3, opacity:0.75, clickable:false, smoothFactor:0.25 };

var URL_PARAMS = null; // this becomes a pURL object for fetching URL params

var ENABLE_MAPCLICK = true; // a flag indicating whether to allow click-query; on Mobile we disable it after switchToMap()

var SKIP_TO_DIRECTIONS = false; // should More Info skip straight to directions? usually not, but there is one button to make it so


/**
 * Extend Leaflet:
 * Add to LatLng the ability to calculate the bearing to another LatLng
 */
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

/**
 * Initialize the map
 *
 * The business. (And too much of it.)
 */
function initMap () {
    // URL param: the base map; defaults to map (vs satellite)
    var base = URL_PARAMS.param('base') || 'map';
    var basemap; // which L.TileLayer instance to use?
    switch (base) {
        case 'photo':
            basemap = LAYER_MAPBOX_SAT;
            break;
        case 'map':
        default:
            // Use raster tiles on mobile for now, until we sort out Leaflet-GL zooming and marker issues.
            if (isMobile) {
                basemap = LAYER_MAPBOX_MAP;
            } else {
                basemap = LAYER_MAPBOX_GL_MAP;
            }
            break;
    }

    // start the map, only the basemap for starters
    // do some detection of browser to find Android 4+ and override the animation settings, hoping to enable pinch-zoom without breaking the app entirely
    // this is specifically contraindicated by Leaflet's own feature detection
    var options = {
        attributionControl: false,
        zoomControl: false, // add manually, below
        dragging: true,
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
    new L.Control.Zoom({ position: 'bottomright' }).addTo(MAP);

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

    // URL params query string: "type" and "name"
    if (URL_PARAMS.param('type') && URL_PARAMS.param('name') ) {
        var params = {
            type: URL_PARAMS.param('type'),
            name: URL_PARAMS.param('name')
        };
        $.get(APP_BASEPATH + 'ajax/exactnamesearch', params, function (reply) {
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

    // URL params query string: "type" and "gid"
    if (URL_PARAMS.param('type') && URL_PARAMS.param('gid') ) {
        if (URL_PARAMS.param('type') == 'attraction') {
            var params = {
                gid: URL_PARAMS.param('gid')
            };
            $.get(APP_BASEPATH + 'ajax/get_attraction', params, function (reply) {
                if (!reply || ! reply.lat || ! reply.lng) {
                    return alert("Cound not find that feature.");
                }

                // @TODO: Eventually we'll have individual POI zoomlevels in DB
                placeTargetMarker(reply.lat, reply.lng);
                MAP.flyTo(L.latLng(reply.lat, reply.lng), DEFAULT_POI_ZOOM);

                // Show info in sidebar
                showAttractionInfo(reply);

            }, 'json');
        }
    }

    // URL params query string: "route"
    // Fill in the boxes and run it now
    if (URL_PARAMS.param('routefrom') && URL_PARAMS.param('routeto') && URL_PARAMS.param('routevia') ) {
        // split out the params
        var sourcelat = URL_PARAMS.param('routefrom').split(",")[0];
        var sourcelng = URL_PARAMS.param('routefrom').split(",")[1];
        var targetlat = URL_PARAMS.param('routeto').split(",")[0];
        var targetlng = URL_PARAMS.param('routeto').split(",")[1];
        var via       = URL_PARAMS.param('routevia');
        var tofrom    = 'to';

        // toggle the directions panel so it shows directions instead of Select A Destination
        sidebar.open('pane-getdirections');
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

    // Map initialized. Allow others to act now.
    $.event.trigger({
        type: 'mapReady',
    });
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

/**
 * Place "target" (normal) marker
 */
function placeTargetMarker(lat,lon) {
    MAP.addLayer(MARKER_TARGET);
    MARKER_TARGET.setLatLng(L.latLng(lat,lon));
}

/**
 * Clear "target" (normal) marker
 */
function clearTargetMarker() {
    MAP.removeLayer(MARKER_TARGET);
}

/**
 * Place GPS (geolocated) marker
 */
function placeGPSMarker(lat,lon) {
    MAP.addLayer(MARKER_GPS);
    MARKER_GPS.setLatLng(L.latLng(lat,lon));
}

/**
 * Clear GPS (geolocated) marker
 */
function clearGPSMarker() {
    MAP.removeLayer(MARKER_GPS);
}

/**
 * Show informational popup
 */
function showInfoPopup(message, type) {
    MAP.removeLayer(INFO_POPUP);
    switch (type) {
        case 'warning':
            classes = 'info-popup warning';
            break;
        case 'error':
            classes = 'info-popup error';
            break;
        default:
            classes = 'info-popup';
    }
    INFO_POPUP = L.popup({className : classes})
        .setLatLng(MAP.getCenter())
        .setContent(message)
        .openOn(MAP);
}

/**
 * Clear informational popup
 */
function clearInfoPopup() {
    MAP.removeLayer(INFO_POPUP);
    INFO_POPUP.options.className
}

/**
 * Place circle
 */
function placeCircle(lat,lon,meters) {
    MAP.removeLayer(CIRCLE);
    CIRCLE.setLatLng(L.latLng(lat,lon));
    CIRCLE.setRadius(meters);
    MAP.addLayer(CIRCLE);
}

/**
 * Clear circle
 */
function clearCircle() {
    CIRCLE.setLatLng(L.latLng(0,0));
    CIRCLE.setRadius(1);
    MAP.removeLayer(CIRCLE);
}

/**
 * String to Lat/Long
 *
 * Given a string, try to parse it as coordinates and return a L.LatLng instance.
 *
 * Currently supports these formats:
 *      N 44 35.342 W 123 15.669
 *      44.589033 -123.26115
 */
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

/**
 * Zoom to Address
 */
function zoomToAddress(searchtext) {
    if (!searchtext) return false;

    var params = {};
    params.address  = searchtext;
    params.bing_key = BING_API_KEY;
    params.bbox     = GEOCODE_BIAS_BOX;

    $.get(APP_BASEPATH + 'ajax/geocode', params, function (result) {
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

/**
 * WMS Get feature info by point
 */
function wmsGetFeatureInfoByPoint(pixel) {
    var pixelbuffer = 20;
    var sw = MAP.layerPointToLatLng(new L.Point(pixel.x - pixelbuffer , pixel.y + pixelbuffer));
    var ne = MAP.layerPointToLatLng(new L.Point(pixel.x + pixelbuffer , pixel.y - pixelbuffer));
    var bbox   = { w:sw.lng, s: sw.lat, e:ne.lng , n:ne.lat };
    var anchor = MAP.layerPointToLatLng(new L.Point(pixel.x,pixel.y));
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

/**
 * WMS Get feature info by lat/lng
 */
function wmsGetFeatureInfoByLatLng(latlng) {
    var bbox   = { w:latlng.lng, s: latlng.lat, e:latlng.lng , n:latlng.lat };
    var anchor = latlng;
    wmsGetFeatureInfoByLatLngBBOX(bbox,anchor);
}

/**
 * WMS Get feature info by lat/lng BBOX
 */
function wmsGetFeatureInfoByLatLngBBOX(bbox,anchor) {
    var data = bbox;
    data.zoom = MAP.getZoom();

    $.get(APP_BASEPATH + 'ajax/query', data, function (html) {
        if (!html) return;

        // set up the Popup and load its content
        // beware of very-lengthy content and force a max height on the bubble
        var options = {};
        options.maxHeight = parseInt( $('#map_canvas').height() );
        options.maxWidth = parseInt( $('#map_canvas').width() );
        var popup = new L.Popup(options);
        popup.setLatLng(anchor);
        popup.setContent(html);
        MAP.openPopup(popup);
    }, 'html');
}

/**
 * Map canvas resize handler
 *
 * When window is resized, trigger a map refresh.
 *
 * @TODO: Remove once satisfied we really don't need this.
 */
//$(window).resize(function () {
//    MAP.invalidateSize();
//});

/**
 * Geocoder event handlers
 */
$(window).load(function () {
    var thisCallback = function () {
        var address = $('#geocode_text').val();
        zoomToAddress(address);
    };
    $('#geocode_button').click(thisCallback);

    $('#geocode_text').keydown(function (key) {
        if(key.keyCode == 13) $('#geocode_button').click();
    });
});

/**
 * Zoom button handlers
 *
 * Click it to bring up info window, configure the Show On Map button.
 */
$(window).load(function () {

    // zoomElementClick() is defined by mobile.js and desktop.js
    // typically it goes to a Details page and sets up various event handlers
    var openDetailsPanel = function () {
        zoomElementClick( $(this) );
    };
    $('.zoom').click(openDetailsPanel);

    /**
     * Show on Map
     *
     * When Show On Map is clicked (in the details panel) it has associated data:
     * an element with w,s,e,n,lat,lng,type,gid etc. for fetching more info or adjusting the map to zoom
     */
    var showOnMap = function () {
        // zoom the map to the feature's bounds, and place a marker if appropriate
        var element = $(this).data('zoomelement');

        if (element) {
            var w = element.attr('w');
            var s = element.attr('s');
            var e = element.attr('e');
            var n = element.attr('n');

            var lng = element.attr('lng');
            var lat = element.attr('lat');

            var type = element.attr('type');
            var wkt  = $(this).data('wkt');

            // Switch to the map (which no longer amounts to much)
            // And add our feature.
            switchToMap(function () {
                // Zoom the map into the stated bbox, if we have one.
                if (w!=0 && s!=0 && e!=0 && n!=0) {
                    var bounds = L.latLngBounds( L.latLng(s,w) , L.latLng(n,e) );
                    bounds = bounds.pad(0.15);
                    MAP.fitBounds(bounds);
                } else {
                    // Re-center and zoom
                    // @TODO: Eventually we'll have individual POI zoomlevels in DB
                    MAP.flyTo(L.latLng(lat, lng), DEFAULT_POI_ZOOM);
                }

                // Lay down a marker if this is a point feature
                if (type == 'poi' || type == 'attraction' || type == 'loop') {
                    placeTargetMarker(lat, lng);
                }

                // Draw the line geometry onto the map, if this is a line feature.
                if (wkt) {
                    if (HIGHLIGHT_LINE) {
                        MAP.removeLayer(HIGHLIGHT_LINE);
                        HIGHLIGHT_LINE = null;
                    }
                    HIGHLIGHT_LINE = lineWKTtoFeature(wkt, HIGHLIGHT_LINE_STYLE);
                    MAP.addLayer(HIGHLIGHT_LINE);
                }
            });
        }
    };
    $('#show_on_map').click(showOnMap);
});

/**
 * Enable the given base map layer.
 *
 * @param layer_key: Must refer to the key of an available layer (in AVAILABLE_LAYERS constant).
 */
function changeBasemap(layer_key) {
    // Use raster tiles on mobile for now, until we sort out zooming and marker issues.
    if (layer_key == 'map') {
        if (!isMobile) {
            layer_key = 'vector';
        }
    }

    new_active_layer = AVAILABLE_LAYERS[layer_key];

    // Go through all layers, adding the intended one and removing others.
    for (i=0; i<ALL_LAYERS.length; i++) {
        if (ALL_LAYERS[i] == new_active_layer) {
            // Add the active layer
            if (! MAP.hasLayer(ALL_LAYERS[i])) {
                MAP.addLayer(ALL_LAYERS[i], true);
            }
            if (layer_key != 'vector') {
                // Mapbox GL+Leaflet layers don't implement bringToBack()
                new_active_layer.bringToBack();
            }
        } else {
            // Remove the inactive layer
            if (MAP.hasLayer(ALL_LAYERS[i])) {
                MAP.removeLayer(ALL_LAYERS[i]);
            }
        }
    }
}

/**
 * Disable keyword button
 */
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

/**
 * Enable keyword button
 */
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

/////
///// on page load: event handlers for Trail Finder
///// these used to be identical but then they diverged so desktop has these clicky icons, while mobile is still a selector (for now)
/////
$(window).load(function () {
    //if (MOBILE) $('#pane-trailfinder').page();

    // the icons for the trail type, trigger the underlying checkboxes so we're still using real form elements
    $('#trailfinder_typeicons img').click(function () {
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

        // Update the listing.
        trailfinderUpdate();

    //}).first().click();
    });

    // The "Search" button on the Trail Finder pane.
    // We've removed this button from the Trail Finder pane, but it's still on
    // views/finder/trail.phtml
    $('#trailfinder_go').click(function () {
        trailfinderUpdate();
    });

    // When the selectors change, trigger a list update
    $('select[name="trailfinder_reservation"]').change(function () {
        trailfinderUpdate();
    });
    $('select[name="trailfinder_paved"]').change(function () {
        trailfinderUpdate();
    });
});

/**
 * Trail Finder Search/Update
 *
 * Build Search params from the form, for passing to searchTrails() --
 * most notably the difficulty checkboxes, and making sure at least one is checked.
 */
function trailfinderUpdate() {
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
}

/**
 * "Search" functionality in Trail Finder
 */
function searchTrails(params) {
    // clear out any old search results
    var target = $('#trailfinder_results');
    target.empty();

    // AJAX to fetch results, and render them as LIs with .zoom et cetera
    $.get(APP_BASEPATH + 'ajax/search_trails', params, function (results) {

        // iterate over the results and add them to the output
        if (results.length) {
            for (var i=0, l=results.length; i<l; i++) {

                var result = results[i];

                // List item
                // A lot of attributes to set pertaining to .zoom handling
                var li = $('<li></li>').addClass('zoom');

                li.attr('title', result.name)
                  .attr('gid',result.gid)
                  .attr('type',result.type)
                  .attr('w',result.w)
                  .attr('s',result.s)
                  .attr('e',result.e)
                  .attr('n',result.n)
                  .attr('lat',result.lat)
                  .attr('lng',result.lng);

                li.attr('backbutton', '#pane-trailfinder');

                // Link (fake, currently)
                link = $('<a></a>');
                link.attr('class', 'ui-btn ui-btn-text');
                //link.attr('href', 'javascript:zoomElementClick($(this)');
                li.append(link);

                // On click, call zoomElementClick() to load more info
                li.click(function () {
                    zoomElementClick( $(this) );
                });

                // Title
                link.append(
                    $('<h4></h4>')
                        .addClass('ui-li-heading')
                        .text(result.name)
                );

                // Inner text
                if (result.note) {
                    link.append(
                        $('<span></span>')
                            .addClass('ui-li-desc')
                            .html(result.note)
                    );
                }
    
                // Distance placeholder, to be populated later
                link.append(
                    $('<span></span>')
                        .addClass('zoom_distance')
                        .addClass('ui-li-count')
                        .addClass('ui-btn-up-c')
                        .addClass('ui-btn-corner-all')
                        .text('0 mi')
                );

                // Add to the list
                li.append(link);
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
