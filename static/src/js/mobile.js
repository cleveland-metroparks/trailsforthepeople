 /**
 * mobile.js
 *
 * JS for main app map.
 *
 * Cleveland Metroparks
 */

// used by the radar: sound an alert only if the list has in fact changed
var LAST_BEEP_IDS = [];

// other stuff pertaining to our last known location and auto-centering
var MOBILE = true;
var LAST_KNOWN_LOCATION = L.latLng(41.3953,-81.6730);
var AUTO_CENTER_ON_LOCATION = false;

// sorting by distance, isn't always by distance
// what type of sorting do they prefer?
var DEFAULT_SORT = 'distance';

/**
 * Refresh the map on resize or rotate.
 *
 * @TODO: Tear this down.
 */
$(window).bind('orientationchange pageshow resize', function() {
    // scrolling the window is supposed to remove the address bar,
    // but it rarely works, often lags out the page as it slowly hides half of the address bar,
    // and creates bugs when we want to operate a picklist that's longer than a page (the page scrolls, THEN gets tapped)
    //window.scroll(0, 1);

    var page    = $(":jqmData(role='page'):visible");
    var header  = $(":jqmData(role='header'):visible");
    //var footer  = $(":jqmData(role='footer'):visible");
    var content = $(":jqmData(role='c=ontent'):visible");
    var viewportHeight = $(window).height();
    //var contentHeight = viewportHeight - header.outerHeight() - footer.outerHeight();
    var contentHeight = viewportHeight - header.outerHeight();
    page.height(contentHeight + 1);
    $(":jqmData(role='content')").first().height(contentHeight);

    if ( $("#map_canvas").is(':visible') ) {
        $("#map_canvas").height(contentHeight);
        if (MAP) MAP.invalidateSize();
    }
});

/**
 * Disable clicks momentarily
 *
 * @TODO: Where do we still need this? Deprecate/remove...
 *
 * a method for changing over to the map "page" without having a hyperlink, e.g. from the geocoder callback
 * this is particularly important because we often want to zoom the map, but since map resizing is async,
 * the map is wrongly sized and badly positioned when we try to fitBounds() or setView(()
 * Solution: use switchToMap() and give it a callback function. This callback will be executed after a
 * short delay, ensuring that the map is showing and properly resized before doing the next activity
 */
function disableClicksMomentarily() {
    //disableClicks();
    //setTimeout(enableClicks, 1500);
}

/**
 * Disable clicks
 */
function disableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = false;
    MAP.dragging.removeHooks();
    MAP.touchZoom.removeHooks();
}

/**
 * Enable clicks
 */
function enableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = true;
    MAP.dragging.addHooks();
    MAP.touchZoom.addHooks();
}

/**
 * Switch to map, with callback
 */
function switchToMap(callback) {
    // If the user has a small screen, close the sidebar to see the map.
    // @TODO: Can we check, instead, whether the sidebar is taking up the full screen?
    if ($(window).width() < 800) {
        sidebar.close();
    }

    // We don't need much of a wait here, anymore. (If at all?)
    if (callback) setTimeout(callback, 100);
}

/**
 * Load the map, handling query strings
 */
$(window).load(function () {
    // load up the URL params before the map, as we may need them to configure the map
    URL_PARAMS = $.url();

    // Initialize the map
    initMap();

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
                // @TODO: This is app-specific. Re-work.
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

    // Set the appropriate basemap radio button in Settings
    var base = URL_PARAMS.param('base') || 'map';
    var photoButton = $('input[name="basemap"][value="photo"]');
    var mapButton = $('input[name="basemap"][value="map"]');
    switch (base) {
        case 'photo':
            photoButton.prop('checked', true).checkboxradio('refresh');
            mapButton.prop('checked', false).checkboxradio('refresh');
            break;
        case 'map':
        default:
            photoButton.prop('checked', false).checkboxradio('refresh');
            mapButton.prop('checked', true).checkboxradio('refresh');
            break;
    }

    // Allow others to act now
    $.event.trigger({
        type: 'mapReady',
    });
});

