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

    // tacked on May 2014: the category list should have icons...
    $data['poicategory_icons'] = array(
        'Archery' => 'archery.png',
        'Beach' => 'beach.png',
        'Boating' => 'boat.png',
        'Drinking Fountain' => 'drinkingfountain.png',
        'Exploring Culture & History' => 'history.png',
        'Exploring Nature' => 'nature.png',
        'Facilities' => 'facility.png',
        'Fishing & Ice Fishing' => 'fish.png',
        'Food' => 'food.png',
        'Geologic Feature' => 'geology.png',
        'Golfing' => 'golf.png',
        'Horseback Riding' => 'horse.png',
        'Kayaking' => 'kayak.png',
        'Picnicking' => 'picnic.png',
        'Play Areas' => 'play.png',
        'Restroom' => 'restroom.png',
        'Sledding & Tobogganing' => 'sled.png',
	    'Snowshoeing' => 'sled.png',
        'Swimming' => 'swim.png',
        'Viewing Wildlife' => 'wildlife.png',
    );

    // Activities
    $data['activities'] = ActivityType::getActivityTypesAndIcons();

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
