<?php

/**
 * Amenity Type data model
 */
class AmenityType extends DataMapper {

var $table = 'view_cmp_gisamenitytype';
var $table_welcome_pane_choices = 'app_view_amenities';

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Get list of amenities to be used in Amenities listing from Welcome pane.
 */
function get_welcome_pane_amenities() {
    $amenities = new AmenityType();
    $sql = "
        SELECT DISTINCT amenitytypeid, name
        FROM $amenities->table_welcome_pane_choices;
    ";
    $results = $amenities->db->query($sql)->result();
    $output = (array)$results;

    return $output;
}

}


/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_gisamenitytype (
  amenitytypeid integer,
  name varchar(255),
  PRIMARY KEY(amenitytypeid)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisamenitytype TO trails;

*/