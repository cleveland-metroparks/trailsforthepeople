<?php

/**
 * Activity Type data model
 */
class ActivityType extends DataMapper {

var $table    = 'view_cmp_gisactivitytype';

var $chosen_activities = array(
    'Archery', // 6
    'Biking & Cycling', // 1
    'Boating & Paddlesports', // 3
    'Cross-Country Skiing', // 7
    'Dining', // 21
    //'Exercising', // 39
    'Exploring Culture & History', // 20
    'Exploring Nature', // 19
    'Fishing & Ice Fishing', // 5
    //'Fitness Circuit', // 25
    'Geocaching', // 9
    'Golfing', // 30
    'Hiking & Walking', // 4
    'Horseback Riding', // 11
    'Mountain Biking', // 12
    'Picnicking', // 13
    'Rope Courses & Zip Lines', // 18
    'Sledding', // 15
    'Snowshoeing', // 16
    'Swimming', // 2
    //'Tobogganing', // 17
);
// @TODO: Move this into the DB
var $activity_type_icons_by_id = array(
     1 => 'bike.svg',      // Biking & Cycling
     2 => 'swim.svg',      // Swimming
     3 => 'boat.svg',      // Boating & Paddlesports
     4 => 'hike.svg',      // Hiking & Walking
     5 => 'fish.svg',      // Fishing & Ice Fishing
     6 => 'archery.svg',   // Archery
     7 => 'xcski.svg',     // Cross-Country Skiing
     9 => 'geocache.svg',  // Geocaching
    11 => 'horse.svg',     // Horseback Riding
    12 => 'mtnbike.svg',   // Mountain Biking
    13 => 'picnic.svg',    // Picnicking
    14 => '',              // Races & Competitions
    15 => 'sled.svg',      // Sledding
    16 => 'snowshoe.svg',  // Snowshoeing
    17 => '',              // Tobogganing
    18 => 'leafman.svg',   // Rope Courses & Zip Lines
    19 => 'geology.svg',   // Exploring Nature
    20 => 'history.svg',   // Exploring Culture & History
    21 => 'dine.svg',      // Dining
    22 => '',              // Classes, Workshops, & Lectures
    23 => '',              // Special Events & Programs
    24 => '',              // Concerts & Movies
    25 => 'fitness.svg',   // Fitness Circuit
    26 => '',              // Disc Golf
    30 => 'golf.svg',      // Golfing
    39 => 'fitness.svg',   // Exercising
    41 => '',              // FootGolf
);

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Get activity types and icons
 *
 * @param $chosen_only: whether to filter by our sub-set of chosen activities.
 */
function getActivityTypesAndIcons($chosen_only=FALSE) {
    $activity_types = new ActivityType();
    $activity_types->order_by('pagetitle')->get();

    $output = array();

    foreach($activity_types as $activity) {
        if ($chosen_only && !in_array($activity->pagetitle, $activity->chosen_activities)) {
            continue;
        }
        $record = array(
            'title' => $activity->pagetitle,
            'icon' => $activity_types->getActivityIconByID($activity->eventactivitytypeid)
        );
        $output[$activity->eventactivitytypeid] = $record;
    }

    return $output;
}

/**
 * Get activity icon by ID
 */
function getActivityIconByID($id) {
    if (!empty($this->activity_type_icons_by_id[$id])) {
        return $this->activity_type_icons_by_id[$id];
    }
}

/**
 * Get activities by ID
 *
 * @param $ids: Activity ID or array of same.
 */
function getActivitiesByID($ids) {
    if (!is_array($ids)) {
        $ids = array($ids);
    }

    $this
        ->where_in('eventactivitytypeid', $ids)
        ->get();

    // Populate the "icon" property of each of our activities.
    foreach ($this as $activity) {
        $activity->icon = $this->getActivityIconByID($activity->eventactivitytypeid);
    }
}



}

/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_gisactivitytype (
  eventactivitytypeid integer,
  icon varchar(255),
  phone varchar(255),
  pagetitle varchar(255),
  pagedescription varchar(2000),
  pagethumbnail varchar(255),
  PRIMARY KEY(eventactivitytypeid)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisactivitytype TO trails;

*/