<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Docs extends CI_Controller {


function __construct() {
    parent::__construct();
}



function index($which=null) {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('docs/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // prune out any non-word characters to prevent filename attacks, then load $which.phtml
    $which = preg_replace('/\W/', '', $which);
    if (! $which) $which = "mainmenu";
    $this->load->view("docs/$which.phtml");
}



}
