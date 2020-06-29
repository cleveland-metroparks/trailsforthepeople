/**
 * loopsandroutes.js
 *
 * JS for loops and routes functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Event handlers for Loops listing and filtering
 *
 * @see also doTrailSearch() below
 */
$(document).ready(function () {
    // the event handlers below are for the sliders and textboxes within #pane-loops,
    // so trigger a DOM rendering of the page now so the elements exist
    // $('#pane-trails').page(); // @TODO: GLJS. Still necessary?

    // the #loops_filter_type selector is invisible, and we have a set of icons to set its value when they're clicked
    $('#loops_typeicons img').click(function () {
        // uncheck all of the invisible checkboxes, then check the one corresponding to this image
        var $this = $(this);
        var value = $this.attr('data-value');
        $('#loops_filter_type').val(value).trigger('change');

        // adjust the images: change the SRC to the _off version, except this one which gets the _on version
        $('#loops_typeicons img').each(function () {
            var src = $(this).prop('src');
            if ( $(this).is($this) ) {
                if (!src.includes('-on.svg')) {
                    src  = src.replace('.svg', '-on.svg');
                }
            } else {
                src  = src.replace('-on.svg', '.svg');
            }
            $(this).prop('src', src);
        });
    }).first().click();

    // #loops_filter_distance_min & max are invisible,
    // with filter buttons linked
    $('#loops_filter_distancepicker a').click(function () {
        // set the min & max in the inputs
        var $this = $(this);
        var min_mi = $this.attr('data-min');
        var max_mi = $this.attr('data-max');
        $('#loops_filter_distance_min').val(min_mi);
        $('#loops_filter_distance_max').val(max_mi);

        // Toggle button active state
        $('#loops_filter_distancepicker a').each(function () {
            if ($(this).is($this)) {
                $(this).addClass('active');
            } else {
                $(this).removeClass('active');
            }
        });

        // ready, now trigger a search
        doTrailSearch();
    //}).first().click();
    });

    // Reservation <select>
    $('#loops_filter_reservation').change(function () {
        // Perform search
        doTrailSearch();
    })

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();

    // the loop type selector doesn't filter immediately,
    // but it does show/hide the time slider and the time estimates for each loop,
    // since the estimate of time is dependent on the travel mode
    $('#loops_filter_type').change(function () {
        var type = $(this).val();

        // show only .time_estimate entries matching this 'type'
        switch (type) {
            case 'hike':
            case 'exercise':
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
            case 'bike_Novice':
            case 'bike_Beginner':
            case 'bike_Intermediate':
            case 'bike_Advanced':
            case 'mountainbike':
                $('.time_estimate').hide();
                $('.time_bike').show();
                $('.time_estimate_prefix').hide();
                break;
            default:
                $('.time_estimate').show();
                $('.time_estimate_prefix').show();
                break;
        }

        // then trigger a search
        doTrailSearch();
    });
});

/**
 * Filter trails
 *
 * @param activity {string} 'hike', 'bike*', 'bridle', or 'mountainbike'
 * @param reservation {string}
 * @param minDist: in feet
 * @param maxDist: in feet
 *
 * @return {array}
 */
function filterTrails(activity, reservation, minDist, maxDist) {
    results = [];

    // Change 'bike_Advanced', etc, to 'bike'
    if (activity.substr(0,4) == 'bike') {
        activity = 'bike';
    }

    var results = CM.trails.filter(function(trail) {
        // Filter by activity
        if (activity) {
            if (!trail[activity]) {
                return false;
            }
        }

        // Filter by reservation
        if (reservation) {
            if (trail['res'] != reservation) { // @TODO: if in reservation
                return false;
            }
        }

        // Filter by distance
        if ((typeof minDist !== 'undefined') && maxDist) {
            if (trail.distance_feet < minDist || trail.distance_feet > maxDist) {
                return false;
            }
        }

        return true;
    });

    // Note that results are no longer keyed by id.
    // filter() turns it in to a normal array.
    return results;
}

/**
 * Featured Routes list
 */
function doTrailSearch() {
    $('#loops_list li').show();

    // Filters
    var activity    = $('#loops_filter_type').val();
    var reservation = $('#loops_filter_reservation').val();
    var minDist     = 5280 * parseInt($('#loops_filter_distance_min').val());
    var maxDist     = 5280 * parseInt($('#loops_filter_distance_max').val());

    var results = filterTrails(activity, reservation, minDist, maxDist);

    // Find and empty the target UL
    var target = $('#loops_list');
    target.empty();

    // No results text
    $('.results-notes').remove();
    if (!results || !results.length) {
        var markup = '<p class="results-notes">No results.</p>';
        target.after(markup);
    }

    // Iterate over the results, add them to the output
    for (var i=0; i<results.length; i++) {
        var result = results[i];

        var li = $('<li></li>')
            .addClass('zoom')
            .addClass('ui-li-has-count');

        li.attr('title', result.name)
            .attr('gid', result.id)
            .attr('type','loop')
            .attr('w', result.boxw)
            .attr('s', result.boxs)
            .attr('e', result.boxe)
            .attr('n', result.boxn)
            .attr('lat', result.lat)
            .attr('lng', result.lng);

        li.attr('backbutton', '#pane-trails');

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

        // Select duration value based on chosen activity, defaulting to hike
        var duration;
        switch (activity) {
            case 'mountainbike':
            case 'bike_Advanced':
                duration = result.durationtext_bike;
                break;
            case 'bridle':
                duration = result.durationtext_bridle;
                break;
            case 'hike':
            default:
                duration = result.durationtext_hike;
        }

        // Inner text: distance and duration
        link.append(
            $('<span></span>')
                .addClass('ui-li-desc')
                .html(result.distancetext + ' &nbsp;&nbsp; ' + duration)
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
    $('#pane-trails .sortpicker').show();
    target.listview('refresh');
    sortLists(target);
}
