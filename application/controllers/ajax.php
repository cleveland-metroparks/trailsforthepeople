<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Ajax extends CI_Controller {

/*
 This controller provides the common AJAX-esque handlers (actually AJAJ) for requesting data such
 as trail info or performing searches or requesting routes. It doesn't make much use of views,
 but uses json_encode() a lot.
*/

/**
 * Geocode
 *
 * @param address
 * @param bing_key
 * @param bbox
 */
function geocode() {
    $url = sprintf("http://dev.virtualearth.net/REST/v1/Locations?query=%s&output=json&key=%s&userMapView=%s",
        rawurlencode($_GET['address']),
        rawurlencode($_GET['bing_key']),
        rawurlencode($_GET['bbox'])
    );

    $reply = file_get_contents($url);
    if (empty($reply)) {
        return;
    }
    $decoded_reply = json_decode($reply);
    $results = $decoded_reply->resourceSets[0]->resources;
    if (! sizeof($results)) return;

    $result = array();
    $result['lat'] = $results[0]->geocodePoints[0]->coordinates[0];
    $result['lng'] = $results[0]->geocodePoints[0]->coordinates[1];
    $result['title'] = $results[0]->name;
    $result['w'] = $results[0]->bbox[1];
    $result['s'] = $results[0]->bbox[0];
    $result['e'] = $results[0]->bbox[3];
    $result['n'] = $results[0]->bbox[2];

    print json_encode($result);
}

/**
 * Geocode for directions
 *
 * @param type
 * @param gid
 * @param lat
 * @param lng
 * @param via
 *
 * @return JSON-encoded object of 3 fields:
 *     The lat and lng of the target location, and
 *     a description of what the point is, for debugging.
 */
function geocode_for_directions() {
    $output = array();

    switch ($_GET['type']) {

        case 'poi':
            $result = new Usearea();
            $result->where('gid',$_GET['gid'])->get();
            switch (@$_GET['via']) {
                case 'car':
                    $output['lat']  = (float) $result->lat_driving;
                    $output['lng']  = (float) $result->lng_driving;
                    $output['type'] = 'driving';
                    break;
                default:
                    $output['lat']  = (float) $result->lat;
                    $output['lng']  = (float) $result->lng;
                    $output['type'] = 'actual';
                    break;
            }
            break;

        case 'trail':
            $result   = new Trail();
            $result->where('gid',$_GET['gid'])->get();
            $output['lat']  = (float) $result->lat_driving;
            $output['lng']  = (float) $result->lng_driving;
            $output['type'] = 'driving';
            break;

        case 'reservation':
            $result = new Park();
            $result->where('gid',$_GET['gid'])->get();
            $output['lat']  = (float) $result->lat_driving;
            $output['lng']  = (float) $result->lng_driving;
            $output['type'] = 'driving';

            // find the closest driving_lat driving_lng to the given coordinates, replace the ones stored in the reservation itself
            $driving_latlng = Park::closestDrivingDestinationToLatLng($result->reservation_id,$_GET['lat'],$_GET['lng']);
            if ($driving_latlng) {
                $output['lat']  = (float) $driving_latlng->lat;
                $output['lng']  = (float) $driving_latlng->lng;
                $output['type'] = sprintf("nearest to %f %f", $_GET['lat'], $_GET['lng'] );
            }
            break;

        case 'attraction':
            $result = new Attraction();
            $result->where('gis_id', $_GET['gid'])->get();
            $output['lat']  = (float) $result->drivingdestinationlatitude;
            $output['lng']  = (float) $result->drivingdestinationlongitude;
            $output['type'] = 'driving';
            break;

        // These don't have gis_ids:
        // case 'reservation_new':
        //     break;
    }

    print json_encode($output);
}

/**
 * Query
 *
 * @param zoom
 * @param n
 * @param s
 * @param e
 * @param w
 * @param wkt
 */
function query() {
    $result = null; // yes, the first one is an "if" against a known null; enhances readability when we want to bump something up the priority list
    $moreinfo = null; // any additional info beyond the $result, usually nothing

    // the zoom level is used to enable/disable query of some features,
    // e.g. to query a Use Area, must be in close enough that you can see them (14+)
    $zoom = @$_GET['zoom'] ? $_GET['zoom'] : 18;

    if (! $result and $zoom >= 15) {
        $result = new Marker();
        $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);
        $template = 'ajax/query_marker.phtml';
    }
    if (! $result and $zoom >= 15) {
        $result = new Usearea();
        $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);
        $template = 'ajax/query_usearea.phtml';
    }
    if (! $result and $zoom >= 17) {
        $result = new Trailclosure();
        $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);
        $template = 'ajax/query_trailclosure.phtml';
    }
    if (! $result and $zoom >= 17) {
        // this one is more complicated: the Trailpiece may have named trails associated with it, in which case we use them instead of reporting the segment actually clicked
        $result = new Trailpiece();
        $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);
        $template = 'ajax/query_trailpiece.phtml';

        if ($result) {
            // add the list of full trails that contain this segment
            $trails = Trailpiece::getFullTrails($result);
            if ($trails) {
                $moreinfo = $trails;
                $template = 'ajax/query_trail.phtml';
            }

            // add the WKT if requested
            $result->wkt = @$_GET['wkt'] ? Trailpiece::getWKT($result) : '';
        }
    }
    if (! $result and $zoom >= 18) { //avoid Reservation pop-up
        $result = new Park();
        $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);
        $template = 'ajax/query_reservation.phtml';
    }

    // found nothing? bail silently
    if (! $result) return;

    // okay, so we found something. this hack fakes the point-location of the feature, to be the point that was clicked
    // this is used to anchor the infobubble
    $result->lng = ( $_GET['w'] + $_GET['e'] ) / 2.0;
    $result->lat = ( $_GET['s'] + $_GET['n'] ) / 2.0;

    // load its template to produce HTML
    // yeah, it's not JSON and AJAX but we're hitting the limits of that sort of hijinks when it comes to layouts
    $this->load->view($template, array('feature'=>$result, 'moreinfo'=>$moreinfo) );
}

/**
 * Keyword
 *
 * @param keyword
 * @param type
 * @param limit
 * @param lat
 * @param lng
 */
function keyword() {
    $results = array();

    // the keyword for matching searchByKeywords(), pruned of any non-alphanumeric characters
    $keyword = preg_replace('/\W/', ' ', $_GET['keyword'] );

    // the types filter. may be a comma-joined list (see in_array($types) below) or blank (do them all)
    if (@$_GET['type']) {
        $types = explode(",", $_GET['type']);
    } else {
        $types = array();
    }

    // the limit on how many results to return; not typically used except for geocoding use (returns 1)
    $limit = (integer) @$_GET['limit'];

    // the repetitive part: use searchByKeywords() to fetch all results fitting the type filter

    // POIs
    if (!sizeof($types) or in_array('poi', $types)) {
        $use_area = new Usearea();
        foreach ($use_area->searchByKeywords($keyword) as $r) {
            $results[] = array(
                'name' => $r->use_area,
                'gid' => (integer) $r->gid,
                'rank' => (float) $r->rank,
                'lat' => (float) $r->lat,
                'lng' => (float) $r->lng,
                'w' => (float) $r->boxw,
                's' => (float) $r->boxs,
                'e' => (float) $r->boxe,
                'n' => (float) $r->boxn,
                'description' => 'Point of interest',
                'type' => 'poi',
            );
        }
    }
    // Reservations
    if (!sizeof($types) or in_array('reservation', $types)) {
        $park = new Park();
        foreach ($park->searchByKeywords($keyword) as $r) {
            // when fetching this for directions, some params will be supplied:  lat  lng  via
            // weight our choice of location to whatever's closest to that latlng
            if (@$_GET['lat'] and $_GET['lng'] and $_GET['lng']) {
                $driving_latlng = $park->closestDrivingDestinationToLatLng($r->reservation_id,$_GET['lat'],$_GET['lng']);
                if ($driving_latlng) {
                    $r->lat = $driving_latlng->lat;
                    $r->lng = $driving_latlng->lng;
                }
            }

            $results[] = array(
                'name' => $r->res,
                'gid' => (integer) $r->gid,
                'rank' => (float) $r->rank,
                'lat' => (float) $r->lat,
                'lng' => (float) $r->lng,
                'w' => (float) $r->boxw,
                's' => (float) $r->boxs,
                'e' => (float) $r->boxe,
                'n' => (float) $r->boxn,
                'description' => 'Reservation',
                'type' => 'reservation'
            );
        }
    }
    // Trails/Loops (Featured Trails)
    if (!sizeof($types) or in_array('loop', $types)) {
        $loop = new Loop();
        foreach ($loop->searchByKeywords($keyword) as $r) {
            $results[] = array(
                'name' => $r->name,
                'gid' => $r->id,
                'rank' => (float) $r->rank,
                'lat' => (float) $r->lat,
                'lng' => (float) $r->lng,
                'w' => (float) $r->boxw,
                's' => (float) $r->boxs,
                'e' => (float) $r->boxe,
                'n' => (float) $r->boxn,
                'description' => 'Trail',
                'type' => 'loop'
            );
        }
    }

    // sort the results by their relevance score; we do this here rather than within each searchByKeywords() call, so we can
    // have the list sorted by relevance rather than by type and then by relevance
    function order_by_rank($p,$q) {
        return $p['rank'] > $q['rank'] ? -1 : 1;
    }
    usort($results, 'order_by_rank');

    // was there a limit? if so, slice the list
    if ($limit) $results = array_slice($results,0,$limit);

    // done, send 'em out!
    print json_encode($results);
}

/**
 * More info
 *
 * @param type
 * @param gid
 */
function moreinfo() {
    switch(@$_GET['type']) {

        case 'trail':
            $result   = new Trail();
            $result->where('gid',$_GET['gid'])->get();
            if (! $result->gid) exit;
            $template = 'ajax/moreinfo_trail.phtml';
            break;

        case 'poi':
            $result = new Usearea();
            $result->where('gid',$_GET['gid'])->get();
            if (! $result->gid) exit;
            $template = 'ajax/moreinfo_usearea.phtml';
            break;

        case 'attraction':
            $result = new Attraction();
            $result->where('gis_id', $_GET['gid'])->get();
            if (!isset($result->gis_id)) exit;

            $template = 'ajax/moreinfo_attraction.phtml';
            // Break the pattern the other cases use, to store extra data (activities)
            $this->load->view(
                $template,
                array(
                    'feature' => $result->stored,
                    'activities' => $result->getAttractionActivities()
                ));
            return;
            break;

        case 'reservation':
            $result = new Park();
            $result->where('gid',$_GET['gid'])->get();
            if (! $result->gid) exit;
            $template = 'ajax/moreinfo_reservation.phtml';
            break;

        case 'reservation_new':
            $result = new Reservation();
            $result
                ->where('record_id', $_GET['gid'])
                ->get();
            if (! $result->record_id) exit;
            $template = 'ajax/moreinfo_reservation_new.phtml';
            break;

        case 'loop':
            $result = new Loop();
            $result->where('id',$_GET['gid'])->get();
            if (! $result->id) exit;

            // experiment: simplify the geometry significantly, and send that out instead of the saved WKT
            // if this works out, the WKT precalculation should be updated to simplify
            $wkt = $this->db->query('SELECT ST_ASTEXT(ST_TRANSFORM(geom,4326)) AS wkt FROM loops WHERE id=?', array($result->id) );
            $wkt = $wkt->row();
            $wkt = $wkt->wkt;
            $result->stored->wkt = $wkt;

            $template = 'ajax/moreinfo_loop.phtml';
            break;

        default:
            $result = null;
            break;
    }
    if (! $result) exit;

    // done, show the HTML template for this feature. normally we'd go AJAX and send back JSON,
    // but we're not generating a plain list here; we're generating a HTML page with photos and all
    $this->load->view($template, array('feature'=>$result->stored ) );
}

/**
 * Get attraction (by ID)
 *
 * @param gid: gis_id
 */
function get_attraction() {
    $attraction = new Attraction();
    $attraction->where('gis_id', $_GET['gid'])->get();

    $result = array(
        'gid'   => $attraction->gis_id,
        'title' => $attraction->pagetitle,
        'lat'   => $attraction->latitude,
        'lng'   => $attraction->longitude
    );

    print json_encode($result);
}

/**
 * Directions
 *
 * @param via
 * @param sourcelat
 * @param sourcelng
 * @param tofrom
 * @param sourcelat
 * @param sourcelng
 * @param targetlat
 * @param targetlng
 * @param tofrom
 * @param bing_key
 */
function directions() {
    switch ($_GET['via']) {
        case 'car':
            $directions = $this->_directions_bing_driving($_GET);
            break;
        case 'bus':
            $directions = $this->_directions_bing_transit($_GET);
            break;
        default:
            $directions = $this->_directions_via_trails($_GET);
            break;
    }

    header('Content-type: application/json');
    print json_encode($directions);
}

/**
 * Driving Directions via Bing (private)
 *
 * @param $params:
 *        array: sourcelat, sourcelng, targetlat, targetlng, tofrom, bing_key
 */
