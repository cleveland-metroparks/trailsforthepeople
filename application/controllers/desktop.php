<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Desktop extends CI_Controller {

// index is the landing page; it sends them to a Mobile-or-Desktop picker page
function index() {
    return redirect(site_url('map'));
}

function map() {
    return redirect(site_url('map'));
}

function fetch_activitypois() {
    $input = Usearea::getCategorizedListing();
    $output= array();

    foreach ($input as $category=>$pois) {
        $output[$category] = array();
        foreach ($pois as $poi) {
            $output[$category][] = array(
                'use_area' => $poi->use_area,
                'gid' => (integer) $poi->gid,
                'boxw' => (float) $poi->boxw, 'boxs' => (float) $poi->boxs, 'boxe' => (float) $poi->boxe, 'boxn' => (float) $poi->boxn,
                'lat' => (float) $poi->lat, 'lng' => (float) $poi->lng,
            );
        }
    }

    header('Content-type: application/json');
    print json_encode($output);
}

function fetch_loops() {
    $input = Loop::getPublicLoops();
    $output= array();

    foreach ($input as $loop) {
        $output[] = array(
            'name' => $loop->name,
            'id' => (integer) $loop->id,
            'boxw' => (float) $loop->boxw,
            'boxs' => (float) $loop->boxs,
            'boxe' => (float) $loop->boxe,
            'boxn' => (float) $loop->boxn,
            'lat' => (float) $loop->lat,
            'lng' => (float) $loop->lng,
            'hike' => $loop->hike,
            'bike' => $loop->bike,
            'bridle' => $loop->bridle,
            'exercise' => $loop->exercise,
            'mountainbike' => $loop->mountainbike,
            'difficulty' => $loop->difficulty,
            'paved' => $loop->paved,
            'length_feet' => $loop->distance_feet,
            'duration_hike' => $loop->duration_hike,
            'duration_bike' => $loop->duration_bike,
            'duration_bridle' => $loop->duration_bridle,
            'distancetext' => $loop->distancetext,
            'durationtext_hike' => $loop->durationtext_hike,
            'durationtext_bike' => $loop->durationtext_bike,
            'durationtext_bridle' => $loop->durationtext_bridle,
            'reservations' => $loop->reservationsWhichIIntersect(),
        );
    }

    header('Content-type: application/json');
    print json_encode($output);
}

}
