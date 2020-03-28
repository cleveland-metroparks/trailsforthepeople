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
    reservations : [],
    attractions : []
};

//
// Get visitor centers and populate global object
//
$.get(API_NEW_BASE_URL + 'visitor_centers', null, function (reply) {
    CM.visitor_centers = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.visitor_centers.forEach(function(visitor_center) {
        visitor_center.categories = visitor_center.categories ? visitor_center.categories.split('|').map(Number) : null;
        visitor_center.amenities = visitor_center.amenities ? visitor_center.amenities.split('|').map(Number) : null;;
        visitor_center.activities = visitor_center.activities ? visitor_center.activities.split('|').map(Number) : null;;
    });

    console.log('CM.visitor_centers', CM.visitor_centers);
}, 'json');

//
// Get reservations, and populate global object
//
$.get(API_NEW_BASE_URL + 'reservations', null, function (reply) {
    CM.reservations = reply.data;
    console.log('CM.reservations', CM.reservations);
}, 'json');

//
// Get attractions, and populate global object
//
$.get(API_NEW_BASE_URL + 'attractions', null, function (reply) {
    CM.attractions = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.attractions.forEach(function(attraction) {
        attraction.categories = attraction.categories ? attraction.categories.split('|').map(Number) : null;
        attraction.amenities = attraction.amenities ? attraction.amenities.split('|').map(Number) : null;;
        attraction.activities = attraction.activities ? attraction.activities.split('|').map(Number) : null;;
    });

    console.log('CM.attractions', CM.attractions);
}, 'json');
