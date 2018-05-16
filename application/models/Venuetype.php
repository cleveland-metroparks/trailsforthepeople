<?php

/**
 * Venue Type data model
 */
class VenueType extends DataMapper {

var $table    = 'view_cmp_gisvenuetype';

function __construct($id = NULL) {
    parent::__construct($id);
}

}


/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_gisvenuetype (
  venuetypeid integer,
  name varchar(255),
  PRIMARY KEY(venuetypeid)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_gisvenuetype TO trails;

*/