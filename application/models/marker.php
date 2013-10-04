<?php class Marker extends DataMapper {

var $table    = 'markers';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('created');


function __construct($id = NULL) {
    parent::__construct($id);
}



// given a WSEN bounding box in WGS84, return 1 feature matching that bbox
function getByBBOX($w,$s,$e,$n) {
    $geom = sprintf("ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326)",
        $w, $s,
        $w, $n,
        $e, $n,
        $e, $s,
        $w, $s
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE geom && $geom AND enabled=1 LIMIT 1");
    //$row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Intersects(geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}


}