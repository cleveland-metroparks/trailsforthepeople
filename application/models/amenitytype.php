<?php

/**
 * Amenity Type data model
 */
class AmenityType extends DataMapper {

var $table    = 'view_cmp_gisamenitytype';

function __construct($id = NULL) {
    parent::__construct($id);
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