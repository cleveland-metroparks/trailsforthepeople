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
 * Given a string, try to parse it as coordinates and return a LngLat object.
 *
 * Currently supports these formats:
 *      N 44 35.342 W 123 15.669
 *      44.589033 -123.26115
 */
function strToLngLat(text) {
    var text = text.replace(/\s+$/,'').replace(/^\s+/,'');

    // Simplest format is decimal numbers and minus signs and that's about it.
    // One of them must be negative, which means it's the longitude here in North America
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
                return new mapboxgl.LngLat(lng, lat);
            }
        }
    }

    // Okay, how about GPS/geocaching format: N xx xx.xxx W xxx xx.xxx
    var gps = text.match(/^N\s*(\d\d)\s+(\d\d\.\d\d\d)\s+W\s*(\d\d\d)\s+(\d\d\.\d\d\d)$/i);
    if (gps) {
        var latd = parseInt(gps[1]);
        var latm = parseInt(gps[2]);
        var lond = parseInt(gps[3]);
        var lonm = parseInt(gps[4]);

        var lat = latd + (latm/60);
        var lng = -lond - (lonm/60);

        return new mapboxgl.LngLat(lng, lat);
    }

    // Nothing matched; bail
    return null;
}

/**
 * Search by Keyword
 *
 * A common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
 */
function searchByKeyword(keyword) {
    // Surprise bypass:
    // If the search word "looks like coordinates" then zoom the map there
    var lnglat = strToLngLat(keyword);
    if (lnglat) {
        MAP.flyTo({
            center: lnglat,
            zoom: 16
        });
        placeMarker(MARKER_TARGET, lnglat.lat, lnglat.lng);
        return;
    }

    // guess we go ahead and do a text search
    var target = $('#keyword_results');
    target.empty();

    disableKeywordButton();
    $('#pane-search .sortpicker').hide();

    var results = fuse.search(keyword);

    enableKeywordButton();
    $('#pane-search .sortpicker').show();

    var maxSearchScore = .5;
    var filteredResults = results.filter(result => result.score < maxSearchScore);

    if (!filteredResults.length) {
        // No matches. Pass on to an address search, and say so.
        $('<li></li>').text('No Cleveland Metroparks results found. Trying an address search.').appendTo(target);
        zoomToAddress(keyword);
        return;
    }

    for (var i=0, l=filteredResults.length; i<l; i++) {
        var result = filteredResults[i];

        // Skip any results that don't have a location
        if (!result.item.lat || !result.item.lng) {
            continue;
        }

        var li = $('<li></li>')
            .addClass('zoom')
            .addClass('ui-li-has-count');

        li.attr('title', result.item.title)
            .attr('gid', result.item.gid)
            .attr('type', result.item.type)
            .attr('w', result.item.w)
            .attr('s', result.item.s)
            .attr('e', result.item.e)
            .attr('n', result.item.n)
            .attr('lat', result.item.lat)
            .attr('lng', result.item.lng);

        li.attr('backbutton', '#pane-search');

        // Fake link
        link = $('<a></a>');
        link.attr('class', 'ui-btn ui-btn-text');

        // On click: center the map and load More Info
        li.click(function () {
            zoomElementClick($(this));
        });

        li.append(link);

        // Title
        link.append(
            $('<h4></h4>')
                .addClass('ui-li-heading')
                .text(result.item.title)
        );
        // Subtitle: Result type
        if (resultTypeNames[result.item.type]) {
            link.append(
                $('<span></span>')
                    .addClass('ui-li-desc')
                    .text(resultTypeNames[result.item.type])
            );
        }
        // // @DEBUG: Search score
        // if (result.score) {
        //     link.append(
        //         $('<div></div>')
        //             .addClass('ui-li-desc')
        //             .text(result.score)
        //     );
        // }
    
        // Distance placeholder, to be populated later (in sortLists())
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

    // Have jQuery turn into a proper listview
    target.listview('refresh');

    // Do distance calculations on list
    getListDistances(target);
}

/**
 *
 */
var resultTypeNames = {
    'attraction': 'Attraction',
    // 'trail': 'Trail',
    'loop': 'Trail',
    'reservation': 'Reservation',
    'reservation_new': 'Reservation',
};

/**
 * Load autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
 */
$(document).on("dataReadyAutocompleteKeywords", function() {
    $.each(CM.autocomplete_keywords, function(index, value) {
        var li = '';
        li += '<li data-icon="arrow-r">';
        li += '<a href="#" data-transition="fade" class="ui-btn ui-btn-icon-right ui-icon-arrow-r">' + value + '</a>';
        li += '</li>';
        $('#browse_keyword_autocomplete').append(li);
        $('#search_keyword_autocomplete').append(li);
    });

    // Make sure the newly-added items get hidden
    $('#browse_keyword_autocomplete').listview("refresh").trigger("updatelayout");
    $('#search_keyword_autocomplete').listview("refresh").trigger("updatelayout");

    $('#browse_keyword_autocomplete li').click(function () {
        $('#browse_keyword').val('').trigger("change"); // Clear the autocomplete list
        $('#browse_keyword').val($(this).text()); // Put the selected word in the text input
        $('#browse_keyword_button').click(); // Trigger search
    });

    $('#search_keyword_autocomplete li').click(function () {
        $('#search_keyword').val('').trigger("change"); // Clear the autocomplete list
        $('#search_keyword').val($(this).text()); // Put the selected word in the text input
        $('#search_keyword_button').click(); // Trigger search
    });
});
