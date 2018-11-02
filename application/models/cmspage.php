<?php class CMSPage extends DataMapper {
    ///// this class is a wrapper around the cms_points table, which itself is loaded via a cronjob from a remote XML feed at Cleveland's website CMS

var $table    = 'cms_pages';
var $default_order_by = array('feed','title');

function __construct($id = NULL) {
    parent::__construct($id);
}


function generateURLKey($string) {
    return substr(preg_replace('/[^\w\-]/', '-', strtolower($string) ),0,500);
}


// not a static function, but an object method; return a list of the features associated with this CMS Page (mixed type, varies with CMS Page's feed)
// most have only one, but some have zero, and an Activity page can have zero or many
function getPoints() {
    // fetch an iterator over the point-IDs
    // then iterate over them, using a switch to use the correct model & fieldname  (they're all different but at least unambiguous once you know which model)
    $records = $this->db->query('SELECT location_id FROM cms_page_points WHERE page_id=?', array($this->id) );
    $points  = array();

    switch ($this->feed) {
        case 'UseAreaPOI':
            // one single point, use row() and a simple gid match (except that it's the loc_id cuz it's what we had when we imported)
            $gid = $records->row();
            if (! $gid) return $points;
            $gid = $gid->location_id;
            $targets = new UseArea();
            $targets->where('loc_id',$gid)->get();
            break;
        case 'Trail':
            // one single point, use row() and a simple gid match
            $gid = $records->row();
            if (! $gid) return $points;
            $gid = $gid->location_id;
            $targets = new Trail();
            $targets->where('gid',$gid)->get();
            break;
        case 'Reservation':
            // may be multiple points (usually 1), use a where_in on the gid field
            $gids = array();
            foreach ($records->result() as $point) $gids[] = $point->location_id;
            if (! sizeof($gids) ) return $points;
            $targets = new Park();
            $targets->where_in('gid',$gids)->get();
            break;
        case 'ReservationActivity':
            // multiple points, use a where_in on the gid field
            $gids = array();
            foreach ($records->result() as $point) $gids[] = $point->location_id;
            if (! sizeof($gids) ) return $points;
            $targets = new UseArea();
            $targets->where_in('gid',$gids)->get();
            break;
        case 'Activity':
            // multiple points, use a where_in on the gid field
            $gids = array();
            foreach ($records->result() as $point) $gids[] = $point->location_id;
            if (! sizeof($gids) ) return $points;
            $targets = new UseArea();
            $targets->where_in('gid',$gids)->get();
            break;
    }

    // if we got here, we have an iterator; change it to an array so we have a consistent API
    foreach ($targets as $t) $points[] = $t;
    return $points;
}


// this is a wrapper to getPoints() which does a second round of processing, standardizing some field names 
// and converting the results to arrays, and keeping only fields that will be of interest to the CMS page
function getPointsforCMS() {
    $results = array();
    $points = $this->getPoints();
    if (! sizeof($points)) return $points; // nothing there, so we can skip out

    // depending on the model found here, set up the fieldnames
    switch ($points[0]->model) {
        case 'usearea':
            $title_field    = 'use_area';
            $text_field     = 'description';
            $image_field    = 'image_url';
            $exturl_field   = 'link';
            $calendar_field = 'cal_link';
            $qtype          = 'poi';
            $wkt_geom       = false;
            break;
        case 'trail':
            $title_field    = 'name';
            $text_field     = 'description';
            $image_field    = '';
            $exturl_field   = 'link';
            $calendar_field = '';
            $qtype          = 'trail';
            $wkt_geom       = true;
            break;
        case 'park':
            $title_field    = 'res';
            $text_field     = 'activities';
            $image_field    = '';
            $exturl_field   = 'link';
            $calendar_field = '';
            $qtype          = 'reservation';
            $wkt_geom       = true;
            break;
    }

    // now iterate over the points, remapping the fieldnames onto this standardized set
    foreach ($points as $point) {
        $result = array();
        $result['id']             = $point->gid ? $point->gid : $point->id;
        $result['type']           = $qtype;
        $result['lat']            = $point->lat;
        $result['lng']            = $point->lng;
        $result['boxw']           = $point->boxw;
        $result['boxs']           = $point->boxs;
        $result['boxe']           = $point->boxe;
        $result['boxn']           = $point->boxn;
        $result['title']          = $point->{$title_field};
        $result['description']    = $text_field     ? ( $point->{$text_field}     ? $point->{$text_field}     : '') : '';
        $result['imageurl']       = $image_field    ? ( $point->{$image_field}    ? $point->{$image_field}    : '') : '';
        $result['externalurl']    = $exturl_field   ? ( $point->{$exturl_field}   ? $point->{$exturl_field}   : '') : '';
        $result['calendarurl']    = $calendar_field ? ( $point->{$calendar_field} ? $point->{$calendar_field} : '') : '';
        $result['mapquerystring'] = "type=$qtype&name={$result['title']}";

        // special case: for some feature types we also include the full WKT for vector rendering
        if ($wkt_geom) $result['wkt'] = $point->wkt;

        $results[] = $result;
    }

    return $results;
}


}
