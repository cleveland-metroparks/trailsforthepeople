<?php

/**
 * Beach Closure data model
 */
class BeachClosure extends DataMapper {

var $table    = 'view_cmp_gisbeachclosures';

function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Get all beaches closure info (includes all beaches whether open or closed).
 *
 * @return All beach closure data.
 */
function getBeachClosures() {
    $beach_closures = new BeachClosure();

    // Get all attractions first
    $beach_closures
        ->order_by('title')
        ->get();

    return $beach_closures;
}


}