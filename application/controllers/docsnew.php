<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class DocsNew extends CI_Controller {


function __construct() {
    parent::__construct();
}



function index($which=null) {
    // must be logged in and using SSL to do this
    //if (! is_ssl() ) return $this->load->view('docsnew/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    $data['mainmenu'] = $this->generate_menu_markup($this->mainmenu_array(), $this->uri->uri_string);

    // Clean and assemble our path.
    // Each '/'-separated path element in the URL string will be passed as an argument to this function.
    $args = func_get_args();
    $path_parts = array();
    foreach ($args as $arg) {
      // Prune out any non-word characters to prevent filename attacks
      $path_parts[] = preg_replace('/\W/', '', $arg);
    }
    $which = implode('/', $path_parts);

    // then load $which.phtml
    if (! $which) $which = "home";
    $this->pagename = $which;
    //$this->get_main_menu() = get_main_menu();
    $this->load->view("docsnew/$which.phtml", $data);
}

/*
 * From a menu array (simple custom data structure), generate markup to display it as a bootstrap menu.
 *
 * @see mainmenu_array()
 */
function generate_menu_markup($menu, $active_path='') {
  $markup = '';
  foreach ($menu as $item) {

    $classes = array();
    if (isset($item['url']) && $item['url'] == $active_path) {
      $classes[] = 'active';
    }
    if (isset($item['submenu'])) {
      $classes[] = 'dropdown';
    }

    $classes_str = ' class="';
    $i=0;
    foreach ($classes as $class) {
      $classes_str .= ($i++ > 0) ? ' ' : '';
      $classes_str .= $class;
    }
    $classes_str .= '"';

    $markup .= '<li' . $classes_str . '>';

    if (isset($item['submenu'])) {
      if (isset($item['url'])) {
        $markup .= '<a href="' . ssl_url($item['url']) . '" role="button" aria-haspopup="true" aria-expanded="true">' . $item['title'] . ' <span class="caret"></span></a>';
      } else {
        $markup .= '<a href="#" role="button" aria-haspopup="true" aria-expanded="true">' . $item['title'] . ' <span class="caret"></span></a>';
        //$markup .= $item['title'] . ' <span class="caret"></span></a>';
      }
      $markup .= '<ul class="dropdown-menu">';
      $markup .= $this->generate_menu_markup($item['submenu'], $active_path);
      $markup .= '</ul>';
    } else {
      $markup .= '<a href="' . ssl_url($item['url']) . '">' . $item['title'] . '</a>';
    }
    $markup .= '</li>' . "\n";
  }
  return $markup;
}

/*
 * Return our back-end navigation main menu (in a custom format).
 *
 * @see generate_menu_markup()
 */
function mainmenu_array() {
  $mainmenu_array = array(
    array(
      'url' => 'docsnew/index/home',
      'title' => 'Home'
    ),
    array(
      'url' => 'docsnew/index/content',
      'title' => 'Content'
    ),
    array(
      'url' => 'docsnew/index/admin',
      'title' => 'Administration',
      'submenu' => array(
        array(
          'url' => 'docsnew/index/admin/users',
          'title' => 'Manage Users',
        ),
        array(
          'url' => 'docsnew/index/admin/data',
          'title' => 'Manage Data',
        ),
      ),
    ),
    array(
      'url' => 'docsnew/index/docs',
      'title' => 'Docs',
      'submenu' => array(
        array(
          'url' => 'docsnew/index/docs/content/panel',
          'title' => 'Content &amp; Contributors',
          'submenu' => array(
            array(
              'url' => 'docsnew/index/docs/content/panel',
              'title' => 'Content &amp; Contributors Panel',
            ),
          ),
        ),
        array(
          'url' => 'docsnew/index/docs/admin/panel',
          'title' => 'Administration',
          'submenu' => array(
            array(
              'url' => 'docsnew/index/docs/admin/panel',
              'title' => 'Admin Panel',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/stack',
              'title' => 'Programming Language, Frameworks, Techniques',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/js_compression',
              'title' => 'Javascript Compression',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/mapfish_print',
              'title' => 'MapFish Print',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/db_load',
              'title' => 'Database Load',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/db_update',
              'title' => 'Database Update',
            ),
            array(
              'url' => 'docsnew/index/docs/admin/tilestache',
              'title' => 'TileStache Basemap',
            ),
          ),
        ),
        array(
          'url' => 'docsnew/index/docs/cms/cms',
          'title' => 'CMS &amp; Embedding',
          'submenu' => array(
            array(
              'url' => 'docsnew/index/docs/cms/cms',
              'title' => 'The CMS and embedded map pages',
            ),
            array(
              'url' => 'docsnew/index/docs/cms/finder',
              'title' => 'The Finders: embeddable search systems',
            ),
            array(
              'url' => 'docsnew/index/docs/cms/url_params',
              'title' => 'Controlling map start view',
            ),
          ),
        ),
      ),
    ),
    array(
      'url' => 'docsnew/index/testing',
      'title' => 'Testing'
    ),
  );

  return $mainmenu_array;
}

}