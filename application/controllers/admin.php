<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Admin extends MY_Controller {

function __construct() {
    parent::__construct();
}

/*
 *
 */
function index($which=null) {
  // must be logged in and using SSL to do this
  //if (! is_ssl() ) return $this->load->view('admin/sslrequired.phtml');
  if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

  $data = array();

  // Clean and assemble our path.
  // Each '/'-separated path element in the URL string will be passed as an argument to this function.
  $args = func_get_args();
  $path_parts = array();
  foreach ($args as $arg) {
    // Prune out any non-word characters to prevent filename attacks
    $path_parts[] = preg_replace('/\W/', '', $arg);
  }
  $which = implode('/', $path_parts);

  // then load the appropriate page (with .phtml extension)
  if (!$which) $which = "home";
  $this->load->view("admin/$which.phtml", $data);
}

}