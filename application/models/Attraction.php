<?php

/**
 * Attraction data model
 */
class Attraction extends DataMapper {

var $table    = 'view_cmp_gisattractions';
var $table_visitorcenters    = 'app_view_visitorcenters';

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Get attractions that include an activity or activities.
 *
 * @param $activity_ids
 *
 * @return All attractions that include any of the given activities.
 *         (Multiple activities are OR'ed.)
 */
function getAttractionsByActivity($activity_ids=array()) {
  $attractions = $this->getFilteredAttractions('activities', $activity_ids);
  return $attractions;
}

/**
 * Get attractions that offer an amenity or amenities.
 *
 * @param $amenity_ids
 *
 * @return All attractions that offer any of the given amenities.
 *         (Multiple amenities are OR'ed.)
 */
function getAttractionsByAmenity($amenity_ids=array()) {
    $attractions = $this->getFilteredAttractions('amenities', $amenity_ids);
    return $attractions;
}

/**
 * Get attractions that offer certain activities or amenities.
 *
 * @param $filter: 'activities' or 'amenities'
 * @param $filter_ids: array of attraction_ids or amenity_ids
 *
 * @return All attractions that include the given amenities/activities.
 *         (Multiple ids are OR'ed.)
 */
protected function getFilteredAttractions($filter, $filter_ids=array()) {
    // Accept one or multiple
    if (!is_array($filter_ids)) {
        $filter_ids = array($filter_ids);
    }

    $all_attractions = new Attraction();

    // Get all attractions first
    $all_attractions
        ->order_by('pagetitle')
        ->get();

    // Then filter by those that have the activity or activities
    switch ($filter) {
        case 'amenities':
            $attractions = $this->filterAttractionsByAmenities($all_attractions, $filter_ids);
            break;
        case 'activities':
            $attractions = $this->filterAttractionsByActivities($all_attractions, $filter_ids);
            break;
        default:
            $attractions = array();
            break;
    }

    return $attractions;
}

/**
 * Get nearby attractions
 *
 * @param $from_lat
 * @param $from_lng
 * @param $within_feet
 * @param $with_activities: array of activity IDs
 *
 * @return All attractions in the vicinity that include any of the activities, if provided.
 *         (Multiple activities are OR'ed.)
 */
function getNearbyAttractions($from_lat, $from_lng, $within_feet, $with_activities=array()) {
    // Cast to floats in case the caller forgot.
    $from_lng = (float) $from_lng;
    $from_lat = (float) $from_lat;
    $within_feet = (float) $within_feet;

    $table = 'view_cmp_gisattractions';

    // @TODO: Prevent injection!!!

    $sql = "
        SELECT * FROM $table
        WHERE ST_DISTANCE(
            geom,
            ST_TRANSFORM(ST_GEOMFROMTEXT('POINT($from_lng $from_lat)', 4326), 3734)) <= $within_feet
    ";

    $nearby_attractions = $this->db->query($sql)->result();

    // Then filter by those that have the activity or activities
    $attractions = $this->filterAttractionsByActivities($nearby_attractions, $with_activities);

    return $attractions;
}

/**
 * Get the activities for the (this) attraction.
 *
 * @return ActivityType object with the activities.
 */
function getAttractionActivities() {
    if (isset($this->activities)) {
        // Get an array of Activity IDs
        $activity_ids = $this->parseMultiIDsString($this->activities);
    } else {
        return;
    }

    // Get the set of corresponding ActivityType records
    $activities = new ActivityType();
    $activities->getActivitiesByID($activity_ids);

    return $activities;
}

/**
 * Filter a list of attractions by given activities.
 *
 * @param $attractions
 * @param $activity_ids
 */
function filterAttractionsByActivities($attractions, $activity_ids) {
    $filtered_attractions = array();

    // Go through all attractions
    foreach ($attractions as $attraction) {
        $attraction_activities = $this->parseMultiIDsString($attraction->activities);
        $found = FALSE;
        // Look for each provided activity within this Attraction's activity list
        foreach ($activity_ids as $activity_id) {
            if (in_array($activity_id, $attraction_activities)) {
                // Found it; add to our result list
                $filtered_attractions[] = $attraction;
                continue;
            }
        }
    }

    return $filtered_attractions;
}

/**
 * Filter a list of attractions by given activities.
 *
 * @param $attractions
 * @param $amenity_ids
 */
function filterAttractionsByAmenities($attractions, $amenity_ids) {
    $filtered_attractions = array();

    // Go through all attractions
    foreach ($attractions as $attraction) {
        $attraction_amenities = $this->parseMultiIDsString($attraction->amenities);
        $found = FALSE;
        // Look for each provided amenity within this Attraction's amenity list
        foreach ($amenity_ids as $amenity_id) {
            if (in_array($amenity_id, $attraction_amenities)) {
                // Found it; add to our result list
                $filtered_attractions[] = $attraction;
                continue;
            }
        }
    }

    return $filtered_attractions;
}

/**
 * Get visitor centers (a subset of attractions).
 *
 * @return
 */
function getVisitorCenters() {
  $visitor_centers = new Attraction();

  $sql = "
      SELECT *
      FROM $visitor_centers->table_visitorcenters
      ORDER BY pagetitle;
  ";
  $results = $visitor_centers->db->query($sql)->result();
  $output = (array)$results;

  return $output;
}

/**
 * Parse a multiple IDs string as its stored in the DB.
 * This is used in relating an attraction to activities and amenities.
 *
 * @param $ids_str: like "1|2|3"
 *
 * @return array
 */
function parseMultiIDsString($ids_str) {
    return explode('|', $ids_str);
}


}

/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_gisattractions (
  record_id integer,
  src varchar(255),
  gis_id integer,
  pagetitle varchar(255),
  categories varchar(255),
  descr varchar(2000),
  activities varchar(255),
  reservation integer,
  pagethumbnail varchar(255),
  reservable boolean,
  cmp_url varchar(255),
  amenities varchar(255),
  latitude float,
  longitude float,
  drivingdestinationlatitude float,
  drivingdestinationlongitude float,
  northlatitude float,
  northlongitude float,
  eastlatitude float,
  eastlongitude float,
  southlatitude float,
  southlongitude float,
  westlatitude float,
  westlongitude float,
  PRIMARY KEY(gis_id)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisattractions TO trails;

*/