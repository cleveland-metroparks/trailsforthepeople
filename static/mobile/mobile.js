// used by the radar: sound an alert only if the list has in fact changed
var LAST_BEEP_IDS = [];

// used by Near You Now and then later by Radar, a structure of all POIs
// we cannot render them all into the Radar page at the same time, but we can store them in memory
var ALL_POIS = [];

// other stuff pertaining to our last known location and auto-centering
var MOBILE = true;
var LAST_KNOWN_LOCATION = new L.LatLng(41.3953,-81.6730);
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
    var content = $(":jqmData(role='content'):visible");
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


// mobile-specific: listen for page changes to #page-browse-results and load the page content via AJAX
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var url = $.mobile.path.parseUrl(data.toPage);
    if ( url.hash.search(/^#browse-items/) == -1 ) return; // not a #browse-items URL that we want to handle
    var category = url.hash.replace( /.*category=/, "" ); // string, the category to query

    // tell the event system that we have it covered, no need for it to change our page
    e.preventDefault();

    // have jQuery Mobile render the target Page (if not already) so we have a destination
    $('#page-browse-results').page();

    // change us over to the browse-results page, but lie about the URL so a reload won't bring us to this blank page
    // the AJAX is (presumably) making some headway while we do this, so we cut the apparent response time
    data.options.dataUrl = url.href.replace(/#.+$/, '#browse-items?category=' + category);
    $.mobile.changePage('#page-browse-results', data.options );

    // initialize the list; again with visual eyecandy while the AJAX stuff starts
    var target = $('#browse_results');
    target.empty();

    // set the header to Loading to keep their eyes busy
    var header = $('#page-browse-results div[data-role="header"] h1');
    header.text('Loading...');

    // fix the Back button on the target panel, to go Back to the right page
    var backurl = "#page-browse";
    if (category.indexOf('pois_usetype_') == 0) backurl = "#page-browse-pois-activity";
    if (category.indexOf('pois_reservation_') == 0) backurl = "#page-browse-pois-reservation";
    if (category.indexOf('loops_res_') == 0) backurl = "#page-browse-loops-byres";

    var back = $('#page-browse-results  div[data-role="header"] a:eq(0)');
    back.prop('href', backurl);

    // for the fetched items, if one follows to the Info panel, where should that Back button go?
    var backbuttonurl = backurl;
    if (category) backbuttonurl = "#browse-items?category=" + category;

    // do the AJAX call: fetch the JSON data, render to UL.zoom in the #page-browse-results page, switch over to it
    $.get('../ajax/browse_items', { category:category }, function (reply) {
        // fetch the title
        header.text(reply.title);

        // iterate over the fetched results, render them into the target
        for (var i=0, l=reply.results.length; i<l; i++) {
            // initialize the result's LI entry; a whole lot of attributes to set pertaining to .zoom handling
            var result = reply.results[i];
            var li = $('<li></li>').addClass('zoom');
            li.attr('title', result.name );
            li.attr('gid',result.gid).attr('type',result.type).attr('w',result.w).attr('s',result.s).attr('e',result.e).attr('n',result.n).attr('lat',result.lat).attr('lng',result.lng);
            li.attr('backbutton', backbuttonurl);

            // and the DIV with SPANs for styling substitles, etc.
            var div = $('<div></div>').addClass('ui-btn-text');
            div.append( $('<span></span>').addClass('ui-li-heading').text(result.name) );
            if (result.note) {
                div.append( $('<span></span>').addClass('ui-li-desc').html(result.note) );
            }

            // add the placeholder for a distance readout, to be sorted later
            div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text('0 mi') );

            // the click handler is to call zoomElementClick(element), which will center the map, load More Info content, etc.
            li.tap(function () {
                zoomElementClick( $(this) );
            });

            // ready, add it to the list!
            li.append(div);
            target.append(li);
        }

        // finalize the list, have jQuery Mobile do its styling magic on the newly-loaded content, then calculate the distances and sort
        target.listview('refresh');
        sortLists(target);
    }, 'json');
});



// mobile-specific: listen for page changes to #page-twitter and reload tweets
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var url = $.mobile.path.parseUrl(data.toPage);
    if ( url.hash != '#page-twitter') return; // not the URL that we want to handle

    loadTwitter();
});



