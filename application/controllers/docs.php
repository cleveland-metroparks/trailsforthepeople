<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Docs extends MY_Controller {


function __construct() {
    parent::__construct();
}

/*
 *
 */
function index($which=null) {
  // Require SSL
  if (! is_ssl() ) return $this->load->view('docs/sslrequired.phtml');
  if (! $this->session->userdata('contributor') ) return redirect(ssl_url('administration/login'));

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
  $this->load->view("docs/$which.phtml");
}

}
