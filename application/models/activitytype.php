<?php

/**
 * Activity Type data model
 */
class ActivityType extends DataMapper {

var $table    = 'view_cmp_gisactivitytype';

var $chosen_activities = array(
	'Swimming',
	'Boating & Paddlesports',
	'Hiking & Walking',
	'Fishing & Ice Fishing',
	'Archery',
	'Horseback Riding',
	'Mountain Biking',
	'Picnicking',
	'Sledding',
	'Tobogganing',
	'Exploring Nature',
	'Exploring Culture & History',
	'Dining',
	//'Fitness Circuit',
	//'Exercising',
);
// @TODO: Move this into the DB:
var $activity_type_icons_by_name = array(
	'Biking & Cycling' => '',
	'Swimming' => 'swimming.svg',
	'Boating & Paddlesports' => 'boating.svg',
	'Hiking & Walking' => '',
	'Fishing & Ice Fishing' => 'fishing.svg',
	'Archery' => '../../wms/pois/archery.png',
	'Cross-Country Skiing' => '',
	'Geocaching' => '',
	'Horseback Riding' => '../../wms/pois/horse.png',
	'Mountain Biking' => 'mtnbiking.svg',
	'Picnicking' => 'picnic.svg',
	'Races & Competitions' => '',
	'Sledding' => 'sledding.svg',
	'Snowshoeing' => '',
	'Tobogganing' => '',
	'Rope Courses & Zip Lines' => '',
	'Exploring Nature' => '../../wms/pois/nature.png',
	'Exploring Culture & History' => '../../wms/pois/history.png',
	'Dining' => 'dining.svg',
	'Classes, Workshops, & Lectures' => '',
	'Special Events & Programs' => '',
	'Concerts & Movies' => '',
	'Fitness Circuit' => '',
	'Disc Golf' => '',
	'Golfing' => 'golfing.svg',
	'Exercising' => '',
	'FootGolf' => ''
);
var $activity_type_icons_by_id = array(
	01 => '',
	02 => 'swimming.svg',
	03 => 'boating.svg',
	04 => '',
	05 => 'fishing.svg',
	06 => '../../wms/pois/archery.png',
	07 => '',
	09 => '',
	11 => '../../wms/pois/horse.png',
	12 => 'mtnbiking.svg',
	13 => 'picnic.svg',
	14 => '',
	15 => 'sledding.svg',
	16 => '',
	17 => '',
	18 => '',
	19 => '../../wms/pois/nature.png',
	20 => '../../wms/pois/history.png',
	21 => 'dining.svg',
	22 => '',
	23 => '',
	24 => '',
	25 => '',
	26 => '',
	30 => 'golfing.svg',
	39 => '',
	41 => ''
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
 * Get activity icon by name
 */
function getActivityIconByName($activity_type) {
	if (!empty($this->activity_type_icons_by_name[$activity_type])) {
		return $this->activity_type_icons_by_name[$activity_type];
	} else if (!empty($this->activity_type_icons_old[$activity_type])) {
		return $this->activity_type_icons_old[$activity_type];
	} else {
		// @TODO: Make a default icon
	}
}

/**
 * Get activity icon by ID
 */
function getActivityIconByID($id) {
	if (!empty($this->activity_type_icons_by_id[$id])) {
		return $this->activity_type_icons_by_id[$id];
	} else {
		// @TODO: Make a default icon
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