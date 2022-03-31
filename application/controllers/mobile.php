<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Mobile extends CI_Controller {

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
