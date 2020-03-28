/**
 * data.js
 *
 * JS for basic maps/trails data management.
 *
 * Cleveland Metroparks
 */


//
// Create our global data object into which we'll pre-load necessary data from the API.
//
var CM = {
    visitor_centers : [],
    reservations : []
};

// Get visitor centers
$.get(API_NEW_BASE_URL + 'visitor_centers', null, function (reply) {
    CM.visitor_centers = reply.data;
}, 'json');


// Get reservations
$.get(API_NEW_BASE_URL + 'reservations', null, function (reply) {
    CM.reservations = reply.data;
}, 'json');