// mobile-specific: listen for page changes to #page-share and request a new short URL for the current map state
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var url = $.mobile.path.parseUrl(data.toPage);
    if ( url.hash != '#page-share') return; // not the URL that we want to handle

    populateShareBox();
});



/*
// mobile-specific: listen for page changes to #page-find and some others, and update the Find button to go to that page,
// so the Find button really goes back to wherever they were in the Find/Info subsystem
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var hash = $.mobile.path.parseUrl(data.toPage).hash;

    // figure out which page they were last using, or else default to Find
    // sadly this is manually maintained, so future changes to the Find and subpanels will mean updating this. Sigh.
    var url = null;
    if ( hash.indexOf('#page-find') == 0) url = hash;
    if ( hash.indexOf('#page-browse') == 0) url = hash;
    if ( hash.indexOf('#page-keyword') == 0) url = hash;
    if ( hash.indexOf('#page-search') == 0) url = hash;
    if ( hash.indexOf('#page-loops') == 0) url = hash;
    if ( hash.indexOf('#browse-items') == 0) url = hash;
    if ( hash.indexOf('#page-info') == 0) url = hash;

    // now go ahead and set the Find button's target, if we in fact found an alternate URL
    if (url) $('#button_find').prop('href',url);
});
*/



// mobile-specific: listen for page changes to #page-radar and update Near You Now content
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var url = $.mobile.path.parseUrl(data.toPage);
    if ( url.hash != '#page-radar') return; // not the URL that we want to handle

    updateNearYouNow();
});


// mobile-specific: listen for page changes to #page-info and make sure we really have something to show data for
// e.g. in the case of someone reloading #page-info the app can get stuck since no feature has been loaded
$(document).bind('pagebeforechange', function(e,data) {
    if ( typeof data.toPage != "string" ) return; // no hash given
    var url = $.mobile.path.parseUrl(data.toPage);
    if ( url.hash != '#page-info') return; // not the URL that we want to handle

    var ok = $('#show_on_map').data('zoomelement');
    if (ok) return; // guess it's fine, proceed

    // got here: they selected info but have nothing to show info, bail to the Find panel
    $.mobile.changePage('#page-browse');
    return false;
});


// mobile-specific: on any page change, after the changeover,
// update the distance readouts in any ul.dstance_sortable which was just now made visible
$(document).bind('pagechange', function(e,data) {
    sortLists();
});




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
    $.mobile.changePage('#page-map');
    if (callback) setTimeout(callback,1000);
}



