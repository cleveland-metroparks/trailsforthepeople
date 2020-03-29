/**
 * sidebar.js
 *
 * JS for app sidebar functionality.
 *
 * Cleveland Metroparks
 */

/**
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
     * Find pane (#pane-browse)
     */
    $('#pane-browse li a[href="#pane-activities"]').click(function() {
        set_pane_back_button('#pane-activities', '#pane-browse');
    });
    $('#pane-browse li a[href="#pane-trails"]').click(function() {
        set_pane_back_button('#pane-trails', '#pane-browse');
        // Perform trails search upon opening the pane.
        filterLoops();
    });

    /*
     * Nearby pane (#pane-nearby)
     */
    $('.sidebar-tabs li a[href="#pane-nearby"]').click(function() {
        updateNearYouNow();
    });

    /*
     * Activities pane (#pane-activities)
     */
    // When an Activity is clicked:
    $('#pane-activities li a').click(function() {
        // Get Activity ID from query string params
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /id=(\d*)/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            activity_id = matches[1];
        }

        sidebar.open('pane-browse-results');

        pane_title = $(this).text().trim();
        set_pane_back_button('#pane-browse-results', '#pane-activities');

        // Render to UL.zoom in the #pane-browse-results pane, and display it
        var filtered_attractions = CM.get_attractions_by_activity(activity_id);
        CM.display_attractions_results(pane_title, filtered_attractions, 'attraction');
    });

    /*
     * Amenities pane (#pane-amenities)
     */
    // When an amenity is clicked:
    $('#pane-amenities li a').click(function() {
        // Get Amenity ID from query string param
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /amenity_id=(\d*)/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            amenity_id = matches[1];
        }

        pane_title = $(this).text().trim();
        set_pane_back_button('#pane-browse-results', '#pane-amenities');

        // Render to UL.zoom in the #pane-browse-results pane, and display it
        var filtered_attractions = CM.get_attractions_by_amenity(amenity_id);
        CM.display_attractions_results(pane_title, filtered_attractions, 'attraction');
    });

    /*
     * Welcome pane (#pane-welcome)
     */

    // Visitor Centers button clicked
    $('#pane-welcome .welcome-pane-visitorcenters a').click(function() {
        pane_title = 'Visitor Centers';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        CM.display_attractions_results(pane_title, CM.visitor_centers, 'attraction');
    });

    // Parks button clicked
    $('#pane-welcome .welcome-pane-parks a').click(function() {
        pane_title = 'Parks';
        set_pane_back_button('#pane-browse-results', '#pane-welcome');

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        CM.display_attractions_results(pane_title, CM.reservations, 'reservation_new');
    });

    // Activities button clicked
    $('#pane-welcome .welcome-pane-activities a').click(function() {
        set_pane_back_button('#pane-activities', '#pane-welcome');
    });

    // Trails button clicked
    $('#pane-welcome .welcome-pane-trails a').click(function() {
        set_pane_back_button('#pane-trails', '#pane-welcome');
        // Perform trails search upon opening the pane.
        filterLoops();
    });

    /*
     * Share pane (#pane-share)
     */

    //// Build a new short URL for the current map state.
    //$('.sidebar-tabs a[href="#pane-share"]').click(function() {
    //    populateShareBox();
    //    setShareURLBoxWidth();
    //});

    // Use current URL for Twitter and Facebook share links
    // @TODO: Update on map change when share bar is open
    $('#share_facebook').click(function () {
        var url = $('#share_url').val();
            url = 'http://www.facebook.com/share.php?u=' + encodeURIComponent(url);
        $('#share_facebook').prop('href', url);
        return true;
    });
    $('#share_twitter').click(function () {
        var url = $('#share_url').val();
            url = 'http://twitter.com/home?status=' + encodeURIComponent(url);
        $('#share_twitter').prop('href', url);
        return true;
    });
});

/**
 * Display Attractions results from API call.
 *
 * @param pane_title
 * @param data
 * @param attraction_type
 */
CM.display_attractions_results = function(pane_title, data, attraction_type) {
    // Pane header title
    var header = $('#pane-browse-results h1.sidebar-header .title-text');
    header.text(pane_title);

    sidebar.open('pane-browse-results');

    var target = $('ul#browse_results');
    target.empty();

    // Iterate over fetched results and render them into the target
    for (var i=0, l=data.length; i<l; i++) {
        var result = data[i];

        // List item
        // A lot of attributes to set pertaining to .zoom handling
        var li = $('<li></li>')
            .addClass('zoom')
            .attr('title', result.pagetitle)
            .attr('gid', result.gis_id)
            .attr('record_id', result.record_id)
            .attr('type', attraction_type)
            .attr('w', result.boxw)
            .attr('s', result.boxs)
            .attr('e', result.boxe)
            .attr('n', result.boxn)
            .attr('lat', result.latitude)
            .attr('lng', result.longitude)
            .attr('backbutton', "#pane-browse-results");

        // Link (fake, currently)
        link = $('<a></a>');
        link.attr('class', 'ui-btn ui-btn-text');
        li.append(link);

        // On click: center the map and load More Info
        li.click(function () {
            zoomElementClick($(this));
        });

        // Title
        link.append(
            $('<span></span>')
                .addClass('ui-li-heading')
                .text(result.pagetitle)
            );

        // @TODO:API: Still necessary?
        //// Inner text
        //if (result.note) {
        //    link.append(
        //        $('<span></span>')
        //            .addClass('ui-li-desc')
        //            .html(result.note)
        //        );
        //}

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

    // Finalize the list,
    // have jQuery Mobile do its styling magic on the newly-loaded content,
    // then calculate the distances and sort.
    target.listview('refresh');
    sortLists(target);
}

///**
// * Resize the Share URL box if the size of the sidebar has potentially changed.
// */
//$(window).bind('orientationchange pageshow resize', function() {
//    if ($('#pane-share').hasClass('active')) {
//        setShareURLBoxWidth();
//    }
//});

/**
 * Would the sidebar [when expanded] obscure the whole map?
 */
function sidebarCoversMap() {
    window_width = $(window).width();

    // Can't rely on this because we want to know what it /would/ be when expanded
    // sidebar_width = $(sidebar._sidebar).width();

    return window_width <= 768;
}

/**
 * Set the back button URL on a pane
 */
set_pane_back_button = function(pane_id, back_url) {
    $('.sidebar-back', $(pane_id)).prop('href', back_url);
}

/**
 * @TODO: Bind this to sidebar tab button clicks AND
 * clicks inside sidebar panes that generate/load new data
 *
 * mobile-specific: on any page change, after the changeover,
 * update the distance readouts in any ul.dstance_sortable which was just now made visible
 */
$(document).bind('pagechange', function(e,data) {
    //sortLists();
});

/**
 * Use FastClick lib to get a more responsive touch-click on mobile.
 *
 * click() incurs a ~300ms delay on many mobile browsers.
 * touchstart() only works on mobile, and there are hazards of combining the two
 *
 * And we want to get rid of ghost clicks on longer taps, when an element is
 * touchstart()ed but then the click() event fires for an element beneath it.
 *
 * (And we're phasing out tap() as we get rid of jQm.)
 */
$(document).ready(function(){
    $(function() {
        FastClick.FastClick.attach(
            // Only attach it to the sidebar so we don't mess with the map.
            document.getElementById('sidebar')
        );
    });
});
