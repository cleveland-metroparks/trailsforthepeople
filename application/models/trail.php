<?php class Trail extends DataMapper {
/* The data in cm_trails (the Trailpiece model) is not wholly suitable for display to end users.
   For display in listings and search results, we want trails aggregated by name, accounting for the & format for trails which mingle,
   and for the separated-out names to have geometries representing the entirety of the trail. For instance, Hemlock Loop Trail should appear only
   once and its bounding box should encompass other segments such as Hemlock Loop Trail & Bridle Trail, and Lake View Loop & Hemlock Loop Trail
   This requires significant preprocessing of the data: see  http://maps.clemetparks.com/administration/aggregate_trails/
 */

var $table    = 'trails_fixed';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('name');


function __construct($id = NULL) {
    parent::__construct($id);
}


function listByUseTypeAndDifficulty($usetype=null,$difficulty=null,$paved=null) {
    // supported $usetype values: hike, bike, bridle. These must match the column name exactly
    // supported $difficulty values: null/unspecified, Novice, Beginner, Intermediate, Advanced
    // supported $paved values: null/unspecified, Yes, No

    // make the fetch, then collect them into a flat list
    $trails  = new Trail();
    if ($paved) $trails->like('paved',$paved);
    if ($usetype) $trails->like('uses',$usetype);
    if ($difficulty) $trails->like('difficulty',$difficulty);
    $trails->order_by('name')->get();

    // it's already sorted, so we're fine; return the recordset
    return $trails;
}


// given a string of keywords, run a fulltext search and return a list of results
// if no matches, returns an array with nothing in it
function searchByKeywords($keywordstring) {
    // first off, standardize the $keywordstring into a TSVector expression without wierd characters
    $tsvector = preg_replace('/[^\w\s]/', '', trim($keywordstring) );
    $tsvector = preg_split('/\s+/', $tsvector);
    $tsvector = implode(' & ', $tsvector);

    // the tsvector normalization flag: 12 = 8 (divide by number of words) + 4 (closeness of words)
    $tsvector_norm_flag = 12;

    // run the tsvector DB query to generate a list of results
    $results = array();
    $table   = "trails_fixed";
    $rows    = $this->db->query("SELECT *, ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?) ORDER BY rank DESC", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}


// search for a trail based on reservation name
function findByReservation($resname) {
    // make the fetch, collect them into a flat list
    $trails  = new Trail();
    $trails->like('reservations',$resname);
    $trails->order_by('name')->get();

    // it's already sorted, so we're fine; return the recordset
    return $trails;
}



// fetch all Trailpiece objects that are part of this Trail
// not implemented; no need for this
function getPieces() {
    return null;
}


}