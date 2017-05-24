/**
 * Sidebar
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

        // Get Activity ID from query string params
        // (purl.js apparently doesn't parse query string if URL begins with '#')
        re = /id=(.*)&category=/;
        var matches = this.hash.match(re);
        if (matches.length == 2) {
            activity_id = matches[1];
        }

        sidebar.open('pane-browse-results');

        var target = $('ul#browse_results');
        target.empty();

        activity_title = $(this).text().trim();

        // fix the Back button on the target panel, to go Back to the right page
        // @TODO: Can we consolidate, now that the other two options are gone?
        var backurl = "#pane-browse";
        if (category.indexOf('pois_usetype_') == 0) {
            backurl = "#pane-browse-pois-activity";
        }
        $('#pane-browse-results .sidebar-back').prop('href', backurl);
        // for the fetched items, if one follows to the Info panel, where should that Back button go?
        var backbuttonurl = backurl;
        if (category) backbuttonurl = "#pane-browse-results";

        // Fetch JSON data via AJAX, render to UL.zoom in the #pane-browse-results pane, and display it
        $.get(APP_BASEPATH + 'ajax/get_attractions_by_activity', { activity_ids: activity_id }, function (reply) {

            // Header title
            var header = $('#pane-browse-results h1.sidebar-header .title-text');
            header.text(activity_title);

            // Iterate over fetched results and render them into the target
            for (var i=0, l=reply.results.length; i<l; i++) {
                var result = reply.results[i];

                // List item
                // A lot of attributes to set pertaining to .zoom handling
                var li = $('<li></li>').addClass('zoom');
                li.attr('title', result.name );
                li.attr('gid',result.gid)
                    .attr('type',result.type)
                    .attr('w',result.w)
                    .attr('s',result.s)
                    .attr('e',result.e)
                    .attr('n',result.n)
                    .attr('lat',result.lat)
                    .attr('lng',result.lng);
                li.attr('backbutton', backbuttonurl);

                // Link (fake, currently)
                link = $('<a></a>');
                link.attr('class', 'ui-btn ui-btn-text');
                //link.attr('href', 'javascript:zoomElementClick(this)');
                li.append(link);

                // On click: center the map and load More Info
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

            // Finalize the list,
            // have jQuery Mobile do its styling magic on the newly-loaded content,
            // then calculate the distances and sort.
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
 * @TODO: Bind this to sidebar tab button clicks AND
 * clicks inside sidebar panes that generate/load new data
 *
 * mobile-specific: on any page change, after the changeover,
 * update the distance readouts in any ul.dstance_sortable which was just now made visible
 */
$(document).bind('pagechange', function(e,data) {
    //sortLists();
});

/*
 * mobile-specific: listen for page changes to #pane-info
 * and make sure we really have something to show data for
 * e.g. in the case of someone reloading #pane-info the app
 * can get stuck since no feature has been loaded
 */
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
        FastClick.attach(
            // Only attach it to the sidebar so we don't mess with the map.
            document.getElementById('sidebar')
        );
    });
});