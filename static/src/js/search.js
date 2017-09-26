 /**
 * search.js
 *
 * JS for search functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Enable "Keyword Search" subsystem event handlers 
 */
$(document).ready(function () {
    // Keyword Search text search in the initial "Find" (/Browse) pane
    // is just a shell over the one in #search
    $('#browse_keyword_button').click(function () {
        // Change to the Search pane
        sidebar.open('pane-search');

        // Fill in the Search keyword and click the button to do the search (if any).
        // It's up to #search_keyword to detect it being blank
        $('#search_keyword').val( $('#browse_keyword').val() );
        $('#search_keyword_button').click();
    });

    // Catch "Enter" keypress on Find pane search field
    $('#browse_keyword').keydown(function (key) {
        if (key.keyCode == 13) {
            $('#browse_keyword_button').click();
        }
    });

    // Keyword Search: the keyword box and other filters
    $('#search_keyword_button').click(function () {
        var keyword = $('#search_keyword').val();
        searchByKeyword(keyword);
    });

    // Catch "Enter" keypress on Search pane search field
    $('#search_keyword').keydown(function (key) {
        if(key.keyCode == 13) {
            $('#search_keyword_button').click();
        }
    });
});

/**
 * Disable keyword button
 */
function disableKeywordButton() {
    var button = $('#search_keyword_button');
    button.button('disable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value0') );
}

/**
 * Enable keyword button
 */
function enableKeywordButton() {
    var button = $('#search_keyword_button');
    button.button('enable');
    button.closest('.ui-btn').find('.ui-btn-text').text( button.attr('value1') );
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
 * Search by Keyword
 *
 * A common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
 */
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

    $.get(API_BASEPATH + 'ajax/keyword', { keyword:keyword, limit:100 }, function (reply) {
        enableKeywordButton();
        $('#pane-search .sortpicker').show();

        if (! reply.length) {
            // No matches. Pass on to an address search, and say so.
            $('<li></li>').text('No Cleveland Metroparks results found. Trying an address search.').appendTo(target);
            zoomToAddress(keyword);
            return;
        }

        for (var i=0, l=reply.length; i<l; i++) {
            var result = reply[i];

            var li = $('<li></li>')
                .addClass('zoom')
                .addClass('ui-li-has-count');

            li.attr('title', result.name)
                .attr('gid', result.gid)
                .attr('type', result.type)
                .attr('w', result.w)
                .attr('s', result.s)
                .attr('e', result.e)
                .attr('n', result.n)
                .attr('lat', result.lat)
                .attr('lng', result.lng);

            li.attr('backbutton', '#pane-search');

            // Link (fake, currently)
            link = $('<a></a>');
            link.attr('class', 'ui-btn ui-btn-text');
            //link.attr('href', 'javascript:zoomElementClick(this)');

            // On click: center the map and load More Info
            li.click(function () {
                zoomElementClick( $(this) );
            });

            li.append(link);

            // Title
            link.append(
                $('<h4></h4>')
                    .addClass('ui-li-heading')
                    .text(result.name)
            );
            // Subtitle: type
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .text(result.description)
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

        // finally, have jQuery Mobile do its magic, then trigger distance calculation and sorting
        target.listview('refresh');
        sortLists(target);
    }, 'json');
}

/**
 * Load autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
 */
$(document).ready(function () {
    $.get(API_BASEPATH + 'ajax/autocomplete_keywords', {}, function (words) {

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
