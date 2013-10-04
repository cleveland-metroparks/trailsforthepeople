var MOBILE = false;

var LAST_KNOWN_LOCATION = new L.LatLng(0,0);

// if we're using embed mode (the &embed=1 param was given) we have to downsize some dialogs
// this is the max size to fit the iframe at Cleveland Metroparks' website
var EMBED_DIALOG_WIDTH  = 550;
var EMBED_DIALOG_HEIGHT = 475;

// on page load: load the MAP, then do stuff that depends on it such as automatic zoom by location
$(window).load(function () {
    // load up the URL params before the map, as we may need them to configure the map
    URL_PARAMS = $.url();
    if ( URL_PARAMS.param('embed') ) MIN_ZOOM -= 1
    if ( URL_PARAMS.param('embed') ) $('#toolbar img.logo').hide();
    if ( ! URL_PARAMS.param('embed') ) $('#button_fullscreen').hide();

    if (! URL_PARAMS.param('measure') ) $('#button_measure').hide();

    // start the map
    initMap();

    // stuff here comes after the map is initialized
});


// on page load: initialize dialog popups and the toolbar icons which trigger them
$(window).load(function () {
    // the toolbar buttons: close all open dialogs, open this one
    $('.button').click(function () {
        var target = $('#' + $(this).attr('target'));
        if (! target.length) return; // target not found, bail

        // if the target dialog is a modal dialog, we don't need to close the other panels but can open this one on top of it
        if (! target.dialog('option','modal') ) $('.dialog').dialog('close');
        target.dialog('open');
    });

    // now create the dialogs
    $('#welcome').dialog({
        modal:true, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width:450, height:400,
        title:"Welcome",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        }
    });

    $('#share').dialog({
        modal:true, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width:700, height:140,
        title:"Share your map",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            // when this dialog opens, fetch a short URL and fill it in
            populateShareBox();
        }
    });

    $('#geocode').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width:420, height:150,
        title:"Zoom to an address or landmark",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('directions');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#browse').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width:550, height:550,
        title:"Find",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#search').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width:550, height:425,
        title:"Search by Keyword",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#gallery').dialog({
        modal:true, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 825, height:575,
        title:"Photo",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#elevationprofile').dialog({
        modal:true, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 500, height:325,
        title:"Elevation Profile",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#settings').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 500, height:500,
        title:"Map Layers &amp; Features",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('settings');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#info').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 650, height:600,
        title:"Details",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#getdirections').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 500, height:500,
        title:"Get Directions",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('directions');

            // if the measure tool was happening, stop it now
            //stopMeasure();
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#loops').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 550, height:500,
        title:"Featured Hikes and Routes",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });
    $('#loops_button').click(function () {
        // change to the Featured Loops dialog popup; this replaces a Featured Loops button in the navbar
        $('.dialog').dialog('close');
        $('#loops').dialog('open');
    });

    $('#trailfinder').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 550, height:500,
        title:"Trail Finder",
        buttons: {
            'Back': function() {
                $('#button_find').click();
            }
        },
        open: function () {
            highlightToolbarButton('browse');
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });
    $('#trailfinder_button').click(function () {
        // change to the Bike Trails dialog popup; this replaces a Featured Loops button in the navbar
        $('.dialog').dialog('close');
        $('#trailfinder').dialog('open');
    });

    $('#print').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 525, height:350,
        title:"Print",
        buttons: {
            'Print': function () {
                printMap();
            },
            'Close' : function () {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('print');

            $('#print_ready').hide();
            $('#print_waiting').hide();
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#twitter').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 550, height:500,
        title:"Twitter",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('twitter');
            loadTwitter();
        },
        close: function() {
            highlightToolbarButton(null);
        }
    });

    $('#measure').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 575, height:450,
        title:"Measure distance between two points",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        },
        open: function () {
            highlightToolbarButton('measure');

            // initialize the measurement stuff: the output div, the marker locations, etc.
            startMeasure();
        },
        close: function () {
            // pick the toolbar button
            highlightToolbarButton(null);

            // empty our last measurement results and pull the markers
            //stopMeasure();
        }
    });

    $('#credits').dialog({
        modal:false, closeOnEscape: true, resizable:true,
        autoOpen:false,
        zIndex: 1000,
        width: 550, height:375,
        title:"About this app",
        buttons: {
            'Close': function() {
                $(this).dialog('close');
            }
        }
    });

    // if embed mode is selected, then we have to back up a bit:
    // check each dialog's width & height, see whether they're too big for the given window, and downsize them as needed
    if ( URL_PARAMS.param('embed') ) {
        $('.dialog').each(function () {
            var width  = $(this).dialog('option', 'width');
            var height = $(this).dialog('option', 'height');
            //console.log([ $(this).attr('id') , width , height ]);
            if (width > EMBED_DIALOG_WIDTH) {
                //console.log('downsizing width');
                $(this).dialog('option', 'width', EMBED_DIALOG_WIDTH);
            }
            if (height > EMBED_DIALOG_HEIGHT) {
                //console.log('downsizing height');
                $(this).dialog('option', 'height', EMBED_DIALOG_HEIGHT);
            }
        });
    }

    ///// now that all dialogs have been created, show the Welcome dialog if they have asked for it and no other factors suppress it
    var show_welcome = cookieGet('show_welcome');
    if ( URL_PARAMS.param('embed') ) show_welcome = false;
    if (show_welcome) $('#welcome').dialog('open');
});


