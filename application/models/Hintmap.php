<?php

/**
 * Hint Map data model
 */

class HintMap extends DataMapper {

var $table    = 'hint_maps';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('title');

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Return absolute path to local image on filesystem.
 */
public function local_file_path() {
    $local_file_path = $this->config->item('hint_maps_dir') . '/' . $this->image_filename_local;
    return $local_file_path;
}

/**
 * Return URL to local image.
 *
 * @param $absolute: Whether to return an absolute or relative URL. 
 */
public function local_image_url($absolute=FALSE) {
	$url_path = $this->config->item('hint_maps_dir_rel') . '/' . $this->image_filename_local;

	if ($absolute) {
		return ssl_url($url_path);
	} else {
		return $url_path;
	}
}

public function hint_url($absolute=FALSE) {
	$url_path = 'hint/' . $this->id;

	if ($absolute) {
		return ssl_url($url_path);
	} else {
		return $url_path;
	}
}



}


/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS hint_maps (
  id serial,
  title varchar(100),
  image_filename_local varchar(255),
  last_edited TIMESTAMP DEFAULT current_timestamp,
  last_refreshed TIMESTAMP DEFAULT current_timestamp,
  url_external VARCHAR(2083),
  PRIMARY KEY(id)
);
GRANT ALL PRIVILEGES ON TABLE hint_maps TO trails;
GRANT ALL PRIVILEGES ON SEQUENCE hint_maps_id_seq TO trails;

 */