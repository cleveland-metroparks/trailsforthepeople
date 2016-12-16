// used by the radar: sound an alert only if the list has in fact changed
var LAST_BEEP_IDS = [];

// used by Near You Now and then later by Radar, a structure of all POIs
// we cannot render them all into the Radar page at the same time, but we can store them in memory
var ALL_POIS = [];

// other stuff pertaining to our last known location and auto-centering
var MOBILE = true;
var LAST_KNOWN_LOCATION = L.latLng(41.3953,-81.6730);
var AUTO_CENTER_ON_LOCATION = false;

// sorting by distance, isn't always by distance
// what type of sorting do they prefer?
var DEFAULT_SORT = 'distance';

// mobile specific: when we change pages or rotate the screen, resize the map accordingly
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


// mobile-specific: listen for page changes and disable a second tap/click event for a moment
// this works around bugs that people who leave their fingers in place for several seconds,
// cause multiple touch events: pick a menu, accidentally click an option in that new page's menu, ...
$(document).bind('pagebeforechange', function(e,data) {
    disableClicksMomentarily();
});



/*
 * Handle clicks on various sidebar elements
 */
$(document).ready(function () {

    // To make links that open new sidebar panes,
    // give them the class ".sidebar-pane-link"
    // and make the href an anchor with the pane name, (#panename)
    $('.sidebar-pane-link').click(function() {
        link = $(this).attr('href');
        if (link.charAt(0) == '#') {
            pane = link.substr(1);
        }
        sidebar.open(pane);
    });

    /*
     * Trail-finder pane (#pane-trailfinder)
     */
    $('a.sidebar-pane-link[href="#pane-trailfinder"]').click(function() {
        // On opening the Trailfinder pane, trigger the search (list update).
        trailfinderUpdate();
        $('#pane-trailfinder .sortpicker').show();
    });

    /*
     * Find pane (#pane-browse)
     */
    $('#pane-browse li a').click(function() {

    });

    /*
     * Nearby pane (#pane-radar)
     */
    $('.sidebar-tabs li a[href="#pane-radar"]').click(function() {
        updateNearYouNow();
    });

    /*
     * Find POIs pane (#pane-browse-pois-activity)
     */
    // When POI Item clicked:
    $('#pane-browse-pois-activity li a').click(function() {
        var category = this.hash.replace( /.*category=/, "" );

        sidebar.open('pane-browse-results');
    
        var target = $('ul#browse_results');
        target.empty();
    
        // fix the Back button on the target panel, to go Back to the right page
        var backurl = "#pane-browse";
        if (category.indexOf('pois_usetype_') == 0) backurl = "#pane-browse-pois-activity";
        if (category.indexOf('pois_reservation_') == 0) backurl = "#pane-browse-pois-reservation";
        if (category.indexOf('loops_res_') == 0) backurl = "#pane-browse-loops-byres";

        $('#pane-browse-results .sidebar-back').prop('href', backurl);

        //// for the fetched items, if one follows to the Info panel, where should that Back button go?
        var backbuttonurl = backurl;
        if (category) backbuttonurl = "#pane-browse-results";

        // do the AJAX call: fetch the JSON data, render to UL.zoom in the #pane-browse-results page, switch over to it
        $.get('../ajax/browse_items', { category:category }, function (reply) {
            // fetch the title
            var header = $('#pane-browse-results h1.sidebar-header .title-text');
            header.text(reply.title);
    
            // iterate over the fetched results, render them into the target
            for (var i=0, l=reply.results.length; i<l; i++) {
                var result = reply.results[i];

                // List item
                // A lot of attributes to set pertaining to .zoom handling
                var li = $('<li></li>').addClass('zoom');
                li.attr('title', result.name );
                li.attr('gid',result.gid).attr('type',result.type).attr('w',result.w).attr('s',result.s).attr('e',result.e).attr('n',result.n).attr('lat',result.lat).attr('lng',result.lng);
                li.attr('backbutton', backbuttonurl);

                // Link (fake, currently)
                link = $('<a></a>');
                link.attr('class', 'ui-btn ui-btn-text');
                //link.attr('href', 'javascript:zoomElementClick(this)');
                li.append(link);

                // Click handler: center the map and load More Info
                li.click(function () {
                    zoomElementClick( $(this) );
                });

                // Title
                link.append(
                    $('<span></span>')
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
    
            // finalize the list, have jQuery Mobile do its styling magic on the newly-loaded content, then calculate the distances and sort
            target.listview('refresh');
            sortLists(target);
        }, 'json');

    });

    /*
     * Share pane (#pane-share)
     */
     // Build a new short URL for the current map state.
    $('.sidebar-tabs a[href="#pane-share"]').click(function() {
        populateShareBox();
    });
    // Use current URL for Twitter and Facebook share links
    $('#share_facebook').tap(function () {
        var url = $('#share_url').val() || $('#share_url').text();
            url = 'http://www.facebook.com/share.php?u=' + encodeURIComponent(url);
        $('#share_facebook').prop('href', url);
        return true;
    });
    $('#share_twitter').tap(function () {
        var url = $('#share_url').val() || $('#share_url').text();
            url = 'http://twitter.com/home?status=' + encodeURIComponent(url);
        $('#share_twitter').prop('href', url);
        return true;
    });
});


// @TODO: Bind this to sidebar tab button clicks AND
// clicks inside sidebar panes that generate/load new data
//
// mobile-specific: on any page change, after the changeover,
// update the distance readouts in any ul.dstance_sortable which was just now made visible
$(document).bind('pagechange', function(e,data) {
    //sortLists();
});


//// mobile-specific: listen for page changes to #pane-info
//// and make sure we really have something to show data for
//// e.g. in the case of someone reloading #pane-info the app
//// can get stuck since no feature has been loaded
//$(document).bind('pagebeforechange', function(e,data) {
//    if ( typeof data.toPage != "string" ) return; // no hash given
//    var url = $.mobile.path.parseUrl(data.toPage);
//    if ( url.hash != '#pane-info') return; // not the URL that we want to handle
//
//    var ok = $('#show_on_map').data('zoomelement');
//    if (ok) return; // guess it's fine, proceed
//
//    // got here: they selected info but have nothing to show info, bail to the Find panel
//    $.mobile.changePage('#pane-browse');
//    return false;
//});




// mobile-specific: when the map canvas gets swiped, turn off GPS mode
/*
$(window).load(function () {
    $('#map_canvas').bind('swipe', function () {
        toggleGPSOff();
    });
});
*/

// @TODO: Do we need to do this anymore?
//
// a method for changing over to the map "page" without having a hyperlink, e.g. from the geocoder callback
// this is particularly important because we often want to zoom the map, but since map resizing is async,
// the map is wrongly sized and badly positioned when we try to fitBounds() or setView(()
// Solution: use switchToMap() and give it a callback function. This callback will be executed after a
// short delay, ensuring that the map is showing and properly resized before doing the next activity
function disableClicksMomentarily() {
    disableClicks();
    setTimeout(enableClicks, 1500);
}
function disableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = false;
    MAP.dragging.removeHooks();
    MAP.touchZoom.removeHooks();
}
function enableClicks() {
    if (! MAP) return; // map isn't even running yet, so clicking is irrelevant
    ENABLE_MAPCLICK = true;
    MAP.dragging.addHooks();
    MAP.touchZoom.addHooks();
}
function switchToMap(callback) {
    // go ahead and switch over now, with whatever their callback to do after the map is focused
    $.mobile.changePage('#pane-map');
    if (callback) setTimeout(callback,1000);
}



// on page load: load the MAP, then add a geolocation callback to center the map
$(window).load(function () {
    // load up the URL params before the map, as we may need them to configure the map
    URL_PARAMS = $.url();

    // override the min zoom for Mobile, then start the map
    MIN_ZOOM = 10;
    initMap();

    // @TODO: Get Welcome panel working
    //
    // switch to the Welcome panel if they asked for it AND some other setting doesn't disable it
    var show_welcome = cookieGet('show_welcome');
    if (URL_PARAMS.attr('query')) show_welcome = false;
    if (URL_PARAMS.attr('fragment')) show_welcome = false;
    if (show_welcome) {
        $.mobile.changePage('#pane-welcome');
    }

    // event handler for a geolocation update: update our last-known location, then do more calculations regarding it
    MAP.on('locationfound', function(event) {
        // update our last known location
        LAST_KNOWN_LOCATION = event.latlng;

        // mark our current location, and center the map
        placeGPSMarker(event.latlng.lat,event.latlng.lng)
        if (AUTO_CENTER_ON_LOCATION) {
            var iswithin = MAX_BOUNDS.contains(event.latlng);
            if (iswithin) {
                MAP.panTo(event.latlng);
                if (MAP.getZoom() < 12) MAP.setZoom(16);
            } else {
                //MAP.fitBounds(MAX_BOUNDS);
                MAPGL.fitBounds(MAX_BOUNDS_GL);
            }
        }

        // @TODO: Let's identify all such lists and see if there's a cleaner way.
        //
        // sort any visible distance-sorted lists
        //sortLists();

        // @TODO: Why do we do this again when opening the panel?
        // @TODO: Also, should this be mobile only?
        //
        // adjust the Near You Now listing
        updateNearYouNow();

        // check the Radar alerts to see if anything relevant is within range
        if ( $('#radar_enabled').is(':checked') ) {
            var meters = $('#radar_radius').val();
            var categories = [];
            $('input[name="radar_category"]:checked').each(function () { categories[categories.length] = $(this).val() });
            placeCircle(event.latlng.lat,event.latlng.lng,meters);
            checkRadar(event.latlng,meters,categories);
        }

        // @TODO: Is this working?
        // update the GPS coordinates readout in the Settings panel
        var lat = event.latlng.lat;
        var lng = event.latlng.lng;
        var ns = lat < 0 ? 'S' : 'N';
        var ew = lng < 0 ? 'W' : 'E';
        var latdeg = Math.abs(parseInt(lat));
        var lngdeg = Math.abs(parseInt(lng));
        var latmin = ( 60 * (Math.abs(lat) - Math.abs(parseInt(lat))) ).toFixed(3);
        var lngmin = ( 60 * (Math.abs(lng) - Math.abs(parseInt(lng))) ).toFixed(3);
        var text = ns + ' ' + latdeg + ' ' + latmin + ' ' + ew + ' ' + lngdeg + ' ' + lngmin;
        $('#gps_location').text(text);
    });

    // this is a one-time location trigger: we need to turn on auto-centering when the page first loads so the map centers,
    // but we want to disable it again so we don't get annoying by moving the map away from the user's pans and searches.
    // Thus, a self-disabling callback.
    // BUT... we only do this whole thing if there were no URL params given which would override it
    if (! URL_PARAMS.attr('query')) {
        AUTO_CENTER_ON_LOCATION = true;
        var disableMe = function(event) {
            AUTO_CENTER_ON_LOCATION = false;
            MAP.off('locationfound', disableMe);
        };
        MAP.on('locationfound', disableMe);
    }

    // start constant geolocation, which triggers all of the 'locationfound' events above
    MAP.locate({ watch: true, enableHighAccuracy: true });

    // debug: to simulate geolocation: when the map is clicked, trigger a location event as if our GPS says we're there
    /*
    MAP.on('click', function (event) {
        MAP.fireEvent('locationfound', { latlng:event.latlng });
    });
    */
});



///// on page load: enable the sortpicker buttons to modify DEFAULT_SORT
///// which in turn affects the behavior of sortLists()
$(window).load(function () {
    $('div.sortpicker span').tap(function () {
        DEFAULT_SORT = $(this).attr('value');
        sortLists();
    });
});



///// on page load: enable some event handlers for the Keyword Search subsystem
$(window).load(function () {
    // the Keyword Search text search in the Browse panel, is just a shell over the one in #search
    $('#browse_keyword_button').tap(function () {
        // change over to the Search page
        $.mobile.changePage('#pane-search');

        // fill in the Search keyword and click the button to do the search (if any)
        // it's up to #search_keyword to detect it being blank
        $('#search_keyword').val( $('#browse_keyword').val() );
        $('#search_keyword_button').tap();
    });
    $('#browse_keyword').keydown(function (key) {
        if(key.keyCode == 13) $('#browse_keyword_button').tap();
    });

    // Keyword Search: the keyword box and other filters
    $('#search_keyword_button').tap(function () {
        var keyword = $('#search_keyword').val();
        searchByKeyword(keyword);
    });
    $('#search_keyword').keydown(function (key) {
        if(key.keyCode == 13) $('#search_keyword_button').tap();
    });
});



///// on page load: load all POIs (use areas) into memory from AJAX, but do not render them into DOM yet
///// Rendering to DOM is done later by updateNearYouNow() to do only the closest few POIs, so we don't overload
$(window).load(function () {
    $.get('../ajax/load_pois', {}, function (pois) {
        for (var i=0, l=pois.length; i<l; i++) {
            ALL_POIS[ALL_POIS.length] = pois[i];
        }

        updateNearYouNow();
    }, 'json');
});


// update the Near You Now listing from ALL_POIS; called on a location update
// this is a significant exception to the sortLists() system, as we need to do the distance and sorting BEFORE rendering, an unusual case
function updateNearYouNow() {
    // render the Radar page, in case it hasn't happened yet
    //$('#pane-radar').page();

    var target = $('#alerts');

    // iterate over ALL_POIS and calculate their distance from our last known location
    // poi.meters   poi.miles   poi.feet   poi.range
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi       = ALL_POIS[i];
        var destpoint = L.latLng(poi.lat,poi.lng);
        poi.meters    = LAST_KNOWN_LOCATION.distanceTo(destpoint);
        poi.miles     = poi.meters / 1609.344;
        poi.feet      = poi.meters * 3.2808399;
        poi.range     = (poi.feet > 900) ? poi.miles.toFixed(1) + ' mi' : poi.feet.toFixed(0) + ' ft';
        poi.bearing   = LAST_KNOWN_LOCATION.bearingWordTo(destpoint);
    }

    // sort ALL_POIS by distance, then take the first (closest) few
    ALL_POIS.sort(function (p,q) {
        return p.meters - q.meters;
    });
    var render_pois = ALL_POIS.slice(0,25);

    // go over the rendering POIs, and render them to DOM
    target.empty();
    for (var i=0, l=render_pois.length; i<l; i++) {
        var poi = render_pois[i];

        var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
        li.attr('title', poi.title);
        li.attr('category', poi.categories);
        li.attr('type', 'poi').attr('gid', poi.gid);
        li.attr('w', poi.w).attr('s', poi.s).attr('e', poi.e).attr('n', poi.n);
        li.attr('lat', poi.lat).attr('lng', poi.lng);

        var div = $('<div></div>').addClass('ui-btn-text');
        div.append( $('<h2></h2>').text(poi.title) );
        div.append( $('<p></p>').text(poi.categories) );
        div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(poi.range + ' ' + poi.bearing) );

        // On click, call zoomElementClick() to load more info
        li.tap(function () {
            zoomElementClick( $(this) );
        });

        li.append(div);
        target.append(li);
    }

    // done loading POIs, refresh the styling magic
    target.listview('refresh');
}