function highlightToolbarButton(which) {
    // un-highlight all of them
    var buttons = $('#toolbar img.button');
    buttons.each(function () {
        var src = $(this).prop('src');
        src = src.replace('_active_','_');
        $(this).prop('src', src);
    });

    // highlight this one
    if (which) {
        var button = $('#toolbar img.button[target="'+which+'"]');
        var src = button.prop('src');
        src = src.replace('_','_active_');
        button.prop('src', src);
    }
}


// on page load: event handlers for the Find and Search panels
// and the AJAX data loads for the content of some of the listings
$(window).load(function () {
    ///// setup the Browse content, which is mostly AJAX but partly not
    ///// and at any rate which needs consistent click-to-expand and click-for-info behaviors
    ///// despite being loaded from multiple sources
    function clickHead() {
        $(this).parent().siblings('li').children('ul').hide();

        var target = $(this).siblings('ul');
        if (target.is(':visible')) {
            target.hide();
            target.removeClass('expanded');
        } else {
            target.show();
            target.addClass('expanded');
        }
    }

    $.get('../desktop/fetch_activitypois', {}, function (structure) {
        var target = $('#activitypois');
        for (var category in structure) {
            // set up the LI that houses this category within the target UL
            // add the .head click handler to expand its child, and hide the UL that we're creating until clickHead shows it
            var catli = $('<li></li>').appendTo(target);
            $('<div></div>').addClass('head').text(category).appendTo(catli).click(clickHead);
            var poisul = $('<ul></ul>').appendTo(catli);
            poisul.hide();

            // iterate over POIs and populate that nested UL of POIs
            var pois = structure[category];
            for (var i=0, l=pois.length; i<l; i++) {
                var poili = $('<li></li>').appendTo(poisul).text(pois[i].use_area).addClass('zoom');
                poili.attr('type','poi');
                poili.attr('title', pois[i].use_area );
                poili.attr('gid', pois[i].gid );
                poili.attr('lat', pois[i].lat );
                poili.attr('lng', pois[i].lng );
                poili.attr('w', pois[i].boxw );
                poili.attr('s', pois[i].boxs );
                poili.attr('e', pois[i].boxe );
                poili.attr('n', pois[i].boxn );

                // and finally, the big Click For More Info handler
                poili.click(function () {
                    zoomElementClick( $(this) );
                });
            }
        }
    }, 'json');

    $.get('../desktop/fetch_reservationpois', {}, function (structure) {
        var target = $('#reservationpois');
        for (var reservation in structure) {
            // set up the LI that houses this category within the target UL
            // add the .head click handler to expand its child, and hide the UL that we're creating until clickHead shows it
            var catli = $('<li></li>').appendTo(target);
            $('<div></div>').addClass('head').text(reservation).appendTo(catli).click(clickHead);
            var poisul = $('<ul></ul>').appendTo(catli);
            poisul.hide();

            // iterate over POIs and populate that nested UL of POIs
            var pois = structure[reservation];
            for (var i=0, l=pois.length; i<l; i++) {
                var poili = $('<li></li>').appendTo(poisul).text(pois[i].use_area).addClass('zoom');
                poili.attr('type','poi');
                poili.attr('title', pois[i].use_area );
                poili.attr('gid', pois[i].gid );
                poili.attr('lat', pois[i].lat );
                poili.attr('lng', pois[i].lng );
                poili.attr('w', pois[i].boxw );
                poili.attr('s', pois[i].boxs );
                poili.attr('e', pois[i].boxe );
                poili.attr('n', pois[i].boxn );

                // and finally, the big Click For More Info handler
                poili.click(function () {
                    zoomElementClick( $(this) );
                });
            }
        }
    }, 'json');


    $.get('../desktop/fetch_loops', {}, function (loops) {
        var target = $('#loops_list');
        for (var i=0, l=loops.length; i<l; i++) {
            var loop = loops[i];

            // unlike those others above, this is a flat list and not a nested list
            // AND it has extra attributes since it's used for filtering
            // AND it doesn't have a .text but instead a bunch of nested spans for styling
            // Tell me again about separating style & layout from programming?  :)
            for (var i=0, l=loops.length; i<l; i++) {
                var li = $('<li></li>').appendTo(target).addClass('zoom');
                li.attr('type','loop');
                li.attr('title', loops[i].name );
                li.attr('gid', loops[i].id );
                li.attr('lat', loops[i].lat );
                li.attr('lng', loops[i].lng );
                li.attr('w', loops[i].boxw );
                li.attr('s', loops[i].boxs );
                li.attr('e', loops[i].boxe );
                li.attr('n', loops[i].boxn );

                // these attribs are specific searching for Loops in that panel
                li.attr('hike', loops[i].hike );
                li.attr('bike', loops[i].bike );
                li.attr('bridle', loops[i].bridle );
                li.attr('difficulty', loops[i].difficulty );
                li.attr('length_feet', loops[i].length_feet );
                li.attr('duration_hike', loops[i].duration_hike );
                li.attr('duration_bike', loops[i].duration_bike );
                li.attr('duration_bridle', loops[i].duration_bridle );
                li.attr('paved', loops[i].paved );

                li.data('reservations', loops[i].reservations );

                // the internal structure of that LI so it gets styled
                $('<span></span>').addClass('ui-li-heading').text(loops[i].name).appendTo(li);
                $('<span></span>').addClass('ui-li-desc').text("Length: " + loops[i].distancetext).appendTo(li);
                $('<br></br>').appendTo(li);

                var est_hike   = $('<span></span>').addClass('ui-li-desc').addClass('time_estimate').addClass('time_hike').text(loops[i].durationtext_hike).appendTo(li);
                var est_bike   = $('<span></span>').addClass('ui-li-desc').addClass('time_estimate').addClass('time_bike').text(loops[i].durationtext_bike).appendTo(li);
                var est_bridle = $('<span></span>').addClass('ui-li-desc').addClass('time_estimate').addClass('time_bridle').text(loops[i].durationtext_bridle).appendTo(li);
                $('<span></span>').addClass('time_estimate_prefix').text('Walking:').prependTo(est_hike);
                $('<span></span>').addClass('time_estimate_prefix').text('Bicycling:').prependTo(est_bike);
                $('<span></span>').addClass('time_estimate_prefix').text('Horseback:').prependTo(est_bridle);

                // and finally, the big Click For More Info handler
                li.click(function () {
                    zoomElementClick( $(this) );
                });
            }
        }
    }, 'json');

    // the accordion-like effect on the UL, expanding and collapsing sections
    // for those not loaded via AJAX above
    $('#browse div.head').click(clickHead);

    // and for that accordion, expand the top level and hide-collapse the rest
    // for those not loaded via AJAX above
    $('#browse ul').hide();
    $('#browse > ul').show();

    ///// onward to Keyword Search

    // the Keyword Search text search in the Browse panel, is just a shell over the one in #search
    $('#browse_keyword_button').click(function () {
        // change over to the Search panel
        $('.dialog').dialog('close');
        $('#search').dialog('open');

        // fill in the Search keyword and click the button to do the search (if any)
        // it's up to #search_keyword to detect it being blank
        $('#search_keyword').val( $('#browse_keyword').val() );
        $('#search_keyword_button').click();
    });
    $('#browse_keyword').keydown(function (key) {
        if(key.keyCode == 13) $('#browse_keyword_button').click();
    });

    // Keyword Search: return to the Browse panel instead
    $('#return_to_basic_search').click(function () {
        $('.dialog').dialog('close');
        $('#browse').dialog('open');
    });

    // Keyword Search: the keyword box and other filters
    $('#search_keyword_button').click(function () {
        var keyword = $('#search_keyword').val();
        searchByKeyword(keyword);
    });
    $('#search_keyword').keydown(function (key) {
        if(key.keyCode == 13) $('#search_keyword_button').click();
    });

    // bring up the Directions panel
    $('#button_directions').click(function () {
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });

});




