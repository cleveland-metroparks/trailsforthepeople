var jquery = window.$ = window.jQuery = require('jquery');
window.FastClick = require('fastclick');
// require('jquery-mobile');
window.mapboxgl = require('mapbox-gl');
// require('sidebar-v2/js/jquery-sidebar');
window.Wkt = require('wicket');
window.turf = require('@turf/turf');
require('@popperjs/core');
window.Tooltip = require('tooltip.js');
window.Handlebars = require("handlebars");
window.Fuse = require('fuse.js');
window.Chart = require('chart.js/auto');


/**
 * Disable jQuery Mobile's history manipulation.
 *
 * Now that we're manually manipulating the browser's history stack,
 * with window.history.pushState() and window.onpopstate(),
 * jQM's history manipulation is getting in the way.
 * Disable it.
 *
 * From https://github.com/jquery/jquery-mobile/issues/5465
 *
 * We're doing this in deps-app.js because it needs to happen just before
 * the jQM lib load, which is currently an inclusion in our HTML just
 * after this.
 */
$(document).bind( "mobileinit", function() {
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;
    $.mobile.changePage.defaults.changeHash = false;
});
