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
    activities : [],
    amenities : [],
    attractions : [],
    attractions_nearby : [],
    autocomplete_keywords : [],
    categories : [],
    reservations : [],
    trails : [],
    visitor_centers : []
};

//
// Initialize search index
//
var fuseOptions = {
    keys: ['title'],
    includeScore: true,
    // Don't set threshold on search pattern location in string
    // See:
    //   https://fusejs.io/api/options.html
    //   https://fusejs.io/concepts/scoring-theory.html
    ignoreLocation: true
};
var dummySearchItem = {
    title: 'title',
    gid: 'gid',
    type: 'type',
    w: 'boxw',
    s: 'boxs',
    e: 'boxe',
    n: 'boxn',
    lat: 'latitude',
    lng: 'longitude',
    drivingLat: 'drivingDestinationLatitude',
    drivingLng: 'drivingDestinationLongitude'
};
var fuse = new Fuse([dummySearchItem], fuseOptions);

//
// Get categories, and populate global object, CM.categories
//
$.get(API_NEW_BASE_URL + 'categories', null, function (reply) {
    // Key by categorytypeid
    for (var i = 0; i < reply.data.length; i++) {
        var id = reply.data[i].categorytypeid;
        CM.categories[id] = {
            name: reply.data[i].name
        };
    }

    $.event.trigger({
        type: 'dataReadyCategories',
    });
}, 'json');

//
// Get amenities, and populate global object, CM.amenities
//
$.get(API_NEW_BASE_URL + 'amenities', null, function (reply) {
    CM.amenities = reply.data;

    var amenity_icons = {
        '221': 'baseball',     // Ball Field
        '231': 'basketball',   // Basketball Court
        '280': 'boat_rental',  // Boat Rentals
        '14':  'drink',        // Drinking Fountain
        '243': 'playground',   // Play Area
        '13':  'restroom',     // Restrooms
        '28':  'gifts',        // Shopping/Souvenirs
        '240': 'volleyball'    // Volleyball Courts
    };

    // Add icons
    CM.amenities.forEach(function(amenity) {
        amenity.icon = amenity_icons[amenity.amenitytypeid];
    });

    $.event.trigger({
        type: 'dataReadyAmenities',
    });
}, 'json');

//
// Get visitor centers and populate global object, CM.visitor_centers
//
$.get(API_NEW_BASE_URL + 'visitor_centers', null, function (reply) {
    CM.visitor_centers = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.visitor_centers.forEach(function(visitor_center) {
        visitor_center.categories = visitor_center.categories ? visitor_center.categories.split('|').map(Number) : null;
        visitor_center.amenities = visitor_center.amenities ? visitor_center.amenities.split('|').map(Number) : null;
        visitor_center.activities = visitor_center.activities ? visitor_center.activities.split('|').map(Number) : null;
    });

    $.event.trigger({
        type: 'dataReadyVisitorCenters',
    });
}, 'json');

//
// Get reservations, and populate global object, CM.reservations
//
$.get(API_NEW_BASE_URL + 'reservations', null, function (reply) {
    CM.reservations = reply.data;

    // Add to Fuse search index
    CM.reservations.forEach(function(reservation) {
        searchItem = {
            title: reservation.pagetitle,
            gid: reservation.record_id,
            type: 'reservation_new',
            w: reservation.boxw,
            s: reservation.boxs,
            e: reservation.boxe,
            n: reservation.boxn,
            lat: reservation.latitude,
            lng: reservation.longitude,
            drivingLat: reservation.drivingdestinationlatitude,
            drivingLng: reservation.drivingdestinationlongitude
        };
        fuse.add(searchItem);
    });

    $.event.trigger({
        type: 'dataReadyReservations',
    });
}, 'json');

//
// Get attractions, and populate global object, CM.attractions
//
$.get(API_NEW_BASE_URL + 'attractions', null, function (reply) {
    CM.attractions = reply.data;

    // Explode pipe-delimited strings to arrays
    CM.attractions.forEach(function(attraction) {
        attraction.categories = attraction.categories ? attraction.categories.split('|').map(Number) : null;
        attraction.amenities = attraction.amenities ? attraction.amenities.split('|').map(Number) : null;
        attraction.activities = attraction.activities ? attraction.activities.split('|').map(Number) : null;
    });

    // Add to Fuse search index
    CM.attractions.forEach(function(attraction) {
        searchItem = {
            title: attraction.pagetitle,
            gid: attraction.gis_id, // @TODO: record_id or gis_id ?
            type: 'attraction',
            w: null,
            s: null,
            e: null,
            n: null,
            lat: attraction.latitude,
            lng: attraction.longitude,
            drivingLat: attraction.drivingdestinationlatitude,
            drivingLng: attraction.drivingdestinationlongitude
        };
        fuse.add(searchItem);
    });
    $.event.trigger({
        type: 'dataReadyAttractions',
    });
}, 'json');

/**
 * Get and assemble activity icon file path from activity ID
 */