/**
 * Basemap picker (on Settings pane) change handler
 */
$(window).load(function () {
    $('input[type="radio"][name="basemap"]').change(function () {
        var which = $(this).val();
        changeBasemap(which);
    });
});

/*
 * Sort-by button click handler
 *
 * Use the sortpicker buttons to modify DEFAULT_SORT, then sortLists().
 */
$(window).load(function () {
    $('div.sortpicker span').click(function () {
        DEFAULT_SORT = $(this).attr('value');
        sortLists();
    });
});

/**
 * Show Photo
 *
 * functions for toggling the photo, like a one-item gallery  :)
 * this varies between mobile and desktop, but since they're named the same it forms a common interface
 */
function showPhoto(url) {
    $('#photo').prop('src',url);
    sidebar.open('pane-photo');
}

/**
 * Show Elevation
 */
function showElevation(url) {
    $('#elevation').prop('src',url);
    sidebar.open('pane-elevationprofile');
}

/**
 * Show Attraction Info
 *
 * Show attraction info in the sidebar pane.
 *
 * Starting to split up / improve upon zoomElementClick()
 * (Don't use a DOM element to pass info.)
 * We can generalize this for other types of POIs later.
 *
 * attraction.gid
 * attraction.title
 * attraction.lat
 * attraction.lng
 */
function showAttractionInfo(attraction) {
    // @TODO: Construct the #show_on_map button. We don't have an "element".
    //$('#show_on_map').data('zoomelement', element);

    // Set our directions element
    // @TODO: Do this differently.
    $('#directions_target_lat').val(attraction.lat);
    $('#directions_target_lng').val(attraction.lng);
    $('#directions_target_type').val(attraction.type);
    $('#directions_target_gid').val(attraction.gid);
    $('#directions_target_title').text(attraction.title);

    // Change to the Info pane
    sidebar.open('pane-info');

    // Set the sidebar pane's back button.
    var backurl = '#pane-browse';
    $('#pane-info .sidebar-back').prop('href', backurl);

    // Enable "Get Directions"
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

    // Purge any vector data from the Show On Map button;
    // the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null);

    $('#info-content').text("Loading...");

    // Get more info via AJAX
    if (attraction.gid) {
        var params = {};
        params.type = 'attraction';
        params.gid  = attraction.gid;

        $.get(APP_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            // grab and display the plain HTML
            $('#info-content').html(reply);
        },'html');
    }
}

/**
 * zoomElementClick
 * 
 * common interface: given a .zoom element with lon, lat, WSEN, type, gid,
 * fetch info about it and show it in a panel
 */
