 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

$(document).ready(function(){
    // Load the URL params before the map, as we may need them to configure it.
    URL_PARAMS = $.url();

    MIN_ZOOM = 10;

    // Load the map.
    initMap();

    // Disable scrollwheel-driven map zooming so the user can scroll down the page.
	MAP.scrollWheelZoom.disable();
});