function _directions_bing_driving($params) {
    $output = array();

    // prepare the request
    $source      = sprintf("%f,%f", $_GET['sourcelat'], $_GET['sourcelng'] );
    $target      = sprintf("%f,%f", $_GET['targetlat'], $_GET['targetlng'] );
    $origin      = $_GET['tofrom']=='to' ? $source : $target;
    $destination = $_GET['tofrom']=='to' ? $target : $source;

    $url = sprintf("http://dev.virtualearth.net/REST/v1/Routes/%s?wp.1=%s&wp.2=%s&distanceUnit=mi&maxSolutions=1&key=%s&route&routePathOutput=Points",
        'Driving',
        $origin, $destination,
        $_GET['bing_key']
    );
    $reply = @file_get_contents($url);
    if (! $reply) return null;
    $reply = json_decode($reply);

    $results = $reply->resourceSets[0]->resources;
    if (! sizeof($results)) return;
    $result = $results[0];
    $route  = $result->routeLegs[0];
    $output = array();

    // the bounding box of the route, pretty easy
    $output['bounds'] = array();
    $output['bounds']['west']  = $result->bbox[1];
    $output['bounds']['south'] = $result->bbox[0];
    $output['bounds']['east']  = $result->bbox[3];
    $output['bounds']['north'] = $result->bbox[2];

    // the summary time & distance, pretty easy but needs conversion
    $output['totals']['distance'] = $result->travelDistance;
    $output['totals']['duration'] = $result->travelDuration;
    if ($output['totals']['distance'] < 0.5) {
        $output['totals']['distance'] = sprintf("%d ft", $output['totals']['distance'] * 5270 );
    } else {
        $output['totals']['distance'] = sprintf("%.1f mi", $output['totals']['distance'] );
    }
    if ($output['totals']['duration'] > 3600) {
        $hrs = (integer) ($output['totals']['duration'] / 3600);
        $min = 1 + ( ( $output['totals']['duration'] - (3600*$hrs) ) / 60.0 );
        $output['totals']['duration'] = sprintf("%d hr, %d min", $hrs, $min );
    } else {
        $output['totals']['duration'] = sprintf("%d min", 1 + ($output['totals']['duration'] / 60.0) );
    }

    // the start and end points, so the client can lay down markers
    $output['start'] = array();
    $output['end']   = array();
    $output['end']['lat'] = $route->actualEnd->coordinates[0];
    $output['end']['lng'] = $route->actualEnd->coordinates[1];
    $output['start']['lat'] = $route->actualStart->coordinates[0];
    $output['start']['lng'] = $route->actualStart->coordinates[1];

    // the route steps
    $output['steps'] = array();
    $stepnumber = 0;
    foreach ($route->itineraryItems as $step) {
        // convert the raw seconds and miles into human-readable values
        $seconds = $step->travelDuration;
        if ($seconds > 3600) {
            $hrs = (integer) ($seconds / 3600);
            $min = 1 + ( ( $seconds - (3600*$hrs) ) / 60.0 );
            $duration_text = sprintf("%d hr, %d min", $hrs, $min );
        } else {
            $duration_text = sprintf("%d min", 1 + ($seconds / 60.0) );
        }
        $miles = $step->travelDistance;
        if ($miles < 0.5) {
            $distance_text = sprintf("%d ft", $miles * 5270 );
        } else {
            $distance_text = sprintf("%.1f mi", $miles );
        }

        $output['steps'][] = array(
            'stepnumber' => ++$stepnumber,
            'distance' => $distance_text,
            'duration' => $duration_text,
            'text' => strip_tags($step->instruction->text)
        );
    }

    // the route vectors
    $output['wkt'] = array();
    foreach ($result->routePath->line->coordinates as $vert) {
        $output['wkt'][] = sprintf("%f %f", $vert[1], $vert[0] );
    }
    $output['wkt'] = sprintf("MULTILINESTRING((%s))", implode(",",$output['wkt']) );

    // done, return them to the caller which will presumably encode them for transport
    return $output;
}

/**
 * Transit Directions via Bing (private)
 *
 * @param $params:
 *        array: sourcelat, sourcelng, targetlat, targetlng, tofrom, bing_key
 */
function _directions_bing_transit($params) {
    $output = array();

    // prepare the request
    $source      = sprintf("%f,%f", $_GET['sourcelat'], $_GET['sourcelng'] );
    $target      = sprintf("%f,%f", $_GET['targetlat'], $_GET['targetlng'] );
    $origin      = $_GET['tofrom']=='to' ? $source : $target;
    $destination = $_GET['tofrom']=='to' ? $target : $source;

    $url = sprintf("http://dev.virtualearth.net/REST/v1/Routes/%s?wp.1=%s&wp.2=%s&distanceUnit=mi&maxSolutions=1&key=%s&timeType=Departure&dateTime=%s&routePathOutput=Points",
        'Transit',
        $origin, $destination,
        $_GET['bing_key'],
        date("Y-m-d")
    );
    $reply = @file_get_contents($url);
    if (! $reply) return null;
    $reply = json_decode($reply);

    $results = $reply->resourceSets[0]->resources;
    if (! sizeof($results)) return;
    $result = $results[0];
    $route  = $result->routeLegs[0];
    $output = array();

    // the bounding box of the route, pretty easy
    $output['bounds'] = array();
    $output['bounds']['west']  = $result->bbox[1];
    $output['bounds']['south'] = $result->bbox[0];
    $output['bounds']['east']  = $result->bbox[3];
    $output['bounds']['north'] = $result->bbox[2];

    // the summary time & distance, pretty easy but needs conversion
    $output['totals']['distance'] = $result->travelDistance;
    $output['totals']['duration'] = $result->travelDuration;
    if ($output['totals']['distance'] < 0.5) {
        $output['totals']['distance'] = sprintf("%d ft of walking", $output['totals']['distance'] * 5270 );
    } else {
        $output['totals']['distance'] = sprintf("%.1f mi of walking", $output['totals']['distance'] );
    }
    if ($output['totals']['duration'] > 3600) {
        $hrs = (integer) ($output['totals']['duration'] / 3600);
        $min = 1 + ( ( $output['totals']['duration'] - (3600*$hrs) ) / 60.0 );
        $output['totals']['duration'] = sprintf("%d hr %d min", $hrs, $min );
    } else {
        $output['totals']['duration'] = sprintf("%d min", 1 + ($output['totals']['duration'] / 60.0) );
    }

    // the start and end points, so the client can lay down markers
    $output['start'] = array();
    $output['end']   = array();
    $output['end']['lat'] = $route->actualEnd->coordinates[0];
    $output['end']['lng'] = $route->actualEnd->coordinates[1];
    $output['start']['lat'] = $route->actualStart->coordinates[0];
    $output['start']['lng'] = $route->actualStart->coordinates[1];

    // the route steps and sub-steps; merge them into a single array, so we don't have to repeat our math
    $raw_steps  = array();
    foreach ($route->itineraryItems as $step) {
        $raw_steps[] = $step;
        if (@$step->childItineraryItems) {
            foreach ($step->childItineraryItems as $substep) $raw_steps[] = $substep;
        }
    }

    // now go over those standardized steps, make up the math and directions text
    $stepnumber = 0;
    $output['steps'] = array();
    foreach ($raw_steps as $step) {
        // convert the raw seconds and miles into human-readable values
        $seconds = $step->travelDuration;
        if ($seconds > 3600) {
            $hrs = (integer) ($seconds / 3600);
            $min = 1 + ( ( $seconds - (3600*$hrs) ) / 60.0 );
            $duration_text = sprintf("%d hr, %d min", $hrs, $min );
        } else {
            $duration_text = sprintf("%d min", 1 + ($seconds / 60.0) );
        }
        $miles = $step->travelDistance;
        if ($miles < 0.5) {
            $distance_text = sprintf("%d ft", $miles * 5270 );
        } else {
            $distance_text = sprintf("%.1f mi", $miles );
        }

        // their text instructions are okay, but a little weird, e.g. "Source Location" A few minor fixes
        $step_text = strip_tags($step->instruction->text);
        $step_text = str_replace('Arrive:', 'Arrive at', $step_text);
        $step_text = str_replace('Depart:', 'Depart from', $step_text);
        $step_text = str_replace(': From Source Location', '', $step_text);
        $step_text = str_replace('Destination Location', 'destination', $step_text);
        

        // convert the time field into a human-readable time, prepend it to the instructions
        // the subtraction etc here, presumes that we have a negative TZ offset and it's integer hours, which is true in the USA
        if (@$step->time) {
            $time = null;
            preg_match('/\((\d+)\-(\d+)\)/', $step->time, $time);
            $gmtime    = $time[1] / 1000; // Bing's docs lie, this is MILLIseconds since the epoch
            $tzoff     = ( (int) $time[2] / 100 );
            $time      = gmdate("g:i", $gmtime - 3600*$tzoff);
            $step_text = sprintf("%s, %s", $time, $step_text );
        }

        // step is ready for the output
        $output['steps'][] = array(
            'stepnumber' => ++$stepnumber,
            'distance' => $distance_text,
            'duration' => $duration_text,
            'text' => $step_text
        );
    }

    // the route vectors
    $output['wkt'] = array();
    foreach ($result->routePath->line->coordinates as $vert) {
        $output['wkt'][] = sprintf("%f %f", $vert[1], $vert[0] );
    }
    $output['wkt'] = sprintf("MULTILINESTRING((%s))", implode(",",$output['wkt']) );

    // done, return them to the caller which will presumably encode them for transport
    return $output;
}

/**
 * Transit Directions via Trails (private)
 *
 * @param $params:
 *        array: via, sourcelat, sourcelng, targetlat, targetlng, tofrom, prefer
 */
