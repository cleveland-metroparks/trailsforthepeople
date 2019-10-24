<?php

/**
 * Reservation data model
 *
 * Taking over from Park model.
 * moreinfo() type is 'reservation_new'
 *
 */
class Reservation extends DataMapper {

var $table    = 'view_cmp_gisreservations';

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * JOIN reservation_new & reservation_zoomlevel
 *
 * return results
 */
function get_reservations_with_zoomlevels() {
  $query = $this->db->query("
    SELECT r.*, z.zoomlevel FROM view_cmp_gisreservations r
    LEFT JOIN reservation_zoomlevel z ON
    r.record_id = z.reservation_id
    ORDER BY r.pagetitle ASC
  ");

  $results = array();
  foreach ($query->result() as $row) {
    $results[] = $row;
  }
  return $results;
}

/**
 * Get specified level to which we should zoom for reservation.
 * Uses reservation_zoomlevel table
 */
function get_zoomlevel($reservation_id) {
    $query = $this->db->query("SELECT zoomlevel FROM reservation_zoomlevel WHERE reservation_id = {$reservation_id}");
    if ($result_row = $query->row()) {
      return $result_row->zoomlevel;
    }
}

}


/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_gisreservations (
  record_id integer,
  src varchar(255),
  gis_id integer,
  pagetitle varchar(255),
  descr varchar(2000),
  activities varchar(255),
  pagethumbnail varchar(255),
  latitude varchar(255),
  longitude varchar(255),
  address1 varchar(255),
  address2 varchar(255),
  city varchar(255),
  state varchar(255),
  zip varchar(255),
  phone varchar(255),
  hoursofoperation varchar(255),
  drivingdestinationlatitude varchar(255),
  drivingdestinationlongitude varchar(255),
  northlatitude varchar(255),
  northlongitude varchar(255),
  southlatitude varchar(255),
  southlongitude varchar(255),
  eastlatitude varchar(255),
  eastlongitude varchar(255),
  westlongitude varchar(255),
  westlatitude varchar(255),
  PRIMARY KEY(record_id)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisreservations TO trails;

CREATE TABLE reservation_zoomlevel (
  reservation_id INTEGER PRIMARY KEY,
  zoomlevel float8
);
GRANT ALL PRIVILEGES ON TABLE reservation_zoomlevel TO trails;

*/