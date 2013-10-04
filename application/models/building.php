<?php class Building extends DataMapper {

var $table    = 'cm_buildings';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('name');


function __construct($id = NULL) {
    parent::__construct($id);
}


// given a WSEN bounding box in WGS84, return 1 feature matching that bbox
function getByBBOX($w,$s,$e,$n) {
    /*
    // this data type is a polygon, so we do a containment search for the bbox's center
    $geom = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)",
        ($w + $e) / 2.0, ($n + $s) / 2.0
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Contains(geom,$geom) LIMIT 1");
    */

    // we're lazy and impatient, so a simple bounding box containment works
    // and it gets us approximate matches, so you don't need the dexterity of a sniper to click it
    $geom = sprintf("ST_Transform(ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326),3734)",
        $w, $s,
        $w, $n,
        $e, $n,
        $e, $s,
        $w, $s
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE geom && $geom LIMIT 1");

    $row = $row->row();
    return $row;
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
    $table   = "cm_buildings";
    $rows    = $this->db->query("SELECT *,ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?)", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}


}