function _directions_via_trails($params) {
    if (! @$_GET['sourcelng']) return print "Missing params";
    if (! @$_GET['sourcelat']) return print "Missing params";
    if (! @$_GET['targetlng']) return print "Missing params";
    if (! @$_GET['targetlat']) return print "Missing params";
    if (! @$_GET['tofrom'])    return print "Missing params";
    if (! @$_GET['via'])       return print "Missing params";

    // generate WKT for fetching the start & end location; if they're routing From then swap 'em
    $source = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $_GET['sourcelng'], $_GET['sourcelat'] );
    $target = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $_GET['targetlng'], $_GET['targetlat'] );
    if ($_GET['tofrom']=='from') {
        list($source,$target) = array($target,$source);
    }

    // creative use of views to do filtering, means that this single set of routing logic can work for all cases
    // routing_trails is all trails, routing_trails_bike_novice is bike trails tagged as Novice only, and so on
    // Also define the presumed speed in feet per second:  3mph walking/hiking, 5mph equestrian, 10mph biking
    switch ($_GET['via']) {
        case 'hike':
            $route_table     = "routing_trails_hike";
            $duration_column = "duration_hike";
            $cost_column     = "cost_hike";
            $oneway = false;
            break;
        /*
        case 'hike_paved':
            $route_table     = "routing_trails_hike_paved";
            $duration_column = "duration_hike";
            $cost_column     = "cost_hike";
            $oneway = false;
            break;
        case 'hike_unpaved':
            $route_table     = "routing_trails_hike_unpaved";
            $duration_column = "duration_hike";
            $cost_column     = "cost_hike";
            $oneway = false;
            break;
        */
        case 'bridle':
            $route_table     = "routing_trails_bridle";
            $duration_column = "duration_bridle";
            $cost_column     = "cost_bridle";
            $oneway = false;
            break;
        /*
        case 'bridle_paved':
            $route_table     = "routing_trails_bridle_paved";
            $duration_column = "duration_bridle";
            $cost_column     = "cost_bridle";
            $oneway = false;
            break;
        case 'bridle_unpaved':
            $route_table     = "routing_trails_bridle_unpaved";
            $duration_column = "duration_bridle";
            $cost_column     = "cost_bridle";
            $oneway = false;
            break;
        */
        case 'bike':
            $route_table     = "routing_trails_bike";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_novice':
            $route_table     = "routing_trails_bike_novice";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_beginner':
            $route_table     = "routing_trails_bike_beginner";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_intermediate':
            $route_table     = "routing_trails_bike_intermediate";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_advanced':
            $route_table     = "routing_trails_bike_advanced";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        /*
        case 'bike_beginner_paved':
            $route_table     = "routing_trails_bike_beginner_paved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_intermediate_paved':
            $route_table     = "routing_trails_bike_intermediate_paved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_advanced_paved':
            $route_table     = "routing_trails_bike_advanced_paved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_beginner_unpaved':
            $route_table     = "routing_trails_bike_beginner_unpaved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_intermediate_unpaved':
            $route_table     = "routing_trails_bike_intermediate_unpaved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        case 'bike_advanced_unpaved':
            $route_table     = "routing_trails_bike_advanced_unpaved";
            $duration_column = "duration_bike";
            $cost_column     = "cost_bike";
            $oneway = true;
            break;
        */
        default:
            $route_table     = null;
            $duration_column = null;
            $cost_column     = null;
            break;
    }
    if (! $route_table or ! $duration_column) return array();

    // do they prefer the shortest distance, the fastest travel, or our own weighting recommendations?
    // this appends to the table name (actually a view) defined in $route_table above, to pick a different view
    switch (@$_GET['prefer']) {
        case 'shortest':
            $route_table .= "_shortest";
            break;
        case 'fastest':
            $route_table .= "_fastest";
            break;
    }

    // a multi-phase attempt to find a route, given that we want very specific routes (hiking, paved)
    // and they may not match whatever is closest to us. The strategy:
    // - start with the closest start & end nodes to the selected locations
    // - see if they have a route with the requested params
    // - if so, that's the route, ta-da
    // - if not, fan out from those nodes and find 10 of the 100 closest nodes, and try them

    // initialize the output
    $route  = null;
    $output = array( 'wkt'=>'', 'bounds'=>array('west'=>0, 'south'=>0, 'east'=>0, 'north'=>0), 'steps'=>array(), 'totals'=>array( 'distance'=>0.0, 'duration'=>0.0 ), 'retries'=>0 );

    // phase 1: find the nearest nodes to the start and end coordinates, then try to route between them
    // This looping over $nodelimit in steps of $nodestep, causes it to fan out from the selected area trying to find a onode/dnode pair that works
    // the $nodestep makes it not try every single node, but every third node e.g. 1, 4, 7, 10 13 (5 tries, over 200 feet)
    $nodelimit   = 100;
    $nodestep    = 5;
    $maxnodedistance = 2000; // if a node is more than this far (in feet) from the requested location, do not consider it a candidate

    $onodes = $this->db->query("SELECT gid, source, x, y, lat, lng, ST_DISTANCE(the_geom,$source) AS distmeters FROM $route_table ORDER BY the_geom <-> $source LIMIT $nodelimit")->result();
    $dnodes = $this->db->query("SELECT gid, target, x, y, lat, lng, ST_DISTANCE(the_geom,$target) AS distmeters FROM $route_table ORDER BY the_geom <-> $target LIMIT $nodelimit")->result();
    $retries = 0;
    $howmanysteps = $nodelimit / $nodestep;
    for ($o=0; $o<$howmanysteps; $o++) {
        if ($route) break;
        $onode = $onodes[$o * $nodestep];
        if ($onode->distmeters > $maxnodedistance) continue;

        // is there a known barrier between the starting coords and this node? if so, then skip it
        $barrier = $this->db->query("SELECT gid FROM routing_barriers WHERE ST_INTERSECTS(geom, ST_MAKELINE(ARRAY[$source,ST_GEOMFROMTEXT('POINT(? ?)',3734)]) ) LIMIT 1", array( (float) $onode->x , (float) $onode->y) );
        $barrier = $barrier->row();
        //if ($barrier) printf("ONode disqualified (barrier): %d <br/>\n", $onode->source );
        if ($barrier) continue;

        for ($d=0; $d<$howmanysteps; $d++) {
            $dnode = $dnodes[$d * $nodestep];
            if ($dnode->distmeters > $maxnodedistance) continue;
            $retries++;
            if ($route) break;

            // is there a known barrier between the ending coords and this node? if so, then skip it
            $barrier = $this->db->query("SELECT gid FROM routing_barriers WHERE ST_INTERSECTS(geom, ST_MAKELINE(ARRAY[$target,ST_GEOMFROMTEXT('POINT(? ?)',3734)]) ) LIMIT 1", array( (float) $dnode->x , (float) $dnode->y) );
            $barrier = $barrier->row();
            //if ($barrier) printf("DNode disqualified (barrier): %d <br/>\n", $dnode->target );
            if ($barrier) continue;

            // Try to fetch a route. If it works, save it to $route and we're done.
            $mayberoute = $this->db->query("SELECT ST_AsText(ST_Transform(route.the_geom,4326)) AS wkt, ST_Length(route.the_geom) AS length, $route_table.$duration_column AS seconds, $route_table.elevation, $route_table.name FROM $route_table, (SELECT gid, the_geom FROM astar_sp_delta_directed('$route_table',?,?,5280,true,true)) AS route WHERE $route_table.gid=route.gid", array($onode->source, $dnode->target) );
            if ($mayberoute->num_rows() > 0) {
                $route = $mayberoute;
            }
        }
    }
    if (! $route) return array(); // still nothing after some 25 tries? bail
    $output['retries'] = $retries;
    //printf("Found nodes after %d retries: %d, %d <br/>\n", $retries, $onode->source, $dnode->target );

    // Yay, we found a route! Continue with generating the output:
    // vertices for rendering, text directions, grand total distance & time, elevation profile

    // first, add the start and end nodes so the client can place markers
    $output['start'] = array( 'lat'=> (float) $onode->lat, 'lng'=> (float) $onode->lng );
    $output['end']   = array( 'lat'=> (float) $dnode->lat, 'lng'=> (float) $dnode->lng );

    // iterate over the segments and store them into a flat list
    $segments = array();
    foreach ($route->result() as $segment) $segments[] = $segment;
    if (! sizeof($segments) ) return array();
    $howmanysegments = sizeof($segments);

    // capture the vertices for various map uses: the WKT for vector rendering and the bounding box for zooming
    for ($i=0; $i<$howmanysegments; $i++) {
        $segment  = $segments[$i];
        $verts    = preg_split('/,\s*/', preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $segment->wkt ) );
        $wktpart  = array();
        foreach ($verts as $v) {
            list($lng,$lat) = explode(' ', $v);

            // WKT representation of the linestring. we call it $output['wkt'] here, but it's an array; it becomes WKT in postprocessing
            $wktpart[] = sprintf("%f %f", $lng, $lat );

            // the bounding box of the route, potentially for zooming
            if (! $output['bounds']['west']  or $lng < $output['bounds']['west'])  $output['bounds']['west']  = $lng;
            if (! $output['bounds']['south'] or $lat < $output['bounds']['south']) $output['bounds']['south'] = $lat;
            if (! $output['bounds']['east']  or $lng > $output['bounds']['east'])  $output['bounds']['east']  = $lng;
            if (! $output['bounds']['north'] or $lat > $output['bounds']['north']) $output['bounds']['north'] = $lat;
        }
        $output['wkt'][] = '(' . implode(",",$wktpart) . ')';
    }
    $output['wkt'] = sprintf("MULTILINESTRING(%s)", implode(",",$output['wkt']) );

    // pad that bounding box a little, so we don't get markers right off the edge of the screen
    $boxxmargin = $output['bounds']['east'] - $output['bounds']['west'];
    $boxymargin = $output['bounds']['north'] - $output['bounds']['south'];
    $output['bounds']['west']  -= $boxxmargin * 0.10;
    $output['bounds']['south'] -= $boxymargin * 0.10;
    $output['bounds']['east']  += $boxxmargin * 0.10;
    $output['bounds']['north'] += $boxymargin * 0.10;

    // process the segments to create an elevation profile
    $output['elevationprofile'] = array();
    $distance = 0;
    for ($i=0; $i<$howmanysegments; $i+=1) {
        $segment  = $segments[$i];
        $output['elevationprofile'][] = array( 'y' => (integer) $segment->elevation, 'x' => round($distance) );
        $distance += $segment->length;
    }

    // process the segments to create the grand totals for the route, then convert the totals into human text
    // this could be done in the next loop where we generate steps, but this version is more readable when we have to debug
    // and believe me, there's a lot to debug!
    for ($i=0; $i<$howmanysegments; $i++) {
        $segment  = $segments[$i];
        $output['totals']['duration'] += $segment->seconds;
        $output['totals']['distance'] += $segment->length;
    }
    $minutes = round($output['totals']['duration'] / 60.0);
    if ($minutes > 60) {
        $hours   = floor($minutes / 60.0);
        $minutes = round($minutes) % 60;
        $output['totals']['duration'] = sprintf("%d %s, %d min", $hours, $hours==1 ? 'hr' : 'hrs', $minutes );
    } else {
        $output['totals']['duration'] = sprintf("%d minutes", round($minutes) );
    }
    if ($output['totals']['distance'] > 1300) {
        $output['totals']['distance'] = sprintf("%.1f miles", $output['totals']['distance'] / 5280.0 );
    } else {
        $output['totals']['distance'] = sprintf("%d feet", $output['totals']['distance'] );
    }

    // process the segments to create text routing steps.
    // This is complicated (and very much slowed) by the trails having mixed-up names with & delimiters,
    // and by the next for Right and Left turning directions.
    $steps      = array();
    $stepnumber = 0;
    $current_step_distance = 0;
    $current_step_duration = 0;
    $current_step_name     = $segments[0]->name;
    for ($i=0; $i<$howmanysegments; $i++) {
        // if the segment is not the same name as the previous segment (we're very liberal because of the & format),
        // finish making up a step for the output, add it to the list of steps
        $segment       = $segments[$i];
        $is_transition = ! Trailpiece::trailContainsSameName($current_step_name,$segment->name);
        $is_end        = $i == sizeof($segments)-1;

        if ($is_transition) {
            // phase 1: fetch the vertices for the last line in the previous segment, and the first line of the current segment
            // prior version picked truly the last sub-line of each linestring; this is too short (<1m) and thus subject to single-pixel hand shakes while digitizing, as to whether the road faces north or west!
            $thisvert  = preg_split('/,\s*/', preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $segment->wkt ) );
            $thisvert1 = explode(' ', $thisvert[0]);
            $thisvert2 = explode(' ', $thisvert[ sizeof($thisvert)-1]);
            $prevvert = preg_split('/,\s*/', preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $segments[$i-1]->wkt ) );
            $prevvert1 = explode(' ', $prevvert[0] );
            $prevvert2 = explode(' ', $prevvert[ sizeof($prevvert)-1 ] );
            $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
            $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
            $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
            $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];

            // phase 2: either/both of the line segments may need to be flipped, depending on the distance, since the endpoints may be the two touching ends, the two far ends, or any combination
            // the vertices as listed above, may give the azimuth from the segment's end to its start, backwards!
            // strategy: find which combination of endpoints is closest together, and that would be the two touching endpoints
            // remember, "1" indicates the start of a segment and "2" indicates the end of a segment, so $dx12 means the distance from previous seg start to current seg end
            // two segments should meet with previous2 touching current1 ($dx21 is smallest), for the previous to END where the current one STARTS
            // if this is not the case, then one or both of the segments needs to have its vertices swapped
            $dx11 = ($thislon1 - $prevlon1) * ($thislon1 - $prevlon1) + ($thislat1 - $prevlat1) * ($thislat1 - $prevlat1); // distance (squared) between $thisvert1 and $prevvert1
            $dx22 = ($thislon2 - $prevlon2) * ($thislon2 - $prevlon2) + ($thislat2 - $prevlat2) * ($thislat2 - $prevlat2); // distance (squared) between $thisvert2 and $prevvert2
            $dx12 = ($thislon1 - $prevlon2) * ($thislon1 - $prevlon2) + ($thislat1 - $prevlat2) * ($thislat1 - $prevlat2); // distance (squared) between $thisvert1 and $prevvert2
            $dx21 = ($thislon2 - $prevlon1) * ($thislon2 - $prevlon1) + ($thislat2 - $prevlat1) * ($thislat2 - $prevlat1); // distance (squared) between $thisvert2 and $prevvert1
            $whichdx = min(array($dx11,$dx22,$dx12,$dx21));
            switch ($whichdx) {
                case $dx11:
                    // previous segment's start meets current segment start; flip the previous segment
                    list($prevvert1,$prevvert2) = array($prevvert2,$prevvert1);
                    $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
                    $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];
                    break;
                case $dx12:
                    // segments are end-to-end and both need to be flipped
                    list($thisvert1,$thisvert2) = array($thisvert2,$thisvert1);
                    $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
                    $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
                    list($prevvert1,$prevvert2) = array($prevvert2,$prevvert1);
                    $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
                    $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];
                    break;
                case $dx22:
                    // current segment end meets previous segment end, flip the current segment
                    list($thisvert1,$thisvert2) = array($thisvert2,$thisvert1);
                    $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
                    $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
                    break;
                case $dx21:
                    // current start is previous end, already fine
                    break;
            }

            // phase 3: find the azimuth of each, and thus the angle between them
            $thisaz = (180 + rad2deg(atan2(sin(deg2rad($thislon2) - deg2rad($thislon1)) * cos(deg2rad($thislat2)), cos(deg2rad($thislat1)) * sin(deg2rad($thislat2)) - sin(deg2rad($thislat1)) * cos(deg2rad($thislat2)) * cos(deg2rad($thislon2) - deg2rad($thislon1)))) ) % 360;
            $prevaz = (180 + rad2deg(atan2(sin(deg2rad($prevlon2) - deg2rad($prevlon1)) * cos(deg2rad($prevlat2)), cos(deg2rad($prevlat1)) * sin(deg2rad($prevlat2)) - sin(deg2rad($prevlat1)) * cos(deg2rad($prevlat2)) * cos(deg2rad($prevlon2) - deg2rad($prevlon1)))) ) % 360;
            $angle = round($thisaz - $prevaz);
            if ($angle > 180)  $angle = $angle - 360;
            if ($angle < -180) $angle = $angle + 360;
            //printf("%s x %s = %d x %d = %d<br/>\n", $current_step_name, $segment->name, $prevaz, $thisaz, $angle );

            // phase 4: assign a direction word based on that angle
            $turnword = "Turn onto";
            if      ($angle >= -30 and $angle <= 30)   $turnword = "Continue on";
            else if ($angle >= 31  and $angle <= 60)   $turnword = "Slight right onto";
            else if ($angle >= 61  and $angle <= 100)  $turnword = "Right onto";
            else if ($angle >= 101)                    $turnword = "Sharp right onto";
            else if ($angle <= -30 and $angle >= -60)  $turnword = "Slight left onto";
            else if ($angle <= -61 and $angle >= -100) $turnword = "Left onto";
            else if ($angle <= -101)                   $turnword = "Sharp left onto";

            // add the step to the list
            $step = array(
                'stepnumber' => ++$stepnumber,
                'turnword' => $turnword, 'text' => $segment->name,
                'distance' => $current_step_distance, 'duration' => $current_step_duration
            );
            $steps[] = $step;

            // reset the counters for this next step
            $current_step_distance = 0;
            $current_step_duration = 0;
            $current_step_name     = $segment->name;
        }

        // increment the length & duration of the current step, even if that step was just now reset because of a transition
        $current_step_distance += $segment->length;
        $current_step_duration += $segment->seconds;

        // and lastly, if this is the end segment, add the Arrival step so we can indicate the length of travel on this last step
        if ($is_end) {
            $step = array(
                'stepnumber' => ++$stepnumber,
                'turnword' => "Arrive at", 'text' => "your destination",
                'distance' => $current_step_distance, 'duration' => $current_step_duration
            );
            $steps[] = $step;
        }
    }

    // prepend the Start At step, to indicate the name of the street where we start
    array_unshift($steps, array(
        'stepnumber' => null,
        'turnword' => "Start on", 'text' => $segments[0]->name,
        'distance' => null, 'duration' => null
    ));
    //header("Content-type: text/plain"); return print_r($steps);

    // postprocessing on the steps: convert duration (seconds) and distance (feet) into text
    for ($i=0; $i<sizeof($steps); $i++) {
        $seconds = $steps[$i]['duration'];
        $feet    = $steps[$i]['distance'];

        if ($seconds or $feet) {
            $duration_text = $seconds > 45 ? sprintf("%d min", round($seconds / 60.0 ) ) : "< 1 min";
            if ($feet > 1300)  $distance_text = sprintf("%.1f miles", $feet / 5280.0 );
            else               $distance_text = sprintf("%d feet", $feet );

            $steps[$i]['duration'] = $duration_text;
            $steps[$i]['distance'] = $distance_text;
        }
    }

    // a weird edge case: 0 steps. e.g. routing from Brecksville Reservation to Brecksville Reservation
    if (! sizeof($steps) ) return array();

    // a final tweak to the route steps: add "Start at..." to the first step
    // then go ahead and stick these into the final output
    $steps[0]['text'] = $steps[0]['text'];
    $output['steps'] = $steps;

    // postprocessing: these are numeric fields, why are they being quoted?
    $output['bounds']['west']  = (float) $output['bounds']['west'];
    $output['bounds']['south'] = (float) $output['bounds']['south'];
    $output['bounds']['east']  = (float) $output['bounds']['east'];
    $output['bounds']['north'] = (float) $output['bounds']['north'];

    // done, send it off!
    return $output;
}

