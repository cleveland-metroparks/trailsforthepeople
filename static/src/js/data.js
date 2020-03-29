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

/**
 * Get attractions that offer specified activities
 *
 * @param activity_ids
 */
function get_attractions_by_activity(activity_ids) {
    // Accept either a single Activity ID or an array of them.
    var activity_ids = Array.isArray(activity_ids) ? activity_ids : [activity_ids];
    // Strings to ints
    activity_ids = activity_ids.map(Number);

    var filtered_attractions = [];

    CM.attractions.forEach(function(attraction) {
        var found = true;

        // Check whether ALL searched-for activities are in this Attraction's list (ANDed)
        for (var i = 0; i < activity_ids.length; i++) {
            if (!attraction.activities || !attraction.activities.includes(activity_ids[i])) {
                found = false;
                break;
            }
        }

        if (found) {
            filtered_attractions.push(attraction);
        }
    });

    return filtered_attractions;
}

/**
 * Get attractions that have offer specified amenities
 *
 * @param amenity_ids
 */
function get_attractions_by_amenity(amenity_ids) {
    // Accept either a single Amenity ID or an array of them.
    var amenity_ids = Array.isArray(amenity_ids) ? amenity_ids : [amenity_ids];
    // Strings to ints
    amenity_ids = amenity_ids.map(Number);

    var filtered_attractions = [];

    CM.attractions.forEach(function(attraction) {
        var found = true;

        // Check whether ALL searched-for amenities are in this Attraction's list (ANDed)
        for (var i = 0; i < amenity_ids.length; i++) {
            if (!attraction.amenities || !attraction.amenities.includes(amenity_ids[i])) {
                found = false;
                break;
            }
        }

        if (found) {
            filtered_attractions.push(attraction);
        }
    });

    return filtered_attractions;
}