// this was designed originally for mobile mode, where we in fact lose the map while we run
// other panels/dialogs/pages, and if we want to manipulate the map we must do so asynchronously
// In desktop mode, we don't need this same complexity but I kept the coding style so that code can be more easily
// adapted between Mobile and Desktop modes
function switchToMap(callback) {
    $('.dialog').dialog('close');
    if (callback) setTimeout(callback,100);
}



// functions for toggling the photo, like a one-item gallery  :)
// this varies between mobile and desktop, but since they're name the same it forms a common interface
function showPhoto(url) {
    $('#photo').prop('src',url);
    $('#gallery').dialog('open');
}

function hidePhoto() {
    $('#gallery').dialog('close');
}

function showElevation(url) {
    $('#elevation').prop('src',url);
    $('#elevationprofile').dialog('open');
}





///// a common interface at the AJAX level, but different CSS and sorting for Mobile vs Desktop
function searchByKeyword(keyword) {
    var target = $('#keyword_results');
    target.empty();

    var    title = $('<span></span>').addClass('ui-li-heading').text(' Address search');
    var subtitle = $('<span></span>').addClass('ui-li-desc').text('search as an address or landmark');
    var li       = $('<li></li>').css({'cursor':'pointer'}).append(title).append(subtitle);
    target.append(li);
    li.data('address',keyword);
    li.click(function () {
        zoomToAddress( $(this).data('address') );
    });

    disableKeywordButton();
    $.get('../ajax/keyword', { keyword:keyword, limit:100 }, function (reply) {
        enableKeywordButton();
        if (! reply.length) {
            $('<li></li>').text('No Cleveland Metroparks results found.').appendTo(target);
            return;
        }
        for (var i=0, l=reply.length; i<l; i++) {
            var result   = reply[i];
            var    title = $('<span></span>').addClass('ui-li-heading').text(result.name);
            var subtitle = $('<span></span>').addClass('ui-li-desc').text(result.description);
            var li       = $('<li></li>').addClass('zoom').append(title).append(subtitle);
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

            li.data('sort', result.name );

            li.click(function () {
                zoomElementClick( $(this) );
            });
        }

        // done loading the list, sort it
        target.children('li').sort(function (p,q) {
            return $(p).data('sort') - $(q).data('sort');
        });
    }, 'json');
}



