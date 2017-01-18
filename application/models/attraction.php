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
 * Get attractions by activity.
 *
 * @param $activity_id
 */
function getAttractionsByActivity($activity_id) {
    $attractions = new Attraction();

    $attractions
      ->where('activities', $activity_id)
      ->or_like('activities', "$activity_id|%")
      ->or_like('activities', "%|$activity_id")
      ->or_like('activities', "%|$activity_id|%")
      ->order_by('pagetitle')
      ->get();

    return $attractions;
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