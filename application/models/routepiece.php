<?php class Routepiece extends DataMapper {
/* This class is primarily used for click-query by the admin when debugging routes.
   It queries the routing_trails table, as opposed to the cm_trails which is used for map display.
   Still, the trails correspond tightly since the routing_trails are derived from routing_trails.
   The resulting recordsets from Routepiece contain more routing-related stuff, as opposed to descriptions etc. from cm_trails or listing_trails
 */

var $table    = 'routing_trails';
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
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Intersects(the_geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}

}