/**
 * Route waypoints
 *
 * Unlike the directions methods above, this one doesn't need to adhere to an API as it's for admin use only.
 * This one is custom-tuned for the admin tool for generating routes and loops.
 *
 * @param $context
 */
function routewaypoints($context=false) {
    // override the $_GET array if we were hand-fed one; this is primarily for internal use such as autoloop()
    if ($context) $_GET = $context;

    // the output declaration
    $output = array();
    $output['error'] = "";
    $output['wkt']   = array();
    $output['bounds'] = array('west'=>0, 'south'=>0, 'east'=>0, 'north'=>0);
    $output['steps'] = array();
    $output['elevationprofile'] = array();
    $output['totals'] = array('duration_hike'=>0, 'duration_bike'=>0, 'duration_bridle'=>0, 'distance_feet'=>0);
    $output['use_hike']         = 'Yes';
    $output['use_bike']         = 'Yes';
    $output['use_bridle']       = 'Yes';
    $output['use_mountainbike'] = 'Yes';
    $output['paved']      = 0;
    $output['difficulty'] = 'Novice';

    // quick sanity checks on the set of lat,lng pairs and other inputs
    $_GET['lats'] = explode(",", $_GET['lats']);
    $_GET['lngs'] = explode(",", $_GET['lngs']);
    if ( sizeof($_GET['lngs']) != sizeof($_GET['lats']) ) $output['error'] = "Mismatched lat/lng arrays";
    if ( sizeof($_GET['lngs']) < 2 ) $output['error'] = "Not enough points to find a route.";
    if ($output['error']) return print json_encode($output);

    // which table (view) do we use to route? either routing_trails or routing_trails_XXX
    $route_table = $_GET['terrain_filter'];
    if ($route_table) {
        if (!preg_match('/^\w+$/',$route_table)) {
            $output['error'] = "Invalid terrain filter.";
            return print json_encode($output);
        }
        $route_table = "routing_trails_$route_table";
    } else {
        $route_table = "routing_trails";
    }

    ///// PHASE 1: iterate over the stated waypoint coordinates; for each, find a route from this WP to the next WP
    // at this stage, simply collect all segments AND their unique IDs
    $route_segments = array();
    for ($i=0; $i<sizeof($_GET['lats'])-1; $i++) {
        // figure the lat/lng coords for this leg of the journey
        $latA = $_GET['lats'][$i];
        $lngA = $_GET['lngs'][$i];
        $latB = $_GET['lats'][$i+1];
        $lngB = $_GET['lngs'][$i+1];
        //printf("%f , %f TO %f, %f <br/>\n", $latA, $lngA, $latB, $lngB);

        // phase 1a: find the nearest nodes to this leg's start and end coordinates (use the bbox filter above)
        // then calculate a route between them
        // testing Dijkstra vs A* there's no difference in their time, nor do they even produce different loops
        $origin      = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $lngA, $latA );
        $destination = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $lngB, $latB );
        $onode = $this->db->query("SELECT gid, source, x, y FROM $route_table ORDER BY the_geom <-> $origin      LIMIT 1")->row();
        $dnode = $this->db->query("SELECT gid, target, x, y FROM $route_table ORDER BY the_geom <-> $destination LIMIT 1")->row();
        $routesqlquery = "SELECT ST_AsText(ST_Transform(route.the_geom,4326)) AS wkt, ST_Length(route.the_geom) AS length, $route_table.gid, $route_table.duration_hike, $route_table.duration_bike, $route_table.duration_bridle, $route_table.elevation, $route_table.name, $route_table.hike, $route_table.bike, $route_table.bridle, $route_table.mtnbike, $route_table.paved, $route_table.difficulty FROM $route_table, (SELECT gid, the_geom FROM astar_sp_delta('$route_table',?,?,5280)) as route WHERE $route_table.gid=route.gid";
        //$routesqlquery = "SELECT ST_AsText(ST_Transform(route.the_geom,4326)) AS wkt, ST_Length(route.the_geom) AS length, $route_table.gid, $route_table.duration_hike, $route_table.duration_bike, $route_table.duration_bridle, $route_table.elevation, $route_table.name, $route_table.hike, $route_table.bike, $route_table.bridle, $route_table.mtnbike, $route_table.paved, $route_table.difficulty FROM $route_table, (SELECT gid, the_geom FROM dijkstra_sp_delta('$route_table',?,?,5280)) as route WHERE $route_table.gid=route.gid";
        $routesqlparam = array($onode->source, $dnode->target);
        $route = $this->db->query($routesqlquery,$routesqlparam);

        // if we could not find a route, skip this segment but continue to the next one. this helps to visualize what worked and what didn't, great for debugging!
        // if we did find a path for this WP pair, simply log the segments as-is for later processing
        if ($route->num_rows() > 0) {
            foreach ($route->result() as $segment) $route_segments[] = $segment;
        } else {
            $output['error'] = sprintf("Cannot find a route all the way.\nLast good waypoint was at %10f %10f", $latA, $lngA );
        }
    } // end of this waypoint pair

    // if we got this far and didn't find any segments, we have to bail
    if (! sizeof($route_segments) ) return print json_encode($output);

    if (@$_GET['trim_spurs']) {
        ///// PHASE 2a: go over the segments and catalog them by ID#, keeping a count of any segments which are touched twice
        $already_seen = array();
        foreach ($route_segments as $segment) {
            if (! @$already_seen[ $segment->gid ] ) $already_seen[ $segment->gid ] = 0;
            $already_seen[ $segment->gid ]++;
        }

        ///// PHASE 2b: ...then go over them again and remove any segments which happen twice
        // ta-da, $route_segments is now only unique segments
        $route_segments_unique = array();
        $howmany = sizeof($route_segments);
        for ($i=0; $i<$howmany; $i++) {
            // this node is a backtrack; omit it
            if ($already_seen[$route_segments[$i]->gid ] != 1) continue;

            // if this is not the first or last point, check the surrounding points: if they are both repeats, then this one will be an island
            if ($i != 0 and $i != $howmany-1) {
                //if ($already_seen[ $route_segments[$i-1]->gid ] > 1) printf("Node %d neighbor %d appears %d times. Dropped.<br/>", $route_segments[$i]->gid, $route_segments[$i-1]->gid, $already_seen[ $route_segments[$i-1]->gid ] );
                //if ($already_seen[ $route_segments[$i+1]->gid ] > 1) printf("Node %d neighbor %d appears %d times. Dropped.<br/>", $route_segments[$i]->gid, $route_segments[$i+1]->gid, $already_seen[ $route_segments[$i+1]->gid ] );
                if ($already_seen[ $route_segments[$i-1]->gid ] != 1) continue;
                if ($already_seen[ $route_segments[$i+1]->gid ] != 1) continue;
            }

            // fine, fine, then it's a valid node on a nice non-crossing path
            $route_segments_unique[] = $route_segments[$i];
        }
        $route_segments = $route_segments_unique;
        unset($route_segments_unique);
        unset($howmany);
    }

    ///// PHASE 3: now that we have a good route, iterate over segments and collect vertices and WKT, elevation data, total time and distance, use types and paved status, etc.
    $raw_steps = array();
    foreach ($route_segments as $segment) {
        // capture the vertices for various map uses
        $verts    = preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $segment->wkt );
        $verts    = preg_split('/,\s*/', $verts);
        $wktpart  = array();
        foreach ($verts as $v) {
            list($lng,$lat) = explode(' ', $v);
            // WKT representation of the linestring. we call it $output['wkt'] here, but it's an array; it becomes WKT in postprocessing
            $wktpart[] = sprintf("%.13f %.13f", $lng, $lat );

            // the bounding box of the route, potentially for zooming
            if (! $output['bounds']['west']  or $lng < $output['bounds']['west'])  $output['bounds']['west'] = $lng;
            if (! $output['bounds']['south'] or $lat < $output['bounds']['south']) $output['bounds']['south'] = $lat;
            if (! $output['bounds']['east']  or $lng > $output['bounds']['east'])  $output['bounds']['east'] = $lng;
            if (! $output['bounds']['north'] or $lat > $output['bounds']['north']) $output['bounds']['north'] = $lat;
        }
        $output['wkt'][] = '(' . implode(",",$wktpart) . ')';

        // capture the cumulative distance and the elevation at this node, for the elevation profile
        $output['elevationprofile'][] = array( 'y' => (integer) $segment->elevation, 'x' => round($output['totals']['distance_feet']) );

        // increment the total distance and time for the whole route
        $feet           = $segment->length;
        $seconds_hike   = $segment->duration_hike;
        $seconds_bike   = $segment->duration_bike;
        $seconds_bridle = $segment->duration_bridle;
        $output['totals']['duration_hike']   += $seconds_hike;
        $output['totals']['duration_bike']   += $seconds_bike;
        $output['totals']['duration_bridle'] += $seconds_bridle;
        $output['totals']['distance_feet']   += $feet;

        // if this segment does not allow hike/bike/bridle/paved then tag the Loop as not allowing it
        // hike, bike, bridle -- these are endemic to the routing_trails segments, and are used as-is
        // exercise, mountainbike -- these are supplied in trails_fixed
        if ($segment->hike    == 'No') $output['use_hike']         = 'No';
        if ($segment->bike    == 'No') $output['use_bike']         = 'No';
        if ($segment->bridle  == 'No') $output['use_bridle']       = 'No';
        if ($segment->mtnbike == 'No') $output['use_mountainbike'] = 'No';

        // increment the pavement counter
        if ($segment->paved == 'Yes')  $output['paved']++;

        // up the Difficulty, if this segment is tougher than the one spreviously logged
        switch ($segment->difficulty) {
            case 'Beginner':
                if ($output['difficulty'] == 'Novice') $output['difficulty'] = 'Beginner';
                break;
            case 'Intermediate':
                if ($output['difficulty'] != 'Advanced') $output['difficulty'] = 'Intermediate';
                break;
            case 'Advanced':
                $output['difficulty'] = 'Advanced';
                break;
        }

        // add this to $raw_steps for later processing into text directions
        $raw_steps[] = array(
            'distance' => $feet,
            'duration_hike' => $seconds_hike, 'duration_bike' => $seconds_bike, 'duration_bridle' => $seconds_bridle,
            'name' => $segment->name,
            'wkt' => $segment->wkt
        );
    }
    $output['wkt'] = sprintf("MULTILINESTRING(%s)", implode(",",$output['wkt']) );

    // PHASE 3b: the paved counter is a number, turn it into a percentage and then into a qualifier such as "Mostly"
    $paved_percentage = 10 * round((100 * (float) $output['paved'] / sizeof($raw_steps) )/10);
    switch ($paved_percentage) {
        case 0:
        case 10:
            $output['paved'] = "No";
            break;
        case 20:
        case 30:
            $output['paved'] = "Few areas";
            break;
        case 40:
        case 50:
        case 60:
            $output['paved'] = "Some areas";
            break;
        case 70:
        case 80:
            $output['paved'] = "Most areas";
            break;
        case 90:
        case 100:
            $output['paved'] = "Yes";
            break;
    }

    ///// PHASE 4
    // postprocessing, steps: go over the text steps and consolidate them by the trail name so we don't get
    // Bay Trail 15 feet Bay Trail 10 feet Bay Trail 17 feet but instead Bay Trail 42 feet
    // while we do these transitions, note the Right and Left turns
    if (sizeof($raw_steps) > 0) {
        $stepnumber                   = 0;
        $current_step_distance        = 0;
        $current_step_duration_hike   = 0;
        $current_step_duration_bike   = 0;
        $current_step_duration_bridle = 0;
        $current_step_name            = $raw_steps[0]['name'];
        for ($i=0; $i<sizeof($raw_steps); $i++) {
            $segment       = $raw_steps[$i];
            $is_transition = ! Trailpiece::trailContainsSameName($current_step_name,$segment['name']);
            $is_end        = $i == sizeof($raw_steps)-1;

            if ($is_transition) {
                // calculate the turn direction
                $turnword = "Turn onto";
                // phase 1: fetch the vertices for the last line in the previous segment, and the first line of the current segment
                // prior version picked truly the last sub-line of each linestring; this is too short (<1m) and thus subject to single-pixel hand shakes while digitizing, as to whether the road faces north or west!
                $thisvert  = preg_split('/,\s*/', preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $segment['wkt'] ) );
                $thisvert1 = explode(' ', $thisvert[0]);
                $thisvert2 = explode(' ', $thisvert[ sizeof($thisvert)-1]);
                $prevvert = preg_split('/,\s*/', preg_replace( array('/^[\w\s]+\(+/', '/[\)]+$/') , array('',''), $raw_steps[$i-1]['wkt'] ) );
                $prevvert1 = explode(' ', $prevvert[0] );
                $prevvert2 = explode(' ', $prevvert[ sizeof($prevvert)-1 ] );
                $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
                $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
                $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
                $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];

                // phase 2: either/both of the line segments may need to be flipped, depending on the distance, since the endpoints may be the two touching ends, the two far ends, or any combination
                // the vertices as listed above, may give the azimuth from the segment's end to its start, backwards!
                // strategy: find which combination of endpoints is closest together, and that would be the two touching endpoints
                // remember, "1" indicates the start of a segment and "2" indicates the end of a segment, so $dx12 means the distance from previous seg start to current seg end
                // two segments should meet with previous2 touching current1 ($dx21 is smallest), for the previous to END where the current one STARTS
                // if this is not the case, then one or both of the segments needs to have its vertices swapped
                $dx11 = ($thislon1 - $prevlon1) * ($thislon1 - $prevlon1) + ($thislat1 - $prevlat1) * ($thislat1 - $prevlat1); // distance (squared) between $thisvert1 and $prevvert1
                $dx22 = ($thislon2 - $prevlon2) * ($thislon2 - $prevlon2) + ($thislat2 - $prevlat2) * ($thislat2 - $prevlat2); // distance (squared) between $thisvert2 and $prevvert2
                $dx12 = ($thislon1 - $prevlon2) * ($thislon1 - $prevlon2) + ($thislat1 - $prevlat2) * ($thislat1 - $prevlat2); // distance (squared) between $thisvert1 and $prevvert2
                $dx21 = ($thislon2 - $prevlon1) * ($thislon2 - $prevlon1) + ($thislat2 - $prevlat1) * ($thislat2 - $prevlat1); // distance (squared) between $thisvert2 and $prevvert1
                $whichdx = min(array($dx11,$dx22,$dx12,$dx21));
                switch ($whichdx) {
                    case $dx11:
                        // previous segment's start meets current segment start; flip the previous segment
                        list($prevvert1,$prevvert2) = array($prevvert2,$prevvert1);
                        $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
                        $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];
                        break;
                    case $dx12:
                        // segments are end-to-end and both need to be flipped
                        list($thisvert1,$thisvert2) = array($thisvert2,$thisvert1);
                        $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
                        $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
                        list($prevvert1,$prevvert2) = array($prevvert2,$prevvert1);
                        $prevlon1 = $prevvert1[0]; $prevlat1 = $prevvert1[1];
                        $prevlon2 = $prevvert2[0]; $prevlat2 = $prevvert2[1];
                        break;
                    case $dx22:
                        // current segment end meets previous segment end, flip the current segment
                        list($thisvert1,$thisvert2) = array($thisvert2,$thisvert1);
                        $thislon1 = $thisvert1[0]; $thislat1 = $thisvert1[1];
                        $thislon2 = $thisvert2[0]; $thislat2 = $thisvert2[1];
                        break;
                    case $dx21:
                        // current start is previous end, already fine
                        break;
                }

                            // phase 3: find the azimuth of each, and thus the angle between them
                $thisaz = (180 + rad2deg(atan2(sin(deg2rad($thislon2) - deg2rad($thislon1)) * cos(deg2rad($thislat2)), cos(deg2rad($thislat1)) * sin(deg2rad($thislat2)) - sin(deg2rad($thislat1)) * cos(deg2rad($thislat2)) * cos(deg2rad($thislon2) - deg2rad($thislon1)))) ) % 360;
                $prevaz = (180 + rad2deg(atan2(sin(deg2rad($prevlon2) - deg2rad($prevlon1)) * cos(deg2rad($prevlat2)), cos(deg2rad($prevlat1)) * sin(deg2rad($prevlat2)) - sin(deg2rad($prevlat1)) * cos(deg2rad($prevlat2)) * cos(deg2rad($prevlon2) - deg2rad($prevlon1)))) ) % 360;
                $angle = round($thisaz - $prevaz);
                if ($angle > 180)  $angle = $angle - 360;
                if ($angle < -180) $angle = $angle + 360;
                //printf("%s x %s = %d x %d = %d<br/>\n", $current_step_name, $segment['name'], $prevaz, $thisaz, $angle );

                // phase 4: assign a direction word based on that angle
                $turnword = "Turn onto";
                if      ($angle >= -30 and $angle <= 30)   $turnword = "Continue on";
                else if ($angle >= 31  and $angle <= 60)   $turnword = "Slight right onto";
                else if ($angle >= 61  and $angle <= 100)  $turnword = "Right onto";
                else if ($angle >= 101)                    $turnword = "Sharp right onto";
                else if ($angle <= -30 and $angle >= -60)  $turnword = "Slight left onto";
                else if ($angle <= -61 and $angle >= -100) $turnword = "Left onto";
                else if ($angle <= -101)                   $turnword = "Sharp left onto";

                // append the step to the list of steps
                $step = array(
                    'stepnumber'      => ++$stepnumber,
                    'turnword'        => $turnword,
                    'text'            => $current_step_name,
                    'distance'        => $current_step_distance,
                    'duration_hike'   => $current_step_duration_hike,
                    'duration_bike'   => $current_step_duration_bike,
                    'duration_bridle' => $current_step_duration_bridle,
                );
                $output['steps'][] = $step;

                // reset the current step
                $current_step_distance        = 0;
                $current_step_duration_hike   = 0;
                $current_step_duration_bike   = 0;
                $current_step_duration_bridle = 0;
                $current_step_name            = $segment['name'];
            }

            // increment the length & duration of the current step, even if that step was just now reset because of a transition
            $current_step_distance         += $segment['distance'];
            $current_step_duration_hike    += $segment['duration_hike'];
            $current_step_duration_bike    += $segment['duration_bike'];
            $current_step_duration_bridle  += $segment['duration_bridle'];

            // and lastly, if this is the end segment, add the Arrival step so we can indicate the length of travel on this last step
            if ($is_end) {
                $step = array(
                    'stepnumber'      => ++$stepnumber,
                    'turnword'        => "Arrive at",
                    'text'            => "the end of the trail",
                    'distance'        => $current_step_distance,
                    'duration_hike'   => $current_step_duration_hike,
                    'duration_bike'   => $current_step_duration_bike,
                    'duration_bridle' => $current_step_duration_bridle,
                );
                $output['steps'][] = $step;
            }
        }

        // postprocessing, steps again: go over them and convert their distance and time to human-readable text
        for ($i=0; $i<sizeof($output['steps']); $i++) {
            $dis  = $output['steps'][$i]['distance'];
            $dhik = $output['steps'][$i]['duration_hike'];
            $dbik = $output['steps'][$i]['duration_bike'];
            $dbri = $output['steps'][$i]['duration_bridle'];

            $output['steps'][$i]['distance']   = $dis > 1300 ? sprintf("%.1f miles", $dis / 5280.0 ) : sprintf("%d feet", $dis );
            $output['steps'][$i]['timehike']   = $dhik > 45 ? sprintf("%d min", round($dhik / 60.0 ) ) : "< 1 min";
            $output['steps'][$i]['timebike']   = $dbik > 45 ? sprintf("%d min", round($dbik / 60.0 ) ) : "< 1 min";
            $output['steps'][$i]['timebridle'] = $dbri > 45 ? sprintf("%d min", round($dbri / 60.0 ) ) : "< 1 min";
        }
    }
    //return print_r($output['steps']);

    // postprocessing, turns and steps; change step 0 to "Start on", then concatenate the turn words and the names together into a single text readout
    $output['steps'][0]['turnword'] = "Start on";
    for ($i=0; $i<sizeof($output['steps']); $i++) {
        $output['steps'][$i]['text'] = $output['steps'][$i]['turnword'] . ' ' . $output['steps'][$i]['text'];
    }
    //return print_r($output['steps']);

    // postprocessing, grand total: convert duration (seconds) and distance (feet) into text
    if (sizeof($raw_steps) > 0) {
        foreach (array('hike', 'bike', 'bridle',) as $type) {
            $minutes = round($output['totals']["duration_$type"] / 60.0);
            if ($minutes > 60) {
                $hours   = floor($minutes / 60.0);
                $minutes = round($minutes) % 60;
                $output['totals']["durationtext_$type"] = sprintf("%d %s, %d min", $hours, $hours==1 ? 'hr' : 'hrs', $minutes );
                $output['totals']["durationtext_$type"] = sprintf("%d %s, %d min", $hours, $hours==1 ? 'hr' : 'hrs', $minutes );
            } else {
                $output['totals']["durationtext_$type"] = sprintf("%d minutes", round($minutes) );
            }
            $output['totals']["duration_$type"] = round($output['totals']["duration_$type"]);
        }
        if ($output['totals']['distance_feet'] > 1300) {
            $output['totals']['distancetext'] = sprintf("%.1f miles", $output['totals']['distance_feet'] / 5280.0 );
        } else {
            $output['totals']['distancetext'] = sprintf("%d feet", $output['totals']['distance_feet'] );
        }
        $output['totals']['distance_feet'] = round($output['totals']['distance_feet']);
    }

    // done! either print it out in JSON for the browser, or return it for internal use
    if ($context) return $output;
    print json_encode($output);
}