function zoomElementClick(element) {
    // are we ignoring clicks? if so, then never mind; if not, then proceed but ignore clicks for a moment
    // this attempts to work around slow fingers sending multiple touches,
    // and long listviews inexplicably scrolling the page and re-tapping
    if (! ENABLE_MAPCLICK) return;
    disableClicksMomentarily();

    var type = element.attr('type');
    var gid  = element.attr('gid');

    // assign this element to the Show On Map button, so it knows how to zoom to our location
    // and to the getdirections form so we can route to it
    // and so the pagechange event handler can see that we really do have a target
    $('#show_on_map').data('zoomelement', element );

    $('#directions_target_lat').val( element.attr('lat') );
    $('#directions_target_lng').val( element.attr('lng') );
    $('#directions_target_type').val( element.attr('type') );
    $('#directions_target_gid').val( element.attr('gid') );
    $('#directions_target_title').text( element.attr('title') );

    // Change to the Info pane
    sidebar.open('pane-info');

    // correct the Back button to go to the URL specified in the element, or else to the map
    var backurl = element.attr('backbutton');
    if (! backurl) backurl = '#pane-browse';
    $('#pane-info .sidebar-back').prop('href', backurl);

    // now that we have a location defined, enable the Get Directions
    $('#getdirections_disabled').hide();
    $('#getdirections_enabled').show();

    // purge any vector data from the Show On Map button; the moreinfo template will populate it if necessary
    $('#show_on_map').data('wkt', null );
    $('#info-content').text("Loading...");

    // if the feature has a type and a gid, then we can fetch info about it
    // do some AJAX, fill in the page with the returned content
    // otherwise, fill in the title we were given and leave it at that
    if (type && gid) {
        var params = {};
        params.type = type;
        params.gid  = gid;
        params.lat  = LAST_KNOWN_LOCATION.lat;
        params.lng  = LAST_KNOWN_LOCATION.lng;
        $.get(APP_BASEPATH + 'ajax/moreinfo', params, function (reply) {
            // grab and display the plain HTML
            $('#info-content').html(reply);

            // if there's a <wkt> element in the HTML, it's vector data to be handled by zoomElementHighlight()
            // store it into the data but remove it from the DOM to free up some memory
            var wktdiv = $('#info-content').find('div.wkt');
            if (wktdiv) {
                $('#show_on_map').data('wkt', wktdiv.text() );
                wktdiv.remove();
            }

            // all set, the info is loaded
            // there's a special case where they only got the info for the purpose of routing there
            // handle that by clcking the Directions By Car button
            if (SKIP_TO_DIRECTIONS) {
                $('#directions_car').click();
                SKIP_TO_DIRECTIONS = false;
            }
        },'html');
    } else {
        // fill in the title since we have little else,
        // then presume that the person wants to route there by clicking the Directions By Car button
        $('#info-content').html( $('<h1></h1>').text(element.attr('title')) );
        $('#directions_car').click();
    }
}

/**
 * Sort Lists
 * a unified interface to calculate distances of items in a list, then sort that list by distance
 * this ended up being so common a design pattern, putting it here saves a lot of repeat
 * look for the magic tag ul.distance_sortable and populate the .zoom_distance boxes within it, then sort the ul.distance_sortable
 */
function sortLists(target) {
    // if no target was specified, get the first (only) ul.distance_sortable on the currently visible page
    // if there isn't one there, bail
    if (! target) {
        target = $(".sidebar-pane.active ul.distance_sortable").eq(0);
        if (! target.length) {
            return;
        }
    }

    // okay, so we have our target UL, find all .zoom_distance tags under it,
    // and know that the grandparent of that span is a DIV element with lat and lng, cuz we follow that protocol when we lay down elements; see also zoomelement
    // calculate the distance and fill in the box with a human-friendly version
    // yes, even if we don't want to sort by distance, because this is the time when they switched to
    // this listing or received a location change event, so the best time to at least make sure the distances are accurate
    target.find('.zoom_distance').each(function () {
        var element   = $(this).parent().parent();
        var destpoint = L.latLng(element.attr('lat'),element.attr('lng'));
        var meters    = LAST_KNOWN_LOCATION.distanceTo(destpoint);
        var bearing   = LAST_KNOWN_LOCATION.bearingWordTo(destpoint);

        var miles    = meters / 1609.344;
        var feet     = meters * 3.2808399
        var distext  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        distext += ' ' + bearing;

        $(this).text(distext);
        element.data('meters',meters);
    });

    // finally, the sort!
    switch (DEFAULT_SORT) {
        case 'distance':
            target.children('li').sort(function (p,q) {
                return ( $(p).data('meters') > $(q).data('meters') ) ? 1 : -1;
            });
            break;
        case 'alphabetical':
            target.children('li').sort(function (p,q) {
                return ( $(p).attr('title') > $(q).attr('title') ) ? 1 : -1;
            });
            break;
    }
    // @TODO: re-set .ui-last-child on appropriate element
    // (because we're getting last-element styling on non-last elements)
}

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
 * [Geocode and] Zoom to Address
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

/**
 * Show on Map button handler
 */
$(window).load(function () {
    $('#show_on_map').click(showOnMap);
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
});

/**
 * WSEN to Bounds
 *
 * given a WSEN set of ordinates, construct a L.LatLngBounds
 */
function WSENtoBounds(west,south,east,north) {
    return L.latLngBounds([ [south,west] , [north,east] ]);
}
