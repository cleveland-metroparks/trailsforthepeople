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
  if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
  // Require logged-in user
  if ($this->_user_access() !== NULL) return;

  // Clean and assemble our path.
  // Each '/'-separated path element in the URL string will be passed as an argument to this function.
  $args = func_get_args();
  $path_parts = array();
  foreach ($args as $arg) {
    // Prune out any non-word characters to prevent filename attacks
    $path_parts[] = preg_replace('/\W/', '', $arg);
  }
  $which = implode('/', $path_parts);

  // Access control for particular docs sections
  if (isset($path_parts[0])) {
    // Require admin user for the admin section
    if ($path_parts[0] == 'admin') {
      if ($this->_user_access('admin') !== NULL) return;
    }
    // Everything else currently just requires a logged-in user,
    // for which we've already checked.
  }

  // then load the appropriate page (with .phtml extension)
  if (!$which) $which = "home";
  $this->load->view("docs/$which.phtml");
}

}
