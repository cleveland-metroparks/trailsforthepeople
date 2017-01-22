<?php

/**
 * Attraction data model
 */
class Attraction extends DataMapper {

var $table    = 'view_cmp_gisattractions';

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
function getAttractionsByActivity($activity_ids) {
    // Accept one or multiple
    if (!is_array($activity_ids)) {
        $activity_ids = array($activity_ids);
    }

    $all_attractions = new Attraction();

    // This way doesn't allow as easily for multiple Activities:
    //$attractions
    //    ->where('activities', $activity_id)
    //    ->or_like('activities', "$activity_id|%")
    //    ->or_like('activities', "%|$activity_id")
    //    ->or_like('activities', "%|$activity_id|%")
    //    ->order_by('pagetitle')
    //    ->get();

    // Get all attractions first
    $all_attractions
        ->order_by('pagetitle')
        ->get();

    // Then filter by those that have the activity (or activities)
    $attractions = array();
    // Go through all attractions
    foreach ($all_attractions as $attraction) {
        $attraction_activities = Attraction::parseActivitiesString($attraction->activities);
        $found = FALSE;
        // Look for each provided activity within this Attraction's activity list
        foreach ($activity_ids as $activity_id) {
            if (in_array($activity_id, $attraction_activities)) {
                // Found it; add to our result list
                $attractions[] = $attraction;
                continue;
            }
        }
    }

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
        $activity_ids = $this->parseActivitiesString($this->activities);
    } else {
        return;
    }

    // Get the set of corresponding ActivityType records
    $activities = new ActivityType();
    $activities->getActivitiesByID($activity_ids);

    return $activities;
}

/**
 * Parse the activities string as its stored in the DB.
 *
 * @param $activities_str: like "1|2|3"
 * @return array
 */
public function parseActivitiesString($activities_str) {
    return explode('|', $activities_str);
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
  latitude varchar(255),
  longitude varchar(255),
  drivingdestinationlatitude varchar(255),
  drivingdestinationlongitude varchar(255),
  northlatitude varchar(255),
  northlongitude varchar(255),
  eastlatitude varchar(255),
  eastlongitude varchar(255),
  southlatitude varchar(255),
  southlongitude varchar(255),
  westlatitude varchar(255),
  westlongitude varchar(255),
  PRIMARY KEY(record_id)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisattractions TO trails;

*/