<?php class Usearea extends DataMapper {

var $table    = 'cm_use_areas';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('use_area');


function __construct($id = NULL) {
    parent::__construct($id);
}



// get a list of all of the categories, as displayed in the ;-separated fields
function listCategories() {
    // the final list of categories (err, I mean activities)
    // it becomes an associative array to enforce uniqueness, then a flat list
    $activities = array();

    // iterate, split, capture
    $pois = new Usearea();
    $pois->get();
    foreach ($pois as $poi) {
        if (! $poi->activity) continue;
        foreach (explode("; ",$poi->activity) as $activity) $activities[trim($activity)] = TRUE;
    }

    $activities = array_keys($activities);
    sort($activities);
    return $activities;
}


// this should be called getByActivity but is kept getByCategory for historical reasons (too busy to clean up all the places it's used)
function getByCategory($category) {
    $results = array();

    $pois = new Usearea();
    $pois->get();
    foreach ($pois as $poi) {
        if (! $poi->activity) continue;
        foreach (explode("; ",$poi->activity) as $activity) {
            if ($activity == $category) { $results[] = $poi; break; }
        }
    }

    return $results;
}

function getByReservation($resname) {
    $results = array();

    $pois = new Usearea();
    $pois->where('reservation',$resname)->get();
    foreach ($pois as $poi) $results[] = $poi;

    return $results;
}

// get a list organized by activity, e.g.  activity-string => [ usearea, usearea, usearea, ... ]
// it's likely that a Usearea will be listed multiple times over multiple activities
// this is primari;ly for the mobile.php::map() and desktop.php::map() functions, for rendering hierarchical lists
function getCategorizedListing() {
    $pois = new Usearea();
    $pois->get();

    foreach ($pois as $poi) {
        if (! $poi->activity) continue;
        foreach (explode("; ",$poi->activity) as $activity) {
            if (! @$output[$activity]) $data['pois'][$activity] = array();
            $output[$activity][] = $poi;
        }
    }

    ksort($output);
    return $output;
}


// get a list organized by reservation, e.g.  resname => [ usearea, usearea, usearea, ... ]
// unlike the activities, a POI Usearea is located in only one reservation
// this is primarily for the mobile.php::map() and desktop.php::map() functions, for rendering hierarchical lists
function getReservationListing() {
    $pois = new Usearea();
    $pois->get();

    foreach ($pois as $poi) {
        if (! $poi->reservation) continue;
        if (! @$output[ $poi->reservation ]) $data['pois'][ $poi->reservation ] = array();
        $output[ $poi->reservation ][] = $poi;
    }

    ksort($output);
    return $output;
}


// given a WSEN bounding box in WGS84, return 1 feature matching that bbox
// although Use Areas are polygons, we want to treat them as points and do a containment test on the centroid (lat, lng fields)
// otherwise we get a correct but unexpected result, of clicking an inch away from a map marker and still getting the picnic area
/*
function getByBBOX($w,$s,$e,$n) {
    // this data type is a rather large polygon, so we do a containment search for the bbox's center
    $geom = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)",
        ($w + $e) / 2.0, ($n + $s) / 2.0
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Contains(geom,$geom) LIMIT 1");
    $row = $row->row();
    return $row;
}
 */
function getByBBOX($w,$s,$e,$n) {
    $geom = sprintf("ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326)",
        $w, $s,
        $w, $n,
        $e, $n,
        $e, $s,
        $w, $s
    );
    $row = $this->db->query("SELECT * FROM {$this->table} WHERE ST_Contains($geom, ST_SetSrid(ST_MakePoint(lng,lat),4326)) LIMIT 1");
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
    $table   = "cm_use_areas";
    $rows    = $this->db->query("SELECT *,ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?)", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}


function searchNearby($lat,$lng,$meters,$categories=array()) {
    // build the distance query into the first pass, as it will eliminate the huge majority of points
    // and bypass the ORM so we can get some better performance
    $results = array();

    // $lat and $lng and $meters are cast here, in case the caller forgot
    // $categories is a list of activity names, and should exactly match those used in the database
    $lng    = (float) $lng;
    $lat    = (float) $lat;
    $meters = (float) $meters;
    $table  = "cm_use_areas";
    $px = $this->db->query("SELECT * FROM $table WHERE ST_DISTANCE(geom,ST_TRANSFORM(ST_GEOMFROMTEXT('POINT($lng $lat)',4326),3734)) <= $meters");
    foreach ($px->result() as $poi) {
        //$matches = array_intersect( explode("; ",$poi->activity) , $categories );
        //if (! sizeof($matches) ) continue;
        $results[] = $poi;
    }

    return $results;
}


}