/**
 * Random waypoints
 *
 * Current version of this heuristic for generating random waypoints (Greg A, July 2012).
 * The technique is to randomly "wander" away from the center, one leg at a time,
 * and then route home from wherever we have landed
 *
 * @param $context
 */
//function randomwaypoints_legbased($context=null) {
function randomwaypoints($context=null) {
    // override the $_GET array if we were hand-fed one; this is primarily for internal use such as autoloop()
    if ($context) $_GET = $context;

    // which table (view) do we use to route? either routing_trails or routing_trails_XXX
    $route_table = @$_GET['filter'];
    if ($route_table) {
        if (!preg_match('/^\w+$/',$route_table)) {
            return print "Invalid terrain filter.";
        }
        $route_table = "routing_trails_$route_table";
    } else {
        $route_table = "routing_trails";
    }

    // how many miles length? Just a sanity check at this point
    $_GET['miles'] = (integer) $_GET['miles'];
    if (! $_GET['miles']) return print "Invalid length.";

    // waypoint 0 is the closest node we can find to the LatLng they gave us; it is the starting and ending point of the loop
    $point = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $_GET['lng'], $_GET['lat'] );
    $node  = $this->db->query("SELECT * FROM $route_table WHERE is_road IS NULL AND links >= 3 ORDER BY the_geom <-> $point LIMIT 1")->row();
    if (!$node) return print "Could not find nodes close enough.";

    // start a list of the WPs keyed by gid, because we'll want to fetch them again later
    // and save the starting node's (WP0's) GID so we can feed it to the TSP calculator
    $saved_waypoints = array();
    $start_gid   = $node->gid;
    $saved_waypoints[$node->gid] = $node;

    // now the rest of the waypoints
    // technique:
    // the query specified the number of miles length; convert to feet and divide by number of WPs to find a per-leg distance
    // each waypoint is the given leg-length from the previous waypoint, with some randomness built in
    // the result is a set of random points known to be on trails, forming a set of legs wandering further from home
    // a filter on "links" ensures that the random WP is not alone on a trail, nor a dead end, but more likely to be an intersection and more likely to have alternate ways out
    $howmanywaypoints = 4;
    $totallength = 5280.0 * $_GET['miles'];
    $segmentlength = $totallength / $howmanywaypoints;
    $boxbuffer = $segmentlength * 3.0; // unlike the bbox buffer for finding WP0 above, this is in native SRS and units -- feet
    for ($wp=1; $wp<=$howmanywaypoints; $wp++) {
        $point = sprintf("ST_GeometryFromText('POINT(%f %f)',3734)", $node->x, $node->y );
        $box = sprintf("ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326)",
            $node->x-$boxbuffer, $node->y-$boxbuffer,
            $node->x-$boxbuffer, $node->y+$boxbuffer,
            $node->x+$boxbuffer, $node->y+$boxbuffer,
            $node->x+$boxbuffer, $node->y-$boxbuffer,
            $node->x-$boxbuffer, $node->y-$boxbuffer
        );

        $node  = $this->db->query("SELECT * FROM (SELECT * FROM $route_table WHERE is_road IS NULL AND the_geom && $box AND links >= 3 ORDER BY ABS($segmentlength - ST_DISTANCE(the_geom,$point)) LIMIT 25) AS foo ORDER BY RANDOM() LIMIT 1")->row();
        $saved_waypoints[$node->gid] = $node;
    }

    // great, now we have WP0 plus additional random waypoints
    // run a TSP to sort them; all this does is return a sorted list of GIDs; we need to pull these back out of the $saved_waypoints array to compose our output with LatLng etc.
    $node_gids_string = implode(",",array_keys($saved_waypoints));
    $nodes = $this->db->query("SELECT * FROM tsp('SELECT gid AS source_id, x, y FROM $route_table WHERE gid IN ($node_gids_string)', '$node_gids_string', $start_gid)");
    $i = 0;
    foreach ($nodes->result() as $r) {
        $waypoint = $saved_waypoints[$r->vertex_id];
        $wp = round(9 * $i / $howmanywaypoints);
        $output[] = array( 'wp'=>$wp, 'lat'=>$waypoint->lat, 'lng'=>$waypoint->lng );
        $i++;
    }

    // done! either print it out in JSON for the browser, or return it for internal use
    if ($context) return $output;
    print json_encode($output);
}

