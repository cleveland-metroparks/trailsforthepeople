<?php class Loop extends DataMapper {

var $table    = 'loops';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('name');

function __construct($id = NULL) {
    parent::__construct($id);
}


function getPublicLoops() {
    $loops = new Loop();
    $loops->where('status','Published');

    // add the date filter: either no expiration at all, or an expiration in the future
    $today = date('Y-m-d');
    $loops->group_start();
    $loops->or_where('expires',NULL);
    $loops->or_where('expires >',$today);
    $loops->group_end();

    $loops->get();

    return $loops;
}


function useTypesString($loop) {
    // merge the yes/no use types into a single comma-joined list of use types
    $uses = array();
    if (strtolower(trim($loop->bike))   == 'yes') $uses[] = "Bicycle";
    if (strtolower(trim($loop->hike))   == 'yes') $uses[] = "Hiking";
    if (strtolower(trim($loop->bridle)) == 'yes') $uses[] = "Equestrian";

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
    $table   = "loops";
    $rows    = $this->db->query("SELECT *,ts_rank_cd(search,to_tsquery(?),$tsvector_norm_flag) AS rank FROM $table WHERE search @@ to_tsquery(?) $pubclause", array($tsvector,$tsvector) );
    foreach ($rows->result() as $r) $results[] = $r;

    // done
    return $results;
}




// functions for finding Loops and Reservations
// using the goofy ;- delimited list of reservations

function listReservations($include_unpublished=false) {
    // do we filter by published=true ?
    $publishedclause = "";
    if (!$include_unpublished) $publishedclause = "WHERE loopid IN (SELECT id FROM loops WHERE status='Published')";

    // we ditch the ORM for a moment, and do a distinct query on a table not addressed by DataMapper
    $reservations = array();
    $ress = $this->db->query("SELECT DISTINCT reservation FROM loops_reservations $publishedclause ORDER BY reservation");
    foreach ($ress->result() as $res) $reservations[] = $res->reservation;

    return $reservations;
}

function getByReservation($reservation,$include_unpublished=false) {
    // do we filter by published=true ?
    $publishedclause = "";
    if (!$include_unpublished) $publishedclause = " status='Published' AND ";

    // we ditch the ORM for a moment; the relation of reservations to loops is outside of DataMapper
    $loops = array();
    $loopss = $this->db->query("SELECT * FROM loops WHERE $publishedclause id in (SELECT loopid FROM loops_reservations WHERE reservation=?) ORDER BY name", array($reservation) );
    foreach ($loopss->result() as $loop) $loops[] = $loop;

    // done
    return $loops;
}

// return an assocarray of Reservation name => list of Loops
function getReservationListing($include_unpublished=false) {
    $output = array();

    foreach (Loop::listReservations($include_unpublished) as $reservation) {
        $output[$reservation] = array();
        foreach (Loop::getByReservation($reservation,$include_unpublished) as $loop) {
            $output[$reservation][] = $loop;
        }
    }

    return $output;
}

// unlike the others, a real instance method
// return a list of the Reservations which this Loop touches
public function reservationsWhichIIntersect() {
    $reservations = array();
    $rx = $this->db->query('SELECT DISTINCT reservation FROM loops_reservations WHERE loopid=? ORDER BY reservation', array($this->id) );
    foreach ($rx->result() as $r) $reservations[] = $r->reservation;

    return $reservations;
}

}
