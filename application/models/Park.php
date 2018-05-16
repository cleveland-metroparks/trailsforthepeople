<?php class Park extends DataMapper {

var $table    = 'reservation_boundaries_public_private_cm_dissolved';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('res');


function __construct($id = NULL) {
    parent::__construct($id);
}


// given a WSEN bounding box in WGS84, return 1 feature matching that bbox
function getByBBOX($w,$s,$e,$n) {
    // this data type is a rather large polygon, so we do a containment search for the bbox's center
    $geom = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)",
        ($w + $e) / 2.0, ($n + $s) / 2.0
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Contains(geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}


// an instance method to find the closest lat_driving and lng_driving to the stated latlng
// used by searchByKeywords() and probably others
function closestDrivingDestinationToLatLng($id,$lat,$lng) {
    $point = sprintf("ST_GEOMFROMTEXT('POINT(%f %f)',4326)", $lng, $lat );
    $dest = $this->db->query("SELECT lat,lng FROM driving_destinations WHERE reservation_id=? ORDER BY geom <-> ST_TRANSFORM($point,3734) LIMIT 1", array($id) )->row();

    // if we found one, update our own lat_driving and lng_driving from it
    if ($dest->lat) return $dest;
    return null;
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
    // for each result, find the closest driving latlng to the given point
    $results = array();
    $table   = "reservation_boundaries_public_private_cm_dissolved";
    $rows    = $this->db->query("SELECT *,ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?)", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}


// this should be called getByActivity but is kept getByCategory for historical reasons (too busy to clean up all the places it's used)
function getByCategory($category) {
    $results = array();

    $pois = new Park();
    $pois->get();
    foreach ($pois as $poi) {
        if (! $poi->activities) continue;
        foreach (explode("; ",$poi->activities) as $activity) {
            if ($activity == $category) { $results[] = $poi; break; }
        }
    }

    return $results;
}


}