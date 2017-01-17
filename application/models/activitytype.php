<?php

/**
 * Activity Type data model
 */
class ActivityType extends DataMapper {

var $table    = 'view_cmp_gisactivitytype';

// @TODO: Move into DB
var $activity_type_icons_by_name = array(
	'Biking & Cycling' => '',
	'Swimming' => 'new/swimming.svg',
	'Boating & Paddlesports' => 'new/boating.svg',
	'Hiking & Walking' => '',
	'Fishing & Ice Fishing' => 'new/fishing.svg',
	'Archery' => 'archery.png',
	'Cross-Country Skiing' => '',
	'Geocaching' => '',
	'Horseback Riding' => 'horse.png',
	'Mountain Biking' => 'new/mtnbiking.svg',
	'Picnicking' => 'new/picnic.svg',
	'Races & Competitions' => '',
	'Sledding' => 'new/sledding.svg',
	'Snowshoeing' => '',
	'Tobogganing' => '',
	'Rope Courses & Zip Lines' => '',
	'Exploring Nature' => 'nature.png',
	'Exploring Culture & History' => 'history.png',
	'Dining' => 'new/dining.svg',
	'Classes, Workshops, & Lectures' => '',
	'Special Events & Programs' => '',
	'Concerts & Movies' => '',
	'Fitness Circuit' => '',
	'Disc Golf' => '',
	'Golfing' => 'new/golfing.svg',
	'Exercising' => '',
	'FootGolf' => ''
);
var $activity_type_icons_by_id = array(
	01 => '',
	02 => 'new/swimming.svg',
	03 => 'new/boating.svg',
	04 => '',
	05 => 'new/fishing.svg',
	06 => 'archery.png',
	07 => '',
	09 => '',
	11 => 'horse.png',
	12 => 'new/mtnbiking.svg',
	13 => 'new/picnic.svg',
	14 => '',
	15 => 'new/sledding.svg',
	16 => '',
	17 => '',
	18 => '',
	19 => 'nature.png',
	20 => 'history.png',
	21 => 'new/dining.svg',
	22 => '',
	23 => '',
	24 => '',
	25 => '',
	26 => '',
	30 => 'new/golfing.svg',
	39 => '',
	41 => ''
);

var $activity_type_icons_old = array(
    'Archery' => 'archery.png',
    'Beach' => 'beach.png',
    'Boating' => 'boat.png',
    'Drinking Fountain' => 'drinkingfountain.png',
    'Exploring Culture & History' => 'history.png',
    'Exploring Nature' => 'nature.png',
    'Facilities' => 'facility.png',
    'Fishing & Ice Fishing' => 'fish.png',
    'Food' => 'food.png',
    'Geologic Feature' => 'geology.png',
    'Golfing' => 'golf.png',
    'Horseback Riding' => 'horse.png',
    'Kayaking' => 'kayak.png',
    'Picnicking' => 'picnic.png',
    'Play Areas' => 'play.png',
    'Restroom' => 'restroom.png',
    'Sledding & Tobogganing' => 'sled.png',
    'Snowshoeing' => 'sled.png',
    'Swimming' => 'swim.png',
    'Viewing Wildlife' => 'wildlife.png',
);

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * List Activity Types
 */
function getActivityTypesAndIcons() {
    $activity_types = new ActivityType();
    $activity_types->order_by('pagetitle')->get();

    $output = array();

    foreach($activity_types as $activity) {
        $record = array(
            'title' => $activity->pagetitle,
            //'icon' => $activity_types->getActivityIconByName($activity->pagetitle)
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
		//return 'wildlife.png';
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
		//return 'wildlife.png';
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