/**
 * Random waypoints, radius-based
 *
 * an experimental version of the random waypoint generator.
 * not very good (July 2012, Greg A) except at the center of a park; generates the same loop too often by staying "close to home"
 * unlike the current version which is "wandering leg" based
 *
 * @param $context
 */
//function randomwaypoints($context=null) {
function randomwaypoints_radiusbased($context=null) {
    // override the $_GET array if we were hand-fed one; this is primarily for internal use such as autoloop()
    if ($context) $_GET = $context;

    // which table (view) do we use to route? either routing_trails or routing_trails_XXX
    $route_table = @$_GET['filter'];
    if ($route_table) {
        if (!preg_match('/^\w+$/',$route_table)) {
            return print "Invalid terrain filter.";
        }
        $route_table = "routing_trails_$route_table";
    } else {
        $route_table = "routing_trails";
    }

    // strategy: take the miles and multiply by 5280 to get feet, divide by 2*PI to find a radius
    // find N waypoints at approximately this radius from the WP0 centroid
    // do a TSP sort so they're arranged into a sensical order
    // use Dijkstra or A* to route between each pair of WPs

    // step 1: get the distance, figure a radius which would hypothetically form a circle that diameter
    $_GET['miles'] = (integer) $_GET['miles'];
    if (! $_GET['miles']) return print "Invalid length.";
    $radius = 5280.0 * $_GET['miles'] / 2.0 / M_PI;

    // waypoint 0 is the closest node we can find to the LatLng they gave us; it is the starting and ending point of the loop
    $point = sprintf("ST_Transform(ST_GeometryFromText('POINT(%f %f)',4326),3734)", $_GET['lng'], $_GET['lat'] );
    $boxbuffer = 0.02; // 1.25 miles or so at this latitude?
    $box = sprintf("ST_Transform(ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326),3734)",
        $_GET['lng']-$boxbuffer, $_GET['lat']-$boxbuffer,
        $_GET['lng']-$boxbuffer, $_GET['lat']+$boxbuffer,
        $_GET['lng']+$boxbuffer, $_GET['lat']+$boxbuffer,
        $_GET['lng']+$boxbuffer, $_GET['lat']-$boxbuffer,
        $_GET['lng']-$boxbuffer, $_GET['lat']-$boxbuffer
    );
    $node0 = $this->db->query("SELECT *, ST_Distance(the_geom, $point) AS distance FROM $route_table WHERE is_road IS NULL AND the_geom && $box ORDER BY distance LIMIT 1")->row();
    if (!$node0) return print "Could not find a node close enough to start.";

    // start a list of the WPs keyed by gid, and save the starting node's (WP0's) GID
    // we'll want to fetch them again later for the TSP calculator
    $saved_waypoints = array();
    $start_gid   = $node0->gid;
    $saved_waypoints[$node0->gid] = $node0;

    // now the rest of the the waypoints: randomly selected around the WP0 centroid
    // technique:
    // - select the top $poolsize nodes at that radius (determined by "order by distance")
    // - have that list sorted randomly, and limit to $howmany results
    // - ta-da, these are our selected WPs
    $poolsize  = 100;
    $howmany   = 4;
    $boxbuffer = $radius * 2.0; // unlike the bbox buffer for finding WP0 above, this is in native SRS and units -- feet
    $point     = sprintf("ST_GeometryFromText('POINT(%f %f)',3734)", $node0->x, $node0->y );
    $box       = sprintf("ST_GeometryFromText('POLYGON((%f %f, %f %f, %f %f, %f %f, %f %f))',4326)",
        $node0->x-$boxbuffer, $node0->y-$boxbuffer,
        $node0->x-$boxbuffer, $node0->y+$boxbuffer,
        $node0->x+$boxbuffer, $node0->y+$boxbuffer,
        $node0->x+$boxbuffer, $node0->y-$boxbuffer,
        $node0->x-$boxbuffer, $node0->y-$boxbuffer
    );
    $nodepool = $this->db->query("SELECT * FROM (SELECT * FROM $route_table WHERE is_road IS NULL AND the_geom && $box ORDER BY ABS($radius - ST_DISTANCE(the_geom,$point)) LIMIT $poolsize) AS foo ORDER BY RANDOM() LIMIT $howmany");
    $nodepool = $nodepool->result();
    for ($wp=1; $wp<=$howmany; $wp++) {
        $node = $nodepool[$wp-1];
        $saved_waypoints[$node->gid] = $node;
    }

    // great, now we have WP0 plus additional random waypoints
    // run a TSP to sort them; all this does is return a sorted list of GIDs; we need to pull these back out of the $saved_waypoints array to compose our output with LatLng etc.
    $node_gids_string = implode(",",array_keys($saved_waypoints));
    $nodes = $this->db->query("SELECT * FROM tsp('SELECT gid AS source_id, x, y FROM $route_table WHERE gid IN ($node_gids_string)', '$node_gids_string', $start_gid)");
    $i = 0;
    foreach ($nodes->result() as $r) {
        $waypoint = $saved_waypoints[$r->vertex_id];
        $wp = round(9 * $i / $howmany);
        $output[] = array( 'wp'=>$wp, 'lat'=>$waypoint->lat, 'lng'=>$waypoint->lng );
        $i++;
    }

    // done! either print it out in JSON for the browser, or return it for internal use
    if ($context) return $output;
    print json_encode($output);
}

/**
 * Elevation profile by segments
 *
 * @param $context
 */
function elevationprofilebysegments($context=null) {
    // check permission on the target directory where we save chart images
    // if it doesn't work, there's no point in making the chart: bail with an error message
    // intended callers for this endpoint, should expect to either get an URL or else an error message
    $directory = "static/tmp";
    if (! is_dir($directory) or ! is_writable($directory) ) return print "Can't write elevation profile chart  to disk. Check permissions on $directory";

    require "static/lib/jpgraph-4.2.6/src/jpgraph.php";
    require "static/lib/jpgraph-4.2.6/src/jpgraph_line.php";
    require "static/lib/jpgraph-4.2.6/src/jpgraph_date.php";

    // if artificial POST content was given, load it
    if ($context) $_POST = $context;

    // split the comma-joined lists, and they're ready to push into jpGraph
    // $elevations is the Y axis, elevation values at each point
    // $distances is the X axis, the cumulative distance at which that elevation is reached
    $elevations = explode(',',$_POST['y']);
    $distances  = explode(',',$_POST['x']);

    // how far apart should we space the X axis ticks?
    // based on distance:, e.g. 1/4-mile ticks are cramped over 20 miles, and too thin at <1 mile
    $highest_distance = $distances[ sizeof($distances)-1 ];
    $tickinterval = 1320;
    if ($highest_distance < 5300)   $tickinterval = 528;
    if ($highest_distance > 30000)  $tickinterval = 1640;
    if ($highest_distance > 60000)  $tickinterval = 5280;
    if ($highest_distance > 130000) $tickinterval = 10560;
    if ($highest_distance > 260000) $tickinterval = 26400;

    function graph_axis_feet_to_miles($feet) {
        if ($feet <= 0) return "Start";
        return sprintf("%.2f", $feet / 5280 );
    }

    // create a line chart and lay down the points; we pull a trick here to make the X distance scale linearly
    // we use a datlin scale and pretend it's a date and let jpGraph auto-scale the horizontal "time"
    // we then use graph_axis_feet_to_miles() as a callback to format the distance-date as a quarter-mile string
    $graph = new Graph(450,200,"auto");
    $graph->SetScale("datlin");
    $graph->img->SetMargin(50,10,10,65);
    //$graph->img->SetAntiAliasing(); // disabled on Ubuntu  :(
    $graph->SetFrame(false);
    $graph->SetColor("azure");
    $graph->xgrid->Show(true);
    $graph->yaxis->title->Set("Elevation, feet");
    $graph->yaxis->title->SetFont(FF_ARIAL,FS_BOLD);
    $graph->yaxis->title->SetMargin(7);
    $graph->yaxis->SetFont(FF_ARIAL,FS_NORMAL);
    $graph->yaxis->SetTickSide(SIDE_LEFT);
    $graph->yaxis->SetLabelMargin(5);

    $graph->xaxis->title->Set("Distance, miles                                          ");
    $graph->xaxis->title->SetFont(FF_ARIAL,FS_BOLD);
    $graph->xaxis->title->SetMargin(10);

    $graph->xaxis->scale->ticks->Set($tickinterval); // ticks every quarter-mile
    $graph->xaxis->SetLabelFormatCallback('graph_axis_feet_to_miles');
    $graph->xaxis->SetLabelAngle(90);
    $graph->xaxis->SetLabelMargin(5);
    $graph->xaxis->SetLabelSide(SIDE_DOWN);
    $graph->xaxis->SetFont(FF_ARIAL,FS_NORMAL, 8);

    $plot = new LinePlot($elevations,$distances);
    $graph->Add($plot);
    $plot->SetStyle("solid");
    $plot->SetColor("black");
    $plot->SetWeight(2);
    #$plot->mark->SetType(MARK_X);
    #$plot->mark->SetWidth(1);
    #$plot->mark->SetColor("#000000");

    $random   = md5(microtime() . mt_rand());
    $tempfile = "$directory/$random.jpg";
    $tempurl  = site_url($tempfile);
    $graph = $graph->Stroke($tempfile); // permissions issues aren't impossible
    //header("Content-type: image/jpeg"); readfile($tempfile); return;
    if ($context) return $tempurl;
    print $tempurl;
}

