/**
 * trails.js
 *
 * JS for trailfinder functionality.
 *
 * Included into app.js.
 *
 * Cleveland Metroparks
 */

/**
 * Event handlers for Trail Finder
 * these used to be identical but then they diverged so desktop has these clicky icons, while mobile is still a selector (for now)
 */
$(window).load(function () {
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
