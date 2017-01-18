<?php

/**
 * Activity Type data model
 */
class ActivityType extends DataMapper {

var $table    = 'view_cmp_gisactivitytype';

var $chosen_activities = array(
    'Archery',
    'Biking & Cycling',
    'Boating & Paddlesports',
    'Cross-Country Skiing',
    'Dining',
    //'Exercising',
    'Exploring Culture & History',
    'Exploring Nature',
    'Fishing & Ice Fishing',
    //'Fitness Circuit',
    'Geocaching',
    'Golfing',
    'Hiking & Walking',
    'Horseback Riding',
    'Mountain Biking',
    'Picnicking',
    'Rope Courses & Zip Lines',
    'Sledding',
    'Snowshoeing',
    'Swimming',
    'Tobogganing',
);
// @TODO: Move this into the DB
var $activity_type_icons_by_id = array(
    01 => '',              // Biking & Cycling
    02 => 'swim.svg',      // Swimming
    03 => 'boat.svg',      // Boating & Paddlesports
    04 => 'hike.svg',      // Hiking & Walking
    05 => 'fish.svg',      // Fishing & Ice Fishing
    06 => 'archery.svg',   // Archery
    07 => '',              // Cross-Country Skiing
    09 => '',              // Geocaching
    11 => 'horse.svg',     // Horseback Riding
    12 => 'mtnbike.svg',   // Mountain Biking
    13 => 'picnic.svg',    // Picnicking
    14 => '',              // Races & Competitions
    15 => 'sled.svg',      // Sledding
    16 => '',              // Snowshoeing
    17 => '',              // Tobogganing
    18 => '',              // Rope Courses & Zip Lines
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