/**
 * Get Attractions for an Activity
 *
 * @param activity_ids
 */
function get_attractions_by_activity() {
    // Accept either a single Activity ID or an array of them.
    $activity_ids = is_array($_GET['activity_ids']) ? $_GET['activity_ids'] : array($_GET['activity_ids']);

    $attractions = new Attraction();
    $attractions = $attractions->getAttractionsByActivity($activity_ids);

    $results = $this->_makeAttractionResults($attractions);

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Get Attractions by Amenity
 *
 * @param amenity_ids
 */
function get_attractions_by_amenity() {
    // Accept either a single Amenity ID or an array of them.
    $amenity_ids = is_array($_GET['amenity_ids']) ? $_GET['amenity_ids'] : array($_GET['amenity_ids']);

    $attractions = new Attraction();
    $attractions = $attractions->getAttractionsByAmenity($amenity_ids);

    $results = $this->_makeAttractionResults($attractions);

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Get Visitor Centers (Attractions)
 */
function get_visitor_centers() {
    $visitor_centers = new Attraction();
    $visitor_centers = $visitor_centers->getVisitorCenters();

    $results = $this->_makeAttractionResults($visitor_centers);

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Get reservation (by ID)
 *
 * @param gid: record_id
 */
function get_reservation() {
    $reservation = new Reservation();
    $reservation->where('record_id', $_GET['gid'])->get();

    $result = array(
        'record_id'   => $reservation->record_id,
        'title' => $reservation->pagetitle,
        'lat'   => $reservation->latitude,
        'lng'   => $reservation->longitude,
        'boxw'   => $reservation->boxw,
        'boxs'   => $reservation->boxs,
        'boxe'   => $reservation->boxe,
        'boxn'   => $reservation->boxn
    );

    print json_encode($result);
}

/**
 * Get Reservations
 */
function get_reservations() {
    $reservations = new Reservation();

    $reservations
        ->order_by('pagetitle')
        ->get();

    $results = $this->_makeAttractionResults($reservations, 'reservation_new');

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Get nearby attractions with activities
 *
 * @param lat
 * @param lng
 * @param within_feet
 * @param activity_ids
 */
function get_nearby_attractions_with_activities() {
    $attractions = new Attraction();
    $attractions = $attractions->getNearbyAttractions(
        $_GET['lat'],
        $_GET['lng'],
        $_GET['within_feet'],
        $_GET['activity_ids']
    );

    $results = $this->_makeAttractionResults($attractions);

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Transform attractions from model functions into our output results array.
 *
 * @param $attractions: Listing of attractions as returned
 *      from Attraction data model functions.
 * @param $type: Typically 'attraction', but could be other types (like 'reservation_new')
 *      that we're overloading this function for.
 */
function _makeAttractionResults($attractions, $type='attraction') {
    $results = array();

    foreach ($attractions as $attraction) {
        $results[] = array(
            'type'  => $type,
            'name'  => trim($attraction->pagetitle),
            'gid'   => (integer) $attraction->gis_id,
            'record_id' => (integer)$attraction->record_id,

            // view_cmp_gisreservations (reservation_new) has bounding box columns
            'w'     => isset($attraction->boxw) ? $attraction->boxw : (float)0,
            's'     => isset($attraction->boxs) ? $attraction->boxs : (float)0,
            'e'     => isset($attraction->boxe) ? $attraction->boxe : (float)0,
            'n'     => isset($attraction->boxn) ? $attraction->boxn : (float)0,

            'lat'   => (float) $attraction->latitude,
            'lng'   => (float) $attraction->longitude,

            'thumbnail' => $attraction->pagethumbnail,

            'description' => $attraction->descr,

            'cmp_url' => $this->config->item('main_site_url') . ltrim($attraction->cmp_url, '/')
        );
    }

    return $results;
}

/**
 * Get all beach closures
 *
 * @param gid: gis_id
 */
function get_beach_closures() {
    $beach_closures = new BeachClosure();
    $beach_closures = $beach_closures->getBeachClosures();

    foreach ($beach_closures as $beach_closure) {
        $results[] = array(
            'id' => $beach_closure->autonumber,
            'name' => $beach_closure->title,
            'date_updated' => $beach_closure->expr1,
            'external_link' => $beach_closure->waterquality,
            'lat'   => $beach_closure->latitude,
            'lng'   => $beach_closure->longitude,
            'status_text' => $beach_closure->beachstatus,
            // Remove the '#' character from the hex code, so we can be deliberate:
            'status_color' => ltrim($beach_closure->closurecolor, '#'),
            'gisid' => $beach_closure->gisid
        );
    }

    $output = array('results' => $results);
    print json_encode($output);
}

/**
 * Search nearby
 *
 * @param lat
 * @param lng
 * @param meters
 */
function search_nearby() {
    // validation: floats, radius too large, categories exist, ...
    $_GET['lat']    = (float) @$_GET['lat']   ; if (! $_GET['lat']   ) return print "Bad params";
    $_GET['lng']    = (float) @$_GET['lng']   ; if (! $_GET['lng']   ) return print "Bad params";
    $_GET['meters'] = (float) @$_GET['meters'];
    if (! $_GET['meters']) return print "Bad params";
    if ( $_GET['meters'] > 5 * 1609) return print "Big radius";
    //$_POST['categories'] = explode(';', @$_POST['categories']); if (! sizeof($_POST['categories']) ) return print "Bad categories";

    // do the search, massage the output structure
    $results = array();
    $raws = new Usearea();
    //$raws = $raws->searchNearby($_POST['lat'],$_POST['lng'],$_POST['meters'],$_POST['categories']);
    $raws = $raws->searchNearby($_GET['lat'],$_GET['lng'],$_GET['meters']);
    foreach ($raws as $result) {
        $results[] = array('type'=>'poi', 'name'=>trim($result->use_area), 'gid'=>(integer) $result->gid, 'w'=>(float) $result->boxw, 's'=>(float) $result->boxs, 'e'=>(float) $result->boxe, 'n'=>(float) $result->boxn, 'lat'=>(float) $result->lat, 'lng'=>(float) $result->lng );
    }

    // done, send 'em out via JSON
    print json_encode($results);
}

/**
 * Search trails
 *
 * @param exuses
 * @param reservation
 * @param paved
 * @param uses
 */
function search_trails() {
    $results = array();

    // do a fetch for the matching trails, easy enough
    if (@$_GET['exuses']) {
        $_GET['exuses'] = explode(",",$_GET['exuses']);
    } else {
        $_GET['exuses'] = array();
    }
    $trails = new Trail();
    if (@$_GET['reservation']) $trails->where('reservation',$_GET['reservation']);
    if (@$_GET['paved'])       $trails->like('paved',$_GET['paved']);
    if (@$_GET['uses']) {
        $_GET['uses'] = explode(',',$_GET['uses']);
        $trails->group_start();
        foreach ($_GET['uses'] as $use) $trails->or_like('uses',$use);
        $trails->group_end();
    }
    $trails->order_by('name')->get();

    // iterate and form the results
    foreach ($trails as $trail) {
        $notes = array();
        //if ($trail->uses) $notes[] = "Uses: " . $trail->uses;
        //$notes[] = "Paved: " . $trail->paved;
        $notes[] = sprintf("%.1f miles of trail", $trail->length_text );
        if ($trail->reservation and ! @$_GET['reservation']) $notes[] = "Location: " . $trail->reservation;
        $notes = implode("<br/>", $notes);

        $results[] = array('type'=>'trail', 'name'=>trim($trail->name), 'gid'=>(integer) $trail->gid,
                           'w'=>(float) $trail->boxw, 's'=>(float) $trail->boxs, 'e'=>(float) $trail->boxe, 'n'=>(float) $trail->boxn,
                           'lat'=>(float) $trail->lat, 'lng'=>(float) $trail->lng,
                           'url'=>$trail->link,
                           'note'=>$notes);
    }

    // done, send 'em out via JSON
    print json_encode($results);
}

/**
 * Search loops
 *
 * @param filter_type
 * @param filter_paved
 * @param reservation
 * @param minfeet
 * @param maxfeet
 * @param minseconds
 * @param maxseconds
 */
function search_loops() {
    $matches = new Loop();
    $results = array();

    $matches->where('status','Published');

    // the date filter: either no expiration at all, or an expiration in the future
    $today = date('Y-m-d');
    $matches->group_start();
    $matches->or_where('expires',NULL);
    $matches->or_where('expires >',$today);
    $matches->group_end();

    // the use type filter, AND the collection of the short version of the filter type: bike, hike, bridle
    $shorttype = $_GET['filter_type'];
    switch (@$_GET['filter_type']) {
        case "hike":
            $matches->where('hike','Yes');
            break;
        case "bike":
            $matches->where('bike','Yes');
            break;
        case "bike_Novice":
            $shorttype = "bike";
            $matches->where('bike','Yes');
            $matches->where('difficulty','Novice');
            break;
        case "bike_Beginner":
            $shorttype = "bike";
            $matches->where('bike','Yes');
            $matches->group_start();
            $matches->or_where('difficulty','Novice');
            $matches->or_where('difficulty','Beginner');
            $matches->group_end();
            break;
        case "bike_Intermediate":
            $shorttype = "bike";
            $matches->where('bike','Yes');
            $matches->group_start();
            $matches->or_where('difficulty','Novice');
            $matches->or_where('difficulty','Beginner');
            $matches->or_where('difficulty','Intermediate');
            $matches->group_end();
            break;
        case "bike_Advanced":
            $shorttype = "bike";
            $matches->where('bike','Yes');
            /*
            $matches->group_start();
            $matches->or_where('difficulty','Novice');
            $matches->or_where('difficulty','Beginner');
            $matches->or_where('difficulty','Intermediate');
            $matches->or_where('difficulty','Advanced');
            $matches->group_end();
            */
            break;
        case "bridle":
            $shorttype = "bridle";
            $matches->where('bridle','Yes');
            break;
        case "exercise":
            $shorttype = "hike";
            $matches->where('exercise','Yes');
            break;
        case "mountainbike":
            $shorttype = "bike";
            $matches->where('mountainbike','Yes');
            break;
        default:
            // if we got here it's an invalid use type, so make an impossible clause so the programmer will come checking why nothing matched
            $matches->where('gid','0');
            break;
    }

    // the Paved? filter
    if (@$_GET['filter_paved']) {
        $matches->where('paved',$_GET['filter_paved']);
    }

    // the Reservation filter
    if (@$_GET['reservation']) {
        $resids = array(0); // can't have an empty array, so start with a list of 1 impossible ID
        $ix = $this->db->query('SELECT loopid FROM loops_reservations WHERE reservation=?', array($_GET['reservation']) );
        foreach ($ix->result() as $i) $resids[] = $i->loopid;
        $matches->where_in('id',$resids);
    }

    // the distance filter
    $matches->where("distance_feet >=", $_GET['minfeet']);
    $matches->where("distance_feet <=", $_GET['maxfeet']);

    // bike queries only: duration
    // but we use $durationfield anyway for output
    $durationfield = "duration_" . $shorttype;
    if (substr($_GET['filter_type'],0,4) == 'bike') {
        $matches->where("$durationfield >=", $_GET['minseconds']);
        $matches->where("$durationfield <=", $_GET['maxseconds']);
    }

    // phase 2: iterate and collect the results
    $matches->get();
    $results = array();
    foreach ($matches as $loop) {
        $result = array(
            'title' => $loop->name, 'type'=>'loop', 'gid' => (integer) $loop->id,
            'w' => (float) $loop->boxw, 's' => (float) $loop->boxs, 'e' => (float) $loop->boxe, 'n' => (float) $loop->boxn, 'lat' => (float) $loop->lat, 'lng' => (float) $loop->lng,
            'distance' => $loop->distancetext, 'duration' => $loop->{"durationtext_{$shorttype}"},
        );

        if ($shorttype == "bike") $result['difficulty'] = $loop->difficulty;

        $results[] = $result;
    }

    // done, return a JSON list
    print json_encode($results);
}

/**
 * Autoloop
 *
 * @param lat
 * @param lon
 * @param miles
 * @param usetype
 * @param basename
 * @param creatorid
 */
function autoloop() {
    $lat       = $_GET['lat'];
    $lon       = $_GET['lon'];
    $miles     = $_GET['miles'];
    $usetype   = $_GET['usetype'];
    $basename  = @$_GET['basename'] ? $_GET['basename'] : 'Random';
    $creatorid = $_GET['creatorid'];
    if (!$lat or !$lon or !$miles or !$usetype or !$creatorid) return print "Missing parameters.";

    // take up to 5 tries at generating WPs and routing between them
    // some errors are fatal and we return; others mean that a new set of WPs may do the job
    for ($attempt = 1; $attempt <=5; $attempt++) {
        // build the loop: phase 1: fetch waypoints. store them for later since our saved loop really does need the WPs' IDs and LatLngs for later editing
        $params = array( 'lat' => $lat, 'lng' => $lon, 'miles'  => $miles, 'filter' => $usetype );
        $waypoints = $this->randomwaypoints($params);
        if (! is_array($waypoints)) return print "Could not find waypoints.";

        // build the loop: phase 2: generate a route
        $params = array();
        $params['lngs'] = implode(",", array_map(create_function('$w','return $w["lng"];') , $waypoints ) ) . "," . $waypoints[0]['lng'];
        $params['lats'] = implode(",", array_map(create_function('$w','return $w["lat"];') , $waypoints ) ) . "," . $waypoints[0]['lat'];
        $params['terrain_filter'] = $usetype;
        $params['trim_spurs'] = 1;
        $route = $this->routewaypoints($params);
        if (! is_array($route)) return print "Could not find waypoints.";

        // if there was no error, bail and we have $route and $waypoints defined
        // if there was, well, the loop continues
        if (! $route['error']) break;
    }

    // if we got here, we must have $route and $waypoints defined or else we tried all 5 times and got nothing
    if (!$route or !$waypoints) return print "Could not find a route after 5 tries. Giving up.";

    // build the loop: phase 3: generate an elevation profile image
    $params = array();
    $params['x'] = implode(",", array_map(create_function('$w','return $w["x"];') , $route['elevationprofile'] ) );
    $params['y'] = implode(",", array_map(create_function('$w','return $w["y"];') , $route['elevationprofile'] ) );
    $epurl = $this->elevationprofilebysegments($params);

    // save the loop: phase 1: creation and basic information
    $loop = new Loop();
    $loop->name       = $basename . " " . md5(microtime());
    $loop->source     = "Random";
    $loop->creatorid  = $creatorid;
    $loop->hike       = $route['use_hike'];
    $loop->bike       = $route['use_bike'];
    $loop->bridle     = $route['use_bridle'];
    $loop->paved      = $route['paved'];
    $loop->difficulty = $route['difficulty'];
    $loop->terrain_filter = $usetype;
    $loop->save();

    // save the loop: phase 2: total distance & time, waypoints, elevation profile
    $loop->duration_hike       = $route['totals']['duration_hike'];
    $loop->duration_bike       = $route['totals']['duration_bike'];
    $loop->duration_bridle     = $route['totals']['duration_bridle'];
    $loop->duration_texthike   = $route['totals']['duration_hike'];
    $loop->duration_textbike   = $route['totals']['duration_bike'];
    $loop->duration_textbridle = $route['totals']['duration_bridle'];
    $loop->distance_feet       = $route['totals']['distance_feet'];
    $loop->distancetext        = $route['totals']['distancetext'];
    for ($i=0; $i<sizeof($waypoints); $i++) {
        $wp = $waypoints[$i];
        if (! @$wp['wp']) $wp['wp'] = 0;
        $loop->{"wp{$wp['wp']}lat"} = $wp['lat'];
        $loop->{"wp{$wp['wp']}lng"} = $wp['lng'];
    }
    $loop->elevation_profile = implode(",", array_map(create_function('$w','return $w["x"] . " " . $w["y"];') , $route['elevationprofile'] ) );
    $loop->save();

    // save the loop: phase 3: the lat, lng, wsen, etc.
    $loop->boxw = $route['bounds']['west'];
    $loop->boxs = $route['bounds']['south'];
    $loop->boxe = $route['bounds']['east'];
    $loop->boxn = $route['bounds']['north'];
    $loop->lat = $waypoints[0]['lat'];
    $loop->lng = $waypoints[0]['lng'];
    $loop->save();

    // save the loop: phase 4: the WKT and then some SQL to update from the WKT into both SRSs
    $loop->wkt = $route['wkt'];
    $loop->save();
    $this->db->query('UPDATE loops SET the_geom=ST_GeometryFromText(wkt,4326) WHERE id=?', array($loop->id) );
    $this->db->query('UPDATE loops SET geom=ST_TRANSFORM(ST_GeometryFromText(wkt,4326),3734) WHERE id=?', array($loop->id) );

    // save the loop: phase 5: update the Loop's list of reservations, with a handy-dandy self-contained Pl/PgSQL function
    $this->db->query('SELECT update_loop_reservations(?)', array($loop->id) );

    // save the loop: phase 6: directions steps
    // now the directions steps, in JSON format
    $steps = array();
    for ($i=0; $i<sizeof($route['steps']); $i++) {
        $steps[] = array(
            'stepnumber' => $route['steps'][$i]['stepnumber'],
            'text'       => $route['steps'][$i]['text'],
            'distance'   => $route['steps'][$i]['distance'],
            'timehike'   => $route['steps'][$i]['timehike'],
            'timebike'   => $route['steps'][$i]['timebike'],
            'timebridle' => $route['steps'][$i]['timebridle'],
        );
    }
    $loop->steps = json_encode($steps);
    $loop->save();

    // save the loop: phase 7: elevation profile image
    $saveas = "static/images/loops/{$loop->id}.jpg";
    copy($epurl,$saveas);

    // finished! print the route's ID# (an integer) so the caller can edit it, or note success/failure
    print $loop->id;
}

/**
 * Load POIs
 *
 * @return array of POIs
 *     each an associative array including:
 *         title, categories, gid, n, s, e, w, lat, lng
 */
function load_pois() {
    $results = array();

    // round 1: Usearea POIs
    $pois = new Usearea();
    $pois->get();
    foreach ($pois as $poi) $results[] = array(
        'title' => $poi->use_area,
        'categories' => (string) $poi->activity,
        'gid' => (integer) $poi->gid,
        'w' => (float) $poi->boxw, 's' => (float) $poi->boxs, 'e' => (float) $poi->boxe, 'n' => (float) $poi->boxn,
        'lat' => (float) $poi->lat, 'lng' => (float) $poi->lng,
    );

    // round 2: any Health Tips markers
    $markers = new Marker();
    $markers->where('enabled',1)->get();
    foreach ($markers as $marker) $results[] = array(
        'title' => $marker->title,
        'categories' => "Health Tips",
        'gid' => (integer) $marker->id,
        'w' => $marker->lng - 0.001, 's' => $marker->lat - 0.001, 'e' => $marker->lng + 0.001, 'n' => $marker->lat + 0.001,
        'lat' => (float) $marker->lat, 'lng' => (float) $marker->lng,
    );

    // all set, send 'em out
    print json_encode($results);
}

/**
 * Make short URL
 *
 * @param uri: actually just path; no protocol, URL, or query string
 * @param querystring
 */
function make_shorturl() {
    $path = $_GET['uri'];
    $queryStr = $_GET['querystring'];

    print Shorturl::save_url($path, $queryStr);
}

/**
 * Autocomplete keywords
 */
function autocomplete_keywords() {
    $words = array();
    $wx = pg_query('SELECT * FROM autocomplete_words');
    while ($w = pg_fetch_assoc($wx)) $words[] = $w['word'];
    print json_encode($words);
}

/**
 * Test working with the progress indicator.
 *
 * @param job_id
 */
function test_progress_indicator() {
    header('Content-type: application/json');

    $job_id = $_GET['job_id'];

    $job = new Job();
    $job->where('id', $job_id)->get();

    // Incrementally update progress
    $percent_complete = 0;
    while ($percent_complete < 100) {
        $percent_complete += 10;
        $job->percent_complete = $percent_complete;
        $job->save();
        sleep(1);
    }

    print json_encode('Complete!');
}

/**
 * Create a new system job in the database
 *
 * @param title
 * @param creator_email
 * @param status
 *
 * @return Job ID
 */
function create_job() {
    header('Content-type: application/json');

    $job = new Job();

    $job->title = !empty($_GET['title']) ? $_GET['title'] : '';
    $loggedin = $this->session->userdata('contributor');
    $job->creator_email = !empty($_GET['creator_email']) ? $_GET['creator_email'] : $loggedin['email'];
    $job->status = !empty($_GET['status']) ? $_GET['status'] : JOB_NOT_STARTED;

    $job->save();

    print json_encode($job->id);
}

/**
 * Check a given job's progress & status.
 *
 * @param job_id
 */
function check_job_progress() {
    header('Content-type: application/json');

    $job_id = $_GET['job_id'];

    $job = new Job();
    $job->where('id', $job_id)->get();

    $job_progress = array(
        'status' => $job->status,
        'percent_complete' => $job->percent_complete,
        'status_msg' => $job->status_msg,
        );

    print json_encode($job_progress);
}

/**
 * Purge Tilestache
 *
 * @param job_id
 */
function purge_tilestache() {
    header('Content-type: application/json');

    $this->load->helper('file_extras');

    $job_id = $_GET['job_id'];

    $job = new Job();
    $job->where('id', $job_id)->get();

    $job->status = JOB_RUNNING;
    $job->save();

    // Top-level dir:
    $tiles_root_dir = $this->config->item('tilestache_tiles_directory'); // /var/www/tilestache/tiles

    // Get total # of files and size
    $root_dir_stats = _dir_stats($tiles_root_dir);
    $total_num_files = $root_dir_stats['num_files'];

    $percent_complete = 0;
    $num_files_deleted = 0;

    $tile_subdirs = glob($tiles_root_dir . '/*/*/*');

    foreach ($tile_subdirs as $dir) {
        // Only match subdirs with two sets of numbers at the end, like /.../water/01/231
        if (preg_match('~/[\d]+/[\d]+$~', $dir)) {
            $sub_dir_stats = _dir_stats($dir);
            $num_files_deleted += $sub_dir_stats['num_files'];

            $percent_complete = ($total_num_files <= 0) ? 100 : round($num_files_deleted / $total_num_files * 100);

            _rrmdir($dir);

            $job->status_msg = sprintf("Deleted %d/%d files (%d%%). (Currently: '%s').",
                $num_files_deleted, $total_num_files, $percent_complete, $dir);
            $job->percent_complete = $percent_complete;
            $job->save();
        }
    }

    $job->percent_complete = ($total_num_files <= 0) ? 100 : round($num_files_deleted / $total_num_files * 100);
    $job->status = JOB_COMPLETE;
    $job->end_time = date('Y-m-d H:i:s');
    $job->status_msg = sprintf("Purge complete! %d/%d tile files deleted (%d%%).",
        $num_files_deleted, $total_num_files, $job->percent_complete );
    $job->save();

    $response = $job->status_msg;

    print json_encode($response);
}

/**
 * Seed Tilestache
 *
 * @param job_id
 */
function seed_tilestache() {
    header('Content-type: application/json');

    $job_id = $_GET['job_id'];

    $job = new Job();
    $job->where('id', $job_id)->get();

    $job->status = JOB_RUNNING;
    $job->save();

    // Build the seed command.
    $command = sprintf("%s -c %s -b %s -l %s -f %s %s", 
        $this->config->item('tilestache_seed'),
        $this->config->item('tilestache_cfg'),
        $this->config->item('tilestache_seed_bbox'),
        $this->config->item('tilestache_seed_layer'),
        $this->config->item('tilestache_progress_file'),
        implode(" " , $this->config->item('tilestache_seed_levels'))
    );

    // Run the command (in a new fork) and send back the output.
    // The parent process waits for it to exit,
    // sending out progress reports based on the progress file
    // The seeder outputs to stderr, not stdout.
    $handle = popen("$command 2>&1", 'r');

    $progress_file = $this->config->item('tilestache_progress_file');

    // Read from progress file, repeatedly
    while (! feof($handle)) {
        $output = fread($handle, 10240);
        if (! is_file($progress_file) ) {
            // Progress file may not exist yet.
            continue;
        }
        $progress = json_decode(file_get_contents($progress_file));
        if (!$progress or !$progress->total ) {
            // File opened but no JSON content yet.
            continue;
        }
        $percent_complete = round(100 * (float)$progress->offset / (float)$progress->total);

        $job->percent_complete = $percent_complete;
        $job->status_msg = sprintf("Seeded %d/%d files (%d%%). (Currently: '%s').",
            $progress->offset, $progress->total, $percent_complete, $progress->tile);
        $job->save();
    }
    pclose($handle);
    unlink($progress_file);

    $job->percent_complete = round(100 * (float)$progress->offset / (float)$progress->total);
    $job->status = JOB_COMPLETE;
    $job->end_time = date('Y-m-d H:i:s');
    $job->status_msg = sprintf("Seed complete! %d/%d files seeded (%d%%).",
        $progress->offset, $progress->total, $job->percent_complete);
    $job->save();

    $response = $job->status_msg;

    print json_encode($response);
}

/**
 * Get user's chosen coordinate format from the session.
 */
function get_session_coordinate_format() {
    $coordinate_format = $this->session->userdata('coordinate_format');

    if (!$coordinate_format) {
        $coordinate_format = 'dms'; // Default
    }

    print json_encode($coordinate_format);
}

/**
 * Set the user's chosen coordinate format in the session.
 *
 * @param coordinate_format
 */
function set_session_coordinate_format() {
    if ($_GET['coordinate_format']) {
        $data = array('coordinate_format' => $_GET['coordinate_format']);
        $this->session->set_userdata($data);
    }
}

} /*  /class  */