function checkRadar(latlng,maxmeters,categories) {
    // 1: go over the Near You Now entries, find which ones are within distance and matching the filters
    maxmeters = parseFloat(maxmeters); // passed in as a .attr() string sometimes

    // iterate over ALL_POIS and calculate their distance, make sure they fit the category filters, add the distance and text, append them to alerts
    var alerts = [];
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi = ALL_POIS[i];
        var meters = latlng.distanceTo( L.latLng(poi.lat,poi.lng) );

        // filter: distance
        if (meters > maxmeters) continue;

        // filter: category
        if (categories) {
            var thesecategories = poi.categories.split("; ");
            var catmatch = false;
            for (var ti=0, tl=thesecategories.length; ti<tl; ti++) {
                for (var ci=0, cl=categories.length; ci<cl; ci++) {
                    if (categories[ci] == thesecategories[ti]) { catmatch = true; break; }
                }
            }
            if (! catmatch) continue;
        }

        // if we got here, it's a match for the filters; add it to the list
        var miles  = meters / 1609.344;
        var feet   = meters * 3.2808399;
        var range  = (feet > 900) ? miles.toFixed(1) + ' mi' : feet.toFixed(0) + ' ft';
        alerts[alerts.length] = { gid:poi.gid, title:poi.title, range:range };
    }

    // 2: go over the alerts, see if any of them are not in LAST_BEEP_IDS
    // if so, then we beep and make an alert
    var beep = false;
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        if (LAST_BEEP_IDS.indexOf(key) == -1 ) { beep = true; break; }
    }

    // 3: rewrite LAST_BEEP_IDS to be only the IDs in sight right now
    // this is done regardless of whether we in fact beep, so we can re-beep for the same feature if we leave and then re-enter its area
    LAST_BEEP_IDS = [];
    for (var i=0, l=alerts.length; i<l; i++) {
        var key = parseInt( alerts[i].gid );
        LAST_BEEP_IDS[LAST_BEEP_IDS.length] = key;
    }
    LAST_BEEP_IDS.sort();

    // 3: play the sound and compose an alert of what they just stumbled upon
    // the alert() is async otherwise it may block the beep from playing
    if (beep) {
        document.getElementById('alert_beep').play();
        var lines = [];
        for (var i=0, l=alerts.length; i<l; i++) {
            lines[lines.length] = alerts[i].title + ", " + alerts[i].range;
        }
        setTimeout(function () {
            alert( lines.join("\n") );
        }, 1000);
    }
}