function activity_icon_filepath(activity_id) {
    var icons_dir = '/static/images/activities/'; // @TODO: Put in config and include basepath
    var activity_type_icons_by_id = {
         1: 'bike',      // Biking & Cycling
         2: 'swim',      // Swimming
         3: 'boat',      // Boating, Sailing & Paddlesports
         4: 'hike',      // Hiking & Walking
         5: 'fish',      // Fishing & Ice Fishing
         6: 'archery',   // Archery
         7: 'xcski',     // Cross-Country Skiing
         9: 'geocache',  // Geocaching
        11: 'horse',     // Horseback Riding
        12: 'mtnbike',   // Mountain Biking
        13: 'picnic',    // Picnicking
        14: '',          // Races & Competitions
        15: 'sled',      // Sledding
        16: 'snowshoe',  // Snowshoeing
        17: '',          // Tobogganing
        18: 'leafman',   // Rope Courses & Zip Lines
        19: 'geology',   // Exploring Nature
        20: 'history',   // Exploring Culture & History
        21: 'dine',      // Dining
        22: '',          // Classes, Workshops, & Lectures
        23: 'leafman',   // Special Events & Programs
        24: '',          // Concerts & Movies
        25: 'fitness',   // Fitness Circuit
        26: '',          // Disc Golf
        30: 'golf',      // Golfing
        39: 'fitness',   // Exercising
        41: '',          // FootGolf
    };
    var filename = activity_type_icons_by_id[activity_id];
    if (filename) {
        var icon_path = icons_dir + filename + '.svg';
        return icon_path;
    } else {
        return null;
    }
}

//
// Get activities, and populate global object, CM.activities
// Keyed by eventactivitytypeid.
//
$.get(API_NEW_BASE_URL + 'activities', null, function (reply) {
    // Key by eventactivitytypeid
    for (var i = 0; i < reply.data.length; i++) {
        var id = reply.data[i].eventactivitytypeid;
        CM.activities[id] = reply.data[i];
        CM.activities[id].icon = activity_icon_filepath(id);
    }

    $.event.trigger({
        type: 'dataReadyActivities',
    });
}, 'json');

//
// Get autocomplete keywords, and populate global object, CM.autocomplete_keywords
//
$.get(API_NEW_BASE_URL + 'autocomplete_keywords', null, function (reply) {
    for (var i = 0; i < reply.data.length; i++) {
        CM.autocomplete_keywords.push(reply.data[i].word);
    }

    $.event.trigger({
        type: 'dataReadyAutocompleteKeywords',
    });
}, 'json');

//
// Transform string interpretations of booleans into actual booleans.
// Really only need "Yes" and "No", but adding some extras for safety.
//
function str_to_bool(str) {
    switch (str) {
        case "Yes":
        case "yes":
        case "True":
        case "true":
        case "1":
        case 1:
        case true:
            return true;
        case "No":
        case "no":
        case "False":
        case "false":
        case "0":
        case 0:
        case false:
        case "":
        case null:
        default:
            return false;
    }
}

//
// Get trails, and populate global object, CM.trails
//
$.get(API_NEW_BASE_URL + 'trails', null, function (reply) {
    // Key by id
    for (var i = 0; i < reply.data.length; i++) {
        if (reply.data[i].status === 0) {
            // Skip unpublished trails
            continue;
        }
        trail = reply.data[i];
        // Change string versions of "Yes" & "No" into booleans
        trail.bike = str_to_bool(trail.bike);
        trail.hike = str_to_bool(trail.hike);
        trail.bridle = str_to_bool(trail.bridle);
        trail.mountainbike = str_to_bool(trail.mountainbike);

        CM.trails[reply.data[i].id] = trail;
    }

    // Add to Fuse search index
    CM.trails.forEach(function(trail) {
        searchItem = {
            title: trail.name,
            gid: trail.id,
            type: 'loop',
            w: trail.boxw,
            s: trail.boxs,
            e: trail.boxe,
            n: trail.boxn,
            lat: trail.lat,
            lng: trail.lng
        };
        fuse.add(searchItem);
    });

    $.event.trigger({
        type: 'dataReadyTrails',
    });
}, 'json');

/**
 * Get reservation by record_id.
 * Because our data comes in ordered alphabetically,
 * because the db table has no primary key, and record_id
 * can't necessarily be relied upon.
 *
 * @param record_id
 *
 * @return reservation if found, or null
 */
CM.get_reservation = function(record_id) {
    for (var i = 0; i < CM.reservations.length; i++) {
        if (CM.reservations[i].record_id == record_id) {
            return CM.reservations[i];
        }
    }
}

/**
 * Get attraction by gis_id.
 * Because our data comes in ordered alphabetically,
 * because the db table has no primary key, and gis_id
 * is sometimes null.
 *
 * @param gis_id
 *
 * @return attraction if found, or null
 */
CM.get_attraction = function(gis_id) {
    for (var i = 0; i < CM.attractions.length; i++) {
        if (CM.attractions[i].gis_id == gis_id) {
            return CM.attractions[i];
        }
    }
}

/**
 * Get attractions that offer specified activities
 *
 * @param activity_ids
 */
CM.get_attractions_by_activity = function(activity_ids) {
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
CM.get_attractions_by_amenity = function(amenity_ids) {
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
