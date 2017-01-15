 /**
 * embedded.js
 *
 * JS for external embedded maps.
 *
 * Cleveland Metroparks
 */

// Disable scrollwheel-driven map zooming so the user can scroll down the page
$(window).load(function() {
	MAP.scrollWheelZoom.disable();
});