// on page load: install event handlers for the Find and Radar panels
$(window).load(function () {
    $('#radar_enabled').change(function () {
        // toggle the radar config: category pickers, distance selector, etc.
        var enabled = $(this).is(':checked');
        enabled ? $('#radar_config').show() : $('#radar_config').hide();

        // if it's not checked, unfilter the results listing to show everything, and remove the circle
        if (! enabled) {
            $('#alerts li').slice(0,25).show();
            $('#alerts li').slice(25).hide();
            clearCircle();
        }
    });
});




// functions for toggling the photo, like a one-item gallery  :)
// this varies between mobile and desktop, but since they're named the same it forms a common interface
function showPhoto(url) {
    $('#photo').prop('src',url);
    $.mobile.changePage('#pane-photo');
}

function showElevation(url) {
    $('#elevation').prop('src',url);
    $.mobile.changePage('#pane-elevationprofile');
}



///// a common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
function searchByKeyword(keyword) {
    // surprise bypass
    // if the search word "looks like coordinates" then zoom the map there
    var latlng = strToLatLng(keyword);
    if (latlng) {
        MAP.setView(latlng,16);
        placeTargetMarker(latlng.lat,latlng.lng);
        return;
    }

    // guess we go ahead and do a text search
    var target = $('#keyword_results');
    target.empty();

    disableKeywordButton();
    $('#pane-search .sortpicker').hide();

    $.get('../ajax/keyword', { keyword:keyword, limit:100 }, function (reply) {
        enableKeywordButton();
        $('#pane-search .sortpicker').show();

        if (! reply.length) {
            // no matches, means we say so ... and that we pass on to an address search
            $('<li></li>').text('No Cleveland Metroparks results found. Trying an address search.').appendTo(target);
            zoomToAddress(keyword);
            return;
        }
        for (var i=0, l=reply.length; i<l; i++) {
            var result   = reply[i];

            var title    = $('<span></span>').addClass('ui-li-heading').text(result.name);
            var subtitle = $('<span></span>').addClass('ui-li-desc').text(result.description);
            var distance = $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text('0 mi');
            var div      = $('<div></div>').addClass('ui-btn-text').append(title).append(subtitle).append(distance);
            var li       = $('<li></li>').addClass('zoom').addClass('ui-li-has-count').append(div);
            li.attr('backbutton','#pane-browse');
            li.attr('w', result.w);
            li.attr('s', result.s);
            li.attr('e', result.e);
            li.attr('n', result.n);
            li.attr('lat', result.lat);
            li.attr('lng', result.lng);
            li.attr('type',result.type);
            li.attr('gid',result.gid);
            li.attr('title',result.name);
            target.append(li);

            // On click, call zoomElementClick() to load more info
            li.tap(function () {
                zoomElementClick( $(this) );
            });
        }

        // finally, have jQuery Mobile do its magic, then trigger distance calculation and sorting
        target.listview('refresh');
        sortLists(target);
    }, 'json');
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
        $.get('../ajax/moreinfo', params, function (reply) {
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



///// on page load
///// load the autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
$(window).load(function () {
    $.get('../ajax/autocomplete_keywords', {}, function (words) {

        $('#browse_keyword').autocomplete({
            target: $('#browse_keyword_autocomplete'),
            source: words,
            callback: function(e) {
                // find the value of the selected item, stick it into the text box, hide the autocomplete
                var $a = $(e.currentTarget);
                $('#browse_keyword').val($a.text());
                $("#browse_keyword").autocomplete('clear');
                // and click the button to perform the search
                $('#browse_keyword_button').click();
            },
            minLength: 3,
            matchFromStart: false
        });

        $('#search_keyword').autocomplete({
            target: $('#search_keyword_autocomplete'),
            source: words,
            callback: function(e) {
                // find the value of the selected item, stick it into the text box, hide the autocomplete
                var $a = $(e.currentTarget);
                $('#search_keyword').val($a.text());
                $("#search_keyword").autocomplete('clear');
                // and click the button to perform the search
                $('#search_keyword_button').click();
            },
            minLength: 3,
            matchFromStart: false
        });

    },'json');
});




///// on page load
///// event handlers for the directions subsystem
$(window).load(function () {
    // the 4 icons simply select that directions type option, then change over to the Get Directions panel
    $('#directions_hike').tap(function () {
        // set the directions type
        $('#directions_via').val('hike');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#pane-getdirections');
    });
    $('#directions_bike').tap(function () {
        // set the directions type
        $('#directions_via').val('bike');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#pane-getdirections');
    });
    $('#directions_bridle').tap(function () {
        // set the directions type
        $('#directions_via').val('bridle');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#pane-getdirections');
    });
    $('#directions_car').tap(function () {
        // set the directions type
        $('#directions_via').val('car');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#pane-getdirections');
    });
    $('#directions_bus').tap(function () {
        // set the directions type
        $('#directions_via').val('bus');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#pane-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#pane-getdirections');
    });

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
    $('#directions_button').tap(function () {
        $('#directions_steps').empty();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').tap();
    });

    // this button changes over to the Find subpage, so they can pick a destination
    $('#change_directions_target2').tap(function () {
        $.mobile.changePage('#pane-browse');

        // if they clicked this button, it means that they will be looking for a place,
        // with the specific purpose of getting Directions there
        // set this flag, which will cause zoomElementClick() to skip showing the info and skip to directions
        SKIP_TO_DIRECTIONS = true;
    });
});



///// on page load
///// afterthought: iOS and non-iOS get different icpons for the GPS button so it's important to trigger this now
///// so the right icon is chosen
$(window).load(function () {
    toggleGPSOff();
});




///// on page load
///// event handlers for the Loops listing and filtering
///// See also filterLoops() below
$(window).load(function () {
    // the event handlers below are for the sliders and textboxes within #pane-loops,
    // so trigger a DOM rendering of the page now so the elements exist
    $('#pane-loops-search').page();

    // the #loops_filter_type selector is invisible, and we have a set of icons to set its value when they're clicked
    $('#loops_typeicons img').tap(function () {
        // uncheck all of the invisible checkboxes, then check the one corresponding to this image
        var $this = $(this);
        var value = $this.attr('data-value');
        $('#loops_filter_type').val(value).trigger('change');

        // adjust the images: change the SRC to the _off version, except this one which gets the _on version
        $('#loops_typeicons img').each(function () {
            var src = $(this).prop('src');

            if ( $(this).is($this) ) {
                src  = src.replace('_off.png', '_on.png');
            } else {
                src  = src.replace('_on.png', '_off.png');
            }
            $(this).prop('src', src);
        });
    }).first().tap();

    // #loops_filter_distance_slider is invisible and we have a set of 4 images to form "presets" for this slider
    $('#loops_filter_distancepicker img').tap(function () {
        // set the min & max in the inputs
        var $this = $(this);
        var minmi = $this.attr('data-min');
        var maxmi = $this.attr('data-max');
        $('#loops_filter_distance_min').val(minmi);
        $('#loops_filter_distance_max').val(maxmi);

        // unhighlight these buttons and highlight this one, by swapping the IMG SRC
        $('#loops_filter_distancepicker img').each(function () {
            var src = $(this).prop('src');

            if ( $(this).is($this) ) {
                src  = src.replace('_off.png', '_on.png');
            } else {
                src  = src.replace('_on.png', '_off.png');
            }
            $(this).prop('src', src);
        });

        // ready, now trigger a search
        filterLoops();
    //}).first().tap();
    });

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();
    $('#loops_filter_duration_min').change();
    $('#loops_filter_duration_max').change();

    // the filter button, calls filterLoops()
    $('#loops_filter_button').tap(filterLoops);

    // the loop type selector doesn't filter immediately, 
    // but it does show/hide the time slider and the time estimates for each loop,
    // since the estimate of time is dependent on the travel mode
    $('#loops_filter_type').change(function () {
        var type = $(this).val();

        // show/hide the time filter slider
        /* May 2014 we never show this
        var timeslider = $('#loops_filter_duration');
        type ? timeslider.show() : timeslider.hide();
        */

        // show only .time_estimate entries matching this 'type'
        switch (type) {
            case 'hike':
                $('.time_estimate').hide();
                $('.time_hike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bridle':
                $('.time_estimate').hide();
                $('.time_bridle').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Novice':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Beginner':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Intermediate':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'bike_Advanced':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'mountainbike':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            case 'exercise':
                $('.time_estimate').hide();
                $('.time_hike').show();
                $('.time_estimate_prefix').hide();
                break;
            default:
                $('.time_estimate').show();
                $('.time_estimate_prefix').show();
                break;
        }

        // then trigger a search
        filterLoops();
    });
});

/**
 * Featured Routes list
 */
function filterLoops() {
    $('#loops_list li').show();

    var params = {};
    params.filter_type  = $('#loops_filter_type').val();
    params.filter_paved = $('#loops_filter_paved').val();
    params.minseconds   = 60 * parseInt( $('#loops_filter_duration_min').val() );
    params.maxseconds   = 60 * parseInt( $('#loops_filter_duration_max').val() );
    params.minfeet      = 5280 * parseInt( $('#loops_filter_distance_min').val() );
    params.maxfeet      = 5280 * parseInt( $('#loops_filter_distance_max').val() );
    params.reservation  = $('#loops_filter_reservation').val();

    var button = $('#loops_filter_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );

    $.get('../ajax/search_loops', params, function (results) {
        // re-enable the search button
        button.button('enable');
        button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );

        // find and empty the target UL
        var target = $('#loops_list');
        target.empty();

        // no results?
        if (! results || ! results.length) return alert("No matches found.");

        // iterate over the results, add them to the output
        for (var i=0, l=results.length; i<l; i++) {
            var result = results[i];

            var li = $('<li></li>')
                .addClass('zoom')
                .addClass('ui-li-has-count');

            li.attr('title', result.title)
                .attr('gid', result.gid)
                .attr('type','loop')
                .attr('w', result.w)
                .attr('s', result.s)
                .attr('e', result.e)
                .attr('n', result.n)
                .attr('lat', result.lat)
                .attr('lng', result.lng);

            li.attr('backbutton', '#pane-loops-search');

            // Link (fake, currently)
            link = $('<a></a>');
            link.attr('class', 'ui-btn ui-btn-text');
            //link.attr('href', 'javascript:zoomElementClick(this)');

            // Click handler: center the map and load More Info
            li.click(function () {
                zoomElementClick( $(this) );
            });
            li.append(link);

            // Title
            link.append(
                $('<h4></h4>')
                    .addClass('ui-li-heading')
                    .text(result.title)
            );
            // Inner text
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .html(result.distance + ' &nbsp;&nbsp; ' + result.duration)
            );
    
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

        // sort it by distance and have jQuery Mobile refresh it
        $('#pane-loops-search .sortpicker').show();
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}




// a unified interface to calculate distances of items in a list, then sort that list by distance
// this ended up being so common a design pattern, putting it here saves a lot of repeat
// look for the magic tag ul.distance_sortable and populate the .zoom_distance boxes within it, then sort the ul.distance_sortable
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

function is_ios() {
    return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
}
function toggleGPS() {
    AUTO_CENTER_ON_LOCATION ? toggleGPSOff() : toggleGPSOn();
}
function toggleGPSOn() {
    AUTO_CENTER_ON_LOCATION = true;
    var iconurl = is_ios() ? '/static/mobile/mapbutton_gps_ios_on.png' : '/static/mobile/mapbutton_gps_on.png';
    $('#mapbutton_gps img').prop('src',iconurl);
}
function toggleGPSOff() {
    AUTO_CENTER_ON_LOCATION = false;
    var iconurl = is_ios() ? '/static/mobile/mapbutton_gps_ios_off.png' : '/static/mobile/mapbutton_gps_off.png';
    $('#mapbutton_gps img').prop('src',iconurl);
}
