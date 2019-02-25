<?php class Trailpiece extends DataMapper {
/* This class queries the cm_trails table, which is the raw trail segments rendered via GeoServer.
   It is primarily used for click-queries.
   The Trail class is different, being more focused on unique trail names, aggregated extents for a whole trail, etc.
 */

var $table    = 'cm_trails';
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
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE geom && $geom AND for_show='Yes' LIMIT 1");
    //$row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Intersects(geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}


// search for any Trailpiece segments which fit the given $trailname
// This accounts for the + convention in the trail names, and will search for + NAME, NAME +, + NAME +, etc.
// Note that this is case-sensitive, and must be an exact Trail name: "yellow" will not match "Yellow Trail"
public static function getByName($trailname) {
    $results = new Trailpiece();
    $results->group_start();
    $results->where('label_name',$trailname);
    $results->or_like('label_name', "$trailname +");
    $results->or_like('label_name', "+ $trailname");
    $results->group_end();
    $results->get();
    return $results;
}



// this is used for routing; returns true/false indicating whether two trails are probably a continuation of each other
// based on their name. For instance, if the oldname is "Blackberry Trail + Connector Trail" and the newname is "Bridle Trail + Blackberry Trail"
// then this returns true because they share a name component in common.
// Primary usage is for aggregating routing steps despite trails mingling.
public static function trailContainsSameName($oldname,$newname) {
    if ($oldname == $newname) return true;

    $oldnames = explode(' + ', $oldname);
    $newnames = explode(' + ', $newname);
    return (boolean) sizeof(array_intersect($oldnames,$newnames));
}


// given a Trailpiece, compose a pretty list of the use types allowed on this segment
function getUsesString($trailpiece) {
    $uses = array();

    if ($trailpiece->hike == 'Yes') $uses[] = "Hiking";
    if ($trailpiece->bike == 'Yes') {
        $use = "Bicycling";
        if ($trailpiece->skill_cm) $use .= " ({$trailpiece->skill_cm})";
        $uses[] = $use;
    }
    if ($trailpiece->bridle == 'Yes') $uses[] = "Equestrian";

    return implode(", ", $uses);
}


// given a Trailpiece, find the Trail(s) that connect to it, return a list
function getFullTrails($trailpiece) {
    $gids = array();
    $gx = $this->db->query('SELECT trailgid FROM pieces_to_trails WHERE segmentgid=?', array($trailpiece->gid) );
    foreach ($gx->result() as $g) $gids[] = $g->trailgid;
    if (! sizeof($gids) ) return null;

    // fetch the Trails with these GIDs and return the recordset
    // again, stupid DataMapper ORM claims it can do this but in fact cannot
    $output = array();
    $trails = new Trail();
    $trails->where_in('gid',$gids)->order_by('name')->get();
    foreach ($trails as $t) $output[] = $t;

    return $output;
}


// given a Trailpiece, return the WKT of the geometry in WGS84 (EPSG:4326) coordinates
function getWKT($trailpiece) {
    $wkt = $this->db->query('SELECT ST_ASTEXT(ST_TRANSFORM(ST_Force_2D(geom),4326)) AS wkt FROM cm_trails WHERE gid=?', array($trailpiece->gid) );
    $wkt = $wkt->row();
    $wkt = $wkt->wkt;
    return $wkt;
}



}