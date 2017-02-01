<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Mobile extends CI_Controller {


/**
 *
 */
function index() {
    $data = array();

    // very little data loaded here: mostly it's later on in AJAX handlers,
    // as we don't want to flood and crash poor mobile devices

    // placeholder Reservations for various Find By Reservation listings
    $reservations = new Park();
    $reservations->order_by('res')->get();
    $data['reservations'] = $reservations;

    // a list of all reservations which contain Loops, as determined by the Loops' "reservations" field
    $loopreservations = Loop::listReservations();
    $data['loopreservations'] = $loopreservations;

    // the placeholder categories for POIs
    $data['poicategories'] = Usearea::listCategories();

    // Activities (chosen sub-set only)
    //$data['activities'] = ActivityType::getActivityTypesAndIcons(TRUE);
    // Only chosen activities that have attractions
    $data['activities'] = ActivityType::getActivitiesWithAttractions(TRUE);

    // ready!
    $this->load->view('mobile/mobile.phtml',$data);
}

/**
 * Allow for URLs from old "mobile/map" scheme.
 */
function map() {
    return redirect(site_url('/'));
}

/**
 * Short URLs.
 */
function url($shorturl="") {
    $qstring = Shorturl::fetch_url($shorturl);
    return header("Location: " . site_url($qstring) );
}

}