///// common interface: given a .zoom element with lon, lat, WSEN, type, gid,
///// fetch info about it, show it in a panel, populate info for getting directions, enable the directions because we now have a destination
function zoomElementClick(element) {
    var type = element.attr('type');
    var gid  = element.attr('gid');

    // change to the dialog
    $('.dialog').dialog('close');
    $('#info').dialog('open');

    // assign this element to the Show On Map button, so it knows how to zoom to our location
    // and to the getdirections form so we can route to it
    $('#show_on_map').data('zoomelement', element );
    $('#directions_target_lat').val( element.attr('lat') );
    $('#directions_target_lng').val( element.attr('lng') );
    $('#directions_target_type').val( element.attr('type') );
    $('#directions_target_gid').val( element.attr('gid') );
    $('#directions_target_title').text( element.attr('title') );

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
///// event handlers for the directions subsystem
$(window).load(function () {
    // the 4 icons on the Details panel simply select that directions type option, then change over to the Get Directions panel
    $('#directions_hike').click(function () {
        // set the directions type
        $('#directions_via').val('hike');
        $('#directions_via').trigger('change');
        // and change to the Get Directions panel
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });
    $('#directions_bike').click(function () {
        // set the directions type
        $('#directions_via').val('bike');
        $('#directions_via').trigger('change');
        // and change to the Get Directions panel
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });
    $('#directions_bridle').click(function () {
        // set the directions type
        $('#directions_via').val('bridle');
        $('#directions_via').trigger('change');
        // and change to the Get Directions panel
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });
    $('#directions_car').click(function () {
        // set the directions type
        $('#directions_via').val('car');
        $('#directions_via').trigger('change');
        // and change to the Get Directions panel
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });
    $('#directions_bus').click(function () {
        // set the directions type
        $('#directions_via').val('bus');
        $('#directions_via').trigger('change');
        // and change to the Get Directions panel
        $('.dialog').dialog('close');
        $('#getdirections').dialog('open');
    });

    // the directions-type picker (GPS, address, POI, etc) mostly shows and hides elements
    // its value is used in processGetDirectionsForm() for choosing how to figure out which element to use
    $('#directions_type').click(function () {
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
    });

    // the Get Directions button triggers a geocode and directions, using the common.js interface
    $('#directions_button').click(function () {
        $('#directions_steps').empty();
        processGetDirectionsForm();
    });
    $('#directions_address').keydown(function (key) {
        if(key.keyCode == 13) $('#directions_button').click();
    });

    // this button changes over to the Find panel
    $('#change_directions_target').click(function () {
        $('img[target="browse"]').click();
    });
    $('#change_directions_target2').click(function () {
        $('img[target="browse"]').click();

        // if they clicked this button, it means that they will be looking for a place,
        // with the specific purpose of getting Directions there
        // set this flag, which will cause zoomElementClick() to skip showing the info and skip to directions
        SKIP_TO_DIRECTIONS = true;
    });
});



///// on page load
///// load the autocomplete keywords via AJAX, and enable autocomplete on the Keyword Search
$(window).load(function () {
    $.get('../ajax/autocomplete_keywords', {}, function (words) {
        $('#search_keyword').autocomplete({
            source: words,
            select: function (event,ui) {
                // save the value to the textbox, per the default behavior
                $('#search_keyword').val( ui.item.value );
                // click the search button
                $('#search_keyword_button').click();
            }
        });

        $('#browse_keyword').autocomplete({
            source: words,
            select: function (event,ui) {
                // save the value to the textbox, per the default behavior
                $('#browse_keyword').val( ui.item.value );
                // click the search button
                $('#browse_keyword_button').click();
            }
        });
    },'json');
});



///// on page load
///// event handlers for the Loops listing and filtering
///// See also filterLoops() below
$(window).load(function () {
    // the time & distance sliders vary between Mobile and Desktop mode
    // see desktop.js and mobile.js for their handlers, look for #loops_filter_distance_slider and #loops_filter_time_slider

    // the time & distance sliders update some text
    // their values are used later in filterLoops()
    $('#loops_filter_distance_slider').slider({
        range: true, min: 0.0, max: 50, step: 0.25, values: [ 0, 50 ],
        slide: function(event,ui) {
            var min = ui.values[0];
            var max = ui.values[1];

           $('#loops_filter_distance_min').text(min);
           $('#loops_filter_distance_max').text(max);
        }
    });
    $('#loops_filter_time_slider').slider({
        range: true, min: 0, max: 300, step:15, values: [ 0, 300 ],
        slide: function(event,ui) {
            var min = ui.values[0];
            var max = ui.values[1];

            var mintext = min + ' minutes';
            var maxtext = max + ' minutes';
            if (min >= 60) mintext = Math.floor(min / 60) + ' hours ' + (min % 60) + ' minutes';
            if (max >= 60) maxtext = Math.floor(max / 60) + ' hours ' + (max % 60) + ' minutes';

            $('#loops_filter_time_min').text(mintext);
            $('#loops_filter_time_max').text(maxtext);
        }
    });

    // the loop type selector doesn't filter immediately, 
    // but it does show/hide the time slider and the time estimates for each loop,
    // since the estimate of time is dependent on the travel mode
    $('#loops_filter_type').change(function () {
        var type = $(this).val();

        // show/hide the time filter slider
        var timeslider = $('#loops_filter_time_div');
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

    // the filter button, calls filterLoops()
    $('#loops_filter_button').click(filterLoops);
});

function filterLoops() {
    $('#loops_list li').show();

    var filter_type  = $('#loops_filter_type').val();
    var filter_paved = $('#loops_filter_paved').val();
    var minseconds   = 60 * parseFloat( $('#loops_filter_time_slider').slider('values', 0) );
    var maxseconds   = 60 * parseFloat( $('#loops_filter_time_slider').slider('values', 1) );
    var minfeet      = 5280 * parseFloat( $('#loops_filter_distance_slider').slider('values', 0) );
    var maxfeet      = 5280 * parseFloat( $('#loops_filter_distance_slider').slider('values', 1) );
    var reservation  = $('#loops_filter_reservation').val();

    $('#loops_list li').each(function () {
        var hike   = $(this).attr('hike') == 'Yes';
        var bike   = $(this).attr('bike') == 'Yes';
        var bridle = $(this).attr('bridle') == 'Yes';
        var paved      = $(this).attr('paved');
        var difficulty = $(this).attr('difficulty');
        var length_feet      = $(this).attr('length_feet');
        var duration_hike    = $(this).attr('duration_hike');
        var duration_bike    = $(this).attr('duration_bike');
        var duration_bridle  = $(this).attr('duration_bridle');
        var duration = 0;

        // start by assuming that we match...
        var match  = true;

        // the Reservation filter
        if (match) {
            if (reservation && -1 == $.inArray(reservation , $(this).data('reservations') ) ) match = false;
        }

        // the paved filter
        if (match) {
            if (filter_paved && filter_paved != paved) match = false;
        }

        // the filter by the use type & difficulty
        if (match) {
            if (filter_type) {
                switch (filter_type) {
                    case 'hike':
                        if (!hike) match = false;
                        duration = duration_hike;
                        break;
                    case 'bridle':
                        if (!bridle) match = false;
                        duration = duration_bridle;
                        break;
                    case 'bike':
                        if (!bike) match = false;
                        duration = duration_bike;
                        break;
                    case 'bike_Novice':
                        if (!bike) match = false;
                        if (difficulty != 'Novice') match = false;
                        duration = duration_bike;
                        break;
                    case 'bike_Beginner':
                        if (!bike) match = false;
                        if (difficulty != 'Novice' && difficulty != 'Beginner') match = false;
                        duration = duration_bike;
                        break;
                    case 'bike_Intermediate':
                        if (!bike) match = false;
                        if (difficulty != 'Novice' && difficulty != 'Beginner' && difficulty != 'Intermediate') match = false;
                        duration = duration_bike;
                        break;
                    case 'bike_Advanced':
                        if (!bike) match = false;
                        duration = duration_bike;
                        break;
                }
            }
        }

        // the time filter is only available if there's a filter, as the filter dictates the time estimate
        // see how the duration defaults to 0 above, and was populated in the switch
        if (match) {
            if (duration) {
                if (duration < minseconds || duration > maxseconds) match = false;
            }
        }

        // the length/distance filter
        if (match) {
            if (length_feet < minfeet || length_feet > maxfeet) {
                match = false;
            }
        }

        // done checking for reasons not to match; hide it if we failed to match
        if (! match) $(this).hide();
    });
}





/////
///// pertaining to the Measure panel
/////

$(window).load(function () {
    $('#measure_button').click(function () {
        var via_type = $('#measure_via').val();
        if (via_type == 'trail') via_type = $('#measure_via_trail').val();
        performMeasure(MARKER_FROM.getLatLng(), MARKER_TO.getLatLng(), via_type );
    });

    $('#measure_clear').click(function () {
        stopMeasure();
        startMeasure();
        $('#measure_steps').empty();
    });

    $('#measure_via').change(function () {
        var show_trails_options = $(this).val() == 'trail';
        show_trails_options ? $('#measure_via_trail').show() : $('#measure_via_trail').hide() ;
    });
});


function stopMeasure() {
    // reset and remove the markers
    MARKER_FROM.setLatLng( new L.LatLng(0,0) );
    MARKER_TO.setLatLng( new L.LatLng(0,0) );
    MAP.removeLayer(MARKER_FROM);
    MAP.removeLayer(MARKER_TO);

    // set the markers to disable dragging
    MARKER_FROM.dragging.disable();
    MARKER_TO.dragging.disable();

    // remove the directions line
    clearDirectionsLine();

    // erase the prior results
    $('#measure_steps').empty();
}

function startMeasure() {
    // if the markers already exist, then measure is already happening. bail
    if (MARKER_FROM.getLatLng().lat && MARKER_TO.getLatLng().lat) return;

    // lay down the two markers: along the vertical midline, at 1/4 and 3/4 horizontal spacing
    var sw       = MAP.getBounds().getSouthWest();
    var ne       = MAP.getBounds().getNorthEast();
    var halflat  = ( sw.lat + ne.lat ) / 2.0;
    var notch    = (ne.lng - sw.lng) * 0.25;
    var ll1      = new L.LatLng(halflat , sw.lng + notch );
    var ll2      = new L.LatLng(halflat , ne.lng - notch );
    MARKER_FROM.setLatLng(ll1);
    MARKER_TO.setLatLng(ll2);
    MAP.addLayer(MARKER_FROM);
    MAP.addLayer(MARKER_TO);

    // set the markers to allow dragging
    MARKER_FROM.dragging.enable();
    MARKER_TO.dragging.enable();
}


function performMeasure(ll1,ll2,via) {
    // hide the prior results
    var target = $('#measure_steps');
    target.empty();

    // disable the button
    var button = $('#measure_button');
    button.prop('disabled',true);
    button.val( button.attr('value0') );

    // send the request
    var params = { sourcelat:ll1.lat, sourcelng:ll1.lng, targetlat:ll2.lat, targetlng:ll2.lng, tofrom:'to', via:via };
    $.get('../ajax/directions', params, function (reply) {
        // re-enable the button
        button.prop('disabled',false);
        button.val( button.attr('value1') );

        // make sure we got something, use the standard interface for rendering directions
        if (! reply || ! reply.wkt) {
            var message = "Could not find directions.";
            if (via != 'hike') message += "\nTry a different type of trail, terrain, or difficulty.";
            return alert(message);
        }
        renderDirectionsStructure(reply, target, { noshare:true });
    }, 'json');
}



