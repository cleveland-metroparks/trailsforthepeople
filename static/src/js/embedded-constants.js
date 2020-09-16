 /**
 * embedded-constants.js
 *
 * Overrides of constants.js and other necessities for embedded maps.
 *
 * Cleveland Metroparks
 */

// Override app paths from constants.js to access the maps server
// via absolute URL instead of the default relative, which would
// attempt to connect to the of domain where the embedded map lives.
// (For local development, comment these out.)
WEBAPP_BASEPATH = 'https://maps.clevelandmetroparks.com/';
API_BASEPATH = 'https://maps.clevelandmetroparks.com/'; // (Old API server)

var CM_SITE_BASEURL = 'https://www.clevelandmetroparks.com/';
