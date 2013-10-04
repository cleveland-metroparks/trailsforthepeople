<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Finder extends CI_Controller {

function trail() {
    $data = array();

    // Reservations
    $reservations = new Park();
    $reservations->order_by('res')->get();
    $data['reservations'] = $reservations;

    // if it was, generate the CMS output
    $this->load->view('finder/trail.phtml',$data);
}


}
