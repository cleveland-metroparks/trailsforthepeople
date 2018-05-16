<?php

/**
 * Category data model
 */
class Category extends DataMapper {

var $table    = 'view_cmp_giscategories';

function __construct($id = NULL) {
    parent::__construct($id);
}

}


/**

Schema creation
(@TODO: move this into migration routines.)
---------------

CREATE TABLE IF NOT EXISTS view_cmp_giscategories (
  categorytypeid integer,
  name varchar(255),
  PRIMARY KEY(categorytypeid)
);
GRANT ALL PRIVILEGES ON TABLE view_cmp_giscategories TO trails;

*/