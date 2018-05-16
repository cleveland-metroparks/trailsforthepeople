<?php class Trailclosure extends DataMapper {
/* This class queries the trail_closures table, which is segments of trail tagged as Closed.
   Also provided are methods for finding Loops and Trails which intersect these, so they can be tagged as being partly closed.
 */

var $table    = 'trail_closures';
var $has_one  = array();
var $has_many = array();


function __construct($id = NULL) {
    parent::__construct($id);
}



// given a WSEN bounding box in WGS84, return 1 feature matching that bbox
function getByBBOX($w,$s,$e,$n) {
    $geom = sprintf("ST_Transform(ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326),3734)",
        $w, $s,
        $w, $n,
        $e, $n,
        $e, $s,
        $w, $s
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE geom && $geom LIMIT 1");
    //$row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Intersects(geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}


}