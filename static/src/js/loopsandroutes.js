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
 * @see also filterLoops() below
 */
$(window).load(function () {
    // the event handlers below are for the sliders and textboxes within #pane-loops,
    // so trigger a DOM rendering of the page now so the elements exist
    $('#pane-loops-search').page();

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

    // #loops_filter_distance_slider is invisible and we have a set of 4 images to form "presets" for this slider
    $('#loops_filter_distancepicker img').click(function () {
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
    //}).first().click();
    });

    // having set up the sliders 'change' handlers, trigger them now to set the displayed text
    $('#loops_filter_distance_min').change();
    $('#loops_filter_distance_max').change();
    $('#loops_filter_duration_min').change();
    $('#loops_filter_duration_max').change();

    // the filter button, calls filterLoops()
    $('#loops_filter_button').click(filterLoops);

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

    $.get(APP_BASEPATH + 'ajax/search_loops', params, function (results) {
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

            // On click: center the map and load More Info
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