// on page load: load the MAP, yank the splashscreen, then add a geolocation callback to center the map
$(window).load(function () {
    // load up the URL params before the map, as we may need them to configure the map
    URL_PARAMS = $.url();

    // override the min zoom for Mobile, then start the map
    MIN_ZOOM = 10;
    initMap();

    // remove the splash screen; we won't need it anymore so remove it entirely
    setTimeout(function () {
        $('#toolbar').show();
        $('#splashscreen').hide();
    }, 5000);

    // switch to the Welcome panel if they asked for it AND some other setting doesn't disable it
    var show_welcome = cookieGet('show_welcome');
    if (URL_PARAMS.attr('query')) show_welcome = false;
    if (URL_PARAMS.attr('fragment')) show_welcome = false;
    if (show_welcome) {
        $.mobile.changePage('#page-welcome');
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
                MAP.fitBounds(MAX_BOUNDS);
            }
        }

        // sort any visible distance-sorted lists
        sortLists();

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




///// on page load: the ENABLE_MAPCLICK hack applied to the bottom button bar
///// so that a too-long tap won't hit the Directions button a moment later
///// To see it: disable this function, search for a Loop which has lengthy content,
///// placing the Show On Map button in the same area of the screen as the button bar
///// after tapping it, the map will open but then the button under your finger will be clicked
$(window).load(function () {
    $('#toolbar a.button').click(function () {
        if (! ENABLE_MAPCLICK) return false;
    });
});



///// on page load: enable some event handlers for the Keyword Search subsystem
$(window).load(function () {
    // the Keyword Search text search in the Browse panel, is just a shell over the one in #search
    $('#browse_keyword_button').tap(function () {
        // change over to the Search page
        $.mobile.changePage('#page-search');

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



///// on page load: enable some event handlers for the LatLon page subsystem
$(window).load(function () {
    // the Load From GPS button loads the boxes from LAST_KNOWN_LOCATION
    function loadLastKnownCoordsToLatLonPage() {
        var latlng = LAST_KNOWN_LOCATION;
        var lat = latlng.lat;
        var lng = latlng.lng;
        var ns = lat < 0 ? 'S' : 'N';
        var ew = lng < 0 ? 'W' : 'E';
        var latdeg = Math.abs(parseInt(lat));
        var lngdeg = Math.abs(parseInt(lng));
        var latmin = ( 60 * (Math.abs(lat) - Math.abs(parseInt(lat))) ).toFixed(3);
        var lngmin = ( 60 * (Math.abs(lng) - Math.abs(parseInt(lng))) ).toFixed(3);

        $('#dd_lng').val(lng);
        $('#dd_lat').val(lat);
        $('#dm_lat_deg').val(latdeg);
        $('#dm_lng_deg').val(lngdeg);
        $('#dm_lat_min').val( parseInt(latmin) );
        $('#dm_lng_min').val( parseInt(lngmin) );
        $('#dm_lat_dmin').val( Math.round(1000*(latmin - parseInt(latmin))) );
        $('#dm_lng_dmin').val( Math.round(1000*(lngmin - parseInt(lngmin))) );
    }
    $('#lonlat_dm_load_button').tap(loadLastKnownCoordsToLatLonPage);
    $('#lonlat_dd_load_button').tap(loadLastKnownCoordsToLatLonPage);

    // the "Go" button for Decimal Degree and Degrees Minutes
    function zoomToLatLonAsStated(lat,lng) {
        // make sure the numbers are numbers, and that the location is valid
        try {
            var latlng = new L.LatLng(lat,lng);
        } catch (err) {
            return alert("The coordinates are valid.");
        }
        if (! MAX_BOUNDS.contains(latlng) ) return alert("That location is outside of the mapping area.");

        // zoom the point location, nice and close, and add a marker
        switchToMap(function () {
            MAP.setView(latlng,16);
            placeTargetMarker(lat,lng);
        });
    }
    $('#lonlat_dd_button').tap(function () {
         var lat = parseFloat($('#dd_lat').val());
         var lng = parseFloat($('#dd_lng').val());
        zoomToLatLonAsStated(lat,lng);
    });
    $('#lonlat_dm_button').tap(function () {
        var latdeg = parseInt($('#dm_lat_deg').val());
        var latmin = parseInt($('#dm_lat_min').val());
        var latdmn = parseInt($('#dm_lat_dmin').val());
        var lat = latdeg + ((latmin + latdmn*0.001) / 60.0);

        var lngdeg = parseInt($('#dm_lng_deg').val());
        var lngmin = parseInt($('#dm_lng_min').val());
        var lngdmn = parseInt($('#dm_lng_dmin').val());
        var lng = lngdeg + ((lngmin + lngdmn*0.001) / 60.0);
        lng = -lng;

        zoomToLatLonAsStated(lat,lng);
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
    $('#page-radar').page();
    var target = $('#alerts');

    // iterate over ALL_POIS and calculate their distance from our last known location
    // poi.meters   poi.miles   poi.feet   poi.range
    // this is instrumental in sorting by distance and picking the nearest
    for (var i=0, l=ALL_POIS.length; i<l; i++) {
        var poi       = ALL_POIS[i];
        var destpoint = new L.LatLng(poi.lat,poi.lng);
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
        div.append( $('<span></span>').addClass('ui-li-heading').text(poi.title) );
        div.append( $('<span></span>').addClass('ui-li-desc').text(poi.categories) );
        div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text(poi.range + ' ' + poi.bearing) );

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
        var meters = latlng.distanceTo( new L.LatLng(poi.lat,poi.lng) );

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

    $('#gps_center').tap(function () {
        switchToMap(function () {
            MAP.fire('locationfound', { latlng: LAST_KNOWN_LOCATION } );
        });
    });
});




// functions for toggling the photo, like a one-item gallery  :)
// this varies between mobile and desktop, but since they're named the same it forms a common interface
function showPhoto(url) {
    $('#photo').prop('src',url);
    $.mobile.changePage('#page-photo');
}

function showElevation(url) {
    $('#elevation').prop('src',url);
    $.mobile.changePage('#page-elevationprofile');
}



///// a common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
function searchByKeyword(keyword) {
    var target = $('#keyword_results');
    target.empty();

    var title    = $('<span></span>').addClass('ui-li-heading').text(' Run a Bing address search');
    var subtitle = $('<span></span>').addClass('ui-li-desc').text('search as an address or landmark');
    var li       = $('<li></li>').addClass('zoom').append(title).append(subtitle).appendTo(target);
    li.data('address',keyword);
    li.click(function () {
        zoomToAddress( $(this).data('address') );
    });
    // for distance searching, Address Search is always "closest"
    li.attr('title',' Address search');
    li.data('meters', -1);

    disableKeywordButton();
    $('#page-search .sortpicker').hide();

    $.get('../ajax/keyword', { keyword:keyword, limit:100 }, function (reply) {
        enableKeywordButton();
        $('#page-search .sortpicker').show();

        if (! reply.length) {
            $('<li></li>').text('No Cleveland Metroparks results found.').appendTo(target);
            return;
        }
        for (var i=0, l=reply.length; i<l; i++) {
            var result   = reply[i];

            var title    = $('<span></span>').addClass('ui-li-heading').text(result.name);
            var subtitle = $('<span></span>').addClass('ui-li-desc').text(result.description);
            var distance = $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text('0 mi');
            var div      = $('<div></div>').addClass('ui-btn-text').append(title).append(subtitle).append(distance);
            var li       = $('<li></li>').addClass('zoom').addClass('ui-li-has-count').append(div);
            li.attr('backbutton','#page-keyword');
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

            li.tap(function () { zoomElementClick( $(this) ); });
        }

        // finally, have jQuery Mobile do its magic, then trigger distance calculation and sorting
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}



///// common interface: given a .zoom element with lon, lat, WSEN, type, gid,
///// fetch info about it and show it in a panel
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

    // change to the info page
    $.mobile.changePage('#page-info');

    // correct the Back button to go to the URL specified in the element, or else to the map
    var backurl = element.attr('backbutton');
    if (! backurl) backurl = '#page-find';
    $('#page-info .ui-header .ui-btn-left').prop('href', backurl);

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
        $('#page-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#page-getdirections');
    });
    $('#directions_bike').tap(function () {
        // set the directions type
        $('#directions_via').val('bike');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#page-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#page-getdirections');
    });
    $('#directions_bridle').tap(function () {
        // set the directions type
        $('#directions_via').val('bridle');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#page-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#page-getdirections');
    });
    $('#directions_car').tap(function () {
        // set the directions type
        $('#directions_via').val('car');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#page-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#page-getdirections');
    });
    $('#directions_bus').tap(function () {
        // set the directions type
        $('#directions_via').val('bus');
        $('#directions_via').trigger('change');
        // update that selector: render the page if it's not already been visited, then restyle the selector so it shows the value it has
        $('#page-getdirections').page();
        $('#directions_via').selectmenu("refresh");
        // and change to the Get Directions panel
        $.mobile.changePage('#page-getdirections');
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
        $.mobile.changePage('#page-find');

        // if they clicked this button, it means that they will be looking for a place,
        // with the specific purpose of getting Directions there
        // set this flag, which will cause zoomElementClick() to skip showing the info and skip to directions
        SKIP_TO_DIRECTIONS = true;
    });

    // these buttons toggle whether AUTO_CENTER_ON_LOCATION is set, and thus whether the map will automatically recenter to follow the GPS
    $('#gps_autocenter').change(function () {
        AUTO_CENTER_ON_LOCATION = parseInt( $(this).val() );
    });

});




///// on page load
///// event handlers for the Loops listing and filtering
///// See also filterLoops() below
$(window).load(function () {
    // the event handlers below are for the sliders and textboxes within #page-loops,
    // so trigger a DOM rendering of the page now so the elements exist
    $('#page-loops-search').page();

    $('#loops_filter_distance_min').change(function () {
        var value     = parseInt( $(this).val() );
        var milestext = value > 1 ? 'miles' : 'mile';
        var text      = value + ' miles';
        $('#loops_filter_distance_min_text').text(text);

        // if this value is > the selected max value, set the max value
        var max = parseInt( $('#loops_filter_distance_max').val() );
        if (value > max) $('#loops_filter_distance_max').val(value+1).slider("refresh");
    });
    $('#loops_filter_distance_max').change(function () {
        var value     = parseInt( $(this).val() );
        var milestext = value > 1 ? 'miles' : 'mile';
        var text      = value + ' ' + milestext;
        $('#loops_filter_distance_max_text').text(text);

        // if this value is < the selected min value, set the max value
        var min = parseInt( $('#loops_filter_distance_min').val() );
        if (value < min) $('#loops_filter_distance_min').val(value-1).slider("refresh");
    });
    $('#loops_filter_duration_min').change(function () {
        var minutes = parseInt( $(this).val() );
        var text    = minutes + ' min';
        if (minutes >= 60) {
            var hours = Math.floor(minutes / 60);
            var hrs = hours > 1 ? 'hrs' : 'hr';
            text = hours + ' ' + hrs + ' ' + (minutes % 60) + ' min';
        }
        $('#loops_filter_duration_min_text').text(text);

        // if this value is > the selected max value, set the max value
        var max = parseInt( $('#loops_filter_duration_max').val() );
        if (minutes > max) $('#loops_filter_duration_max').val(minutes+1).slider("refresh");
    });
    $('#loops_filter_duration_max').change(function () {
        var minutes = parseInt( $(this).val() );
        var text    = minutes + ' minutes';
        if (minutes >= 60) {
            var hours = Math.floor(minutes / 60);
            var hrs = hours > 1 ? 'hrs' : 'hr';
            text = hours + ' ' + hrs + ' ' + (minutes % 60) + ' min';
        }
        $('#loops_filter_duration_max_text').text(text);

        // if this value is < the selected min value, set the max value
        var min = parseInt( $('#loops_filter_duration_min').val() );
        if (minutes < min) $('#loops_filter_duration_min').val(minutes-1).slider("refresh");
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
        var timeslider = $('#loops_filter_duration');
        type ? timeslider.show() : timeslider.hide();

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
            default:
                $('.time_estimate').show();
                $('.time_estimate_prefix').show();
                break;
            }
    });
});

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

            var li = $('<li></li>').addClass('zoom').addClass('ui-li-has-count');
            li.attr('backbutton', '#page-loops-search');
            li.attr('type','loop');
            li.attr('title', result.title);
            li.attr('gid', result.gid);
            li.attr('w', result.w);
            li.attr('s', result.s);
            li.attr('e', result.e);
            li.attr('n', result.n);
            li.attr('lat', result.lat);
            li.attr('lng', result.lng);

            var div = $('<div></div>').addClass('ui-btn-text');
            div.append( $('<span></span>').addClass('ui-li-heading').text(result.title) );
            div.append( $('<span></span>').addClass('ui-li-desc').html(result.distance + ' &nbsp;&nbsp; ' + result.duration) );
            div.append( $('<span></span>').addClass('zoom_distance').addClass('ui-li-count').addClass('ui-btn-up-c').addClass('ui-btn-corner-all').text('0 mi') );

            li.append(div);
            target.append(li);

            // enable click behavior: calls zoomElementClick() to bring up details
            li.tap(function () { zoomElementClick( $(this) ); });
        }

        // sort it by distance and have jQuery Mobile refresh it
        $('#page-loops-search .sortpicker').show();
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
        target = $(":jqmData(role='page'):visible ul.distance_sortable").eq(0);
        if (! target.length) return;
    }

    // okay, so we have our target UL, find all .zoom_distance tags under it,
    // and know that the grandparent of that span is a DIV element with lat and lng, cuz we follow that protocol when we lay down elements; see also zoomelement
    // calculate the distance and fill in the box with a human-friendly version
    // yes, even if we don't want to sort by distance, because this is the time when they switched to
    // this listing or received a location change event, so the best time to at least make sure the distances are accurate
    target.find('.zoom_distance').each(function () {
        var element   = $(this).parent().parent();
        var destpoint = new L.LatLng(element.attr('lat'),element.attr('lng'));
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
}

