<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Browserdetect extends CI_Controller {

/*
    This controller is the default landing page. It detects whether they are Mobile or Desktop,
    and recommends accordingly, sending them to either the /mobile/ or /desktop/ URL
*/

function index() {
    $data = array();
    $data['options'] = array();

    // Removing Desktop version and moving to single responsive version only.
    //redirect( $this->agent->is_mobile() ? site_url('mobile/map') : site_url('desktop/map') );
    redirect(site_url('map'));

    /*
    if ($this->agent->is_mobile()) {
        $data['options'][] = array('url'=>site_url('mobile/map'), 'text'=>'Use the mobile version (recommended)');
        $data['options'][] = array('url'=>site_url('desktop/map'), 'text'=>'Use the desktop version');
    } else {
        $data['options'][] = array('url'=>site_url('desktop/map'), 'text'=>'Use the desktop version (recommended)');
        $data['options'][] = array('url'=>site_url('mobile/map'), 'text'=>'Use the mobile version');
    }
    $this->load->view('browserdetect/browserdetect.phtml', $data);
    */
}

function url($shorturl="") {
    $qstring = Shorturl::fetch_url($shorturl);
    return header("Location: " . site_url($qstring) );
}


}
