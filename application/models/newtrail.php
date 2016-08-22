<?php class Newtrail extends DataMapper {

var $table    = 'trails';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('name');

function __construct($id = NULL) {
    parent::__construct($id);
}


function getPublicNewtrails() {
    $trails = new Newtrail();
    $trails->where('status','Published');

    // add the date filter: either no expiration at all, or an expiration in the future
    $today = date('Y-m-d');
    $trails->group_start();
    $trails->or_where('expires',NULL);
    $trails->or_where('expires >',$today);
    $trails->group_end();

    $trails->get();

    return $trails;
}


function useTypesString($trail) {
    // merge the yes/no use types into a single comma-joined list of use types
    $uses = array();
    if (strtolower(trim($trail->bike))   == 'yes') $uses[] = "Bicycle";
    if (strtolower(trim($trail->hike))   == 'yes') $uses[] = "Hiking";
    if (strtolower(trim($trail->bridle)) == 'yes') $uses[] = "Equestrian";

    // merge them with commas
    $uses = implode(", ",$uses);

    return $uses;
}


// given a string of keywords, run a fulltext search and return a list of results
// if no matches, returns an array with nothing in it
function searchByKeywords($keywordstring,$unpublished=FALSE) {
    // first off, standardize the $keywordstring into a TSVector expression without wierd characters
    $tsvector = preg_replace('/[^\w\s]/', '', trim($keywordstring) );
    $tsvector = preg_split('/\s+/', $tsvector);
    $tsvector = implode(' & ', $tsvector);

    // the tsvector normalization flag: 12 = 8 (divide by number of words) + 4 (closeness of words)
    $tsvector_norm_flag = 12;

    // extra filtering flags
    if (!$unpublished) $pubclause = "AND status='Published'";

    // run the tsvector DB query to generate a list of results
    $results = array();
    $table   = "trails";
    $rows    = $this->db->query("SELECT *,ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?) $pubclause", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}




// functions for finding Newtrails and Reservations
// using the goofy ;- delimited list of reservations

function listReservations($include_unpublished=false) {
    // do we filter by published=true ?
    $publishedclause = "";
    if (!$include_unpublished) $publishedclause = "WHERE trailid IN (SELECT id FROM trails WHERE status='Published')";

    // we ditch the ORM for a moment, and do a distinct query on a table not addressed by DataMapper
    $reservations = array();
    $ress = $this->db->query("SELECT DISTINCT reservation FROM trails_reservations $publishedclause ORDER BY reservation");
    foreach ($ress->result() as $res) $reservations[] = $res->reservation;

    return $reservations;
}

function getByReservation($reservation,$include_unpublished=false) {
    // do we filter by published=true ?
    $publishedclause = "";
    if (!$include_unpublished) $publishedclause = " status='Published' AND ";

    // we ditch the ORM for a moment; the relation of reservations to trails is outside of DataMapper
    $trails = array();
    $trailss = $this->db->query("SELECT * FROM trails WHERE $publishedclause id in (SELECT trailid FROM trails_reservations WHERE reservation=?) ORDER BY name", array($reservation) );
    foreach ($trailss->result() as $trail) $trails[] = $trail;

    // done
    return $trails;
}

// return an assocarray of Reservation name => list of Newtrails
function getReservationListing($include_unpublished=false) {
    $output = array();

    foreach (Newtrail::listReservations($include_unpublished) as $reservation) {
        $output[$reservation] = array();
        foreach (Newtrail::getByReservation($reservation,$include_unpublished) as $trail) {
            $output[$reservation][] = $trail;
        }
    }

    return $output;
}

// unlike the others, a real instance method
// return a list of the Reservations which this Newtrail touches
public function reservationsWhichIIntersect() {
    $reservations = array();
    $rx = $this->db->query('SELECT DISTINCT reservation FROM trails_reservations WHERE trailid=? ORDER BY reservation', array($this->id) );
    foreach ($rx->result() as $r) $reservations[] = $r->reservation;

    return $reservations;
}

}
