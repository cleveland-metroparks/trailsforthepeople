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
 *
 * @return array
 *   Array of amenitites, each in the form:
 *   id => ['title' => title, 'icon' => icon]
 */
function get_welcome_pane_amenities() {
    $amenities = new AmenityType();
    $sql = "
        SELECT DISTINCT amenitytypeid, name
        FROM $amenities->table_welcome_pane_choices;
    ";
    $results = $amenities->db->query($sql)->result();

    $output = array();
    foreach($results as $amenity) {
        $record = array(
            'title' => $amenity->name,
            'icon' => AmenityType::get_icon_name_for_amenity($amenity->amenitytypeid),
        );
        $output[$amenity->amenitytypeid] = $record;
    }

    return $output;
}

/**
 * Get the icon name (from our icon font) for an amenity.
 *
 * @param int $amenity_id
 *
 * @return string
 */
function get_icon_name_for_amenity($amenity_id) {
    // @TODO: Move this into the DB
    $amenity_icons = array(
        221 => 'baseball',     // Ball Field
        231 => 'basketball',   // Basketball Court
        280 => 'boat_rental',  // Boat Rentals
        14  => 'drink',        // Drinking Fountain
        243 => 'playground',   // Play Area
        13  => 'restroom',     // Restrooms
        28  => 'gifts',        // Shopping/Souvenirs
        240 => 'volleyball',   // Volleyball Courts
    );
    return $amenity_icons[$amenity_id];
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