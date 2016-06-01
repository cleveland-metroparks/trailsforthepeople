<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
 * Extend CI core Controller class to create a base page template for backend pages.
 */
class MY_Controller extends CI_Controller {

public $loggedin;

function __construct()
{
    parent::__construct();
    // Shortcuts for use in templates:
    // An associated array of the Contributor's info (and quick test for whether they're logged-in).
    $this->loggedin = $this->session->userdata('contributor');
}

function _output($content)
{
    // Load the base template with output content available as $content
    $data['content'] = &$content;
    $data['mainmenu_left'] = $this->_generate_menu_markup($this->_mainmenu_left_array(), $this->uri->uri_string);
    $data['mainmenu_right'] = $this->_generate_menu_markup($this->_mainmenu_right_array(), $this->uri->uri_string);
    $body_classes_array = array(
      'section-' . $this->router->class,
      'page-' . $this->router->method,
    );
    $data['body_classes'] = implode(' ', $body_classes_array);

    echo($this->load->view('backend_base', $data, true));
}

/*
 * Check that we're in SSL mode and that the user is logged-in.
 *
 * @param $check_admin:
 *   Whether to also ensure the user is an administrator.
 *
 * return:
 *   NULL if everything checks-out.
 *   Otherwise redirect or load appropriate page.
 */
protected function _user_access($area='') {
    $user = $this->session->userdata('contributor');
    // Must be logged-in
    if (!$user) {
        return redirect(ssl_url('administration/login'));
    }
    // Check if user has access to area. Admin overrides all areas.
    if (!empty($area)) {
        if (!$user['admin'] && !$user[$area]) {
            return redirect(ssl_url('administration/access_denied'));
        }
    }
}

/*
 * From our custom menu array, generate markup to display it as a bootstrap menu.
 *
 * Control access to menu items if specified with the item in the array,
 * checking user access stored in session.
 *
 * @see _mainmenu_left_array()
 * @see _mainmenu_right_array()
 */
private function _generate_menu_markup($menu, $active_path='') {
  // Only logged-in users have access to the menu.
  $user = $this->session->userdata('contributor');
  if (!$user) {
    return;
  }

  $markup = '';

  foreach ($menu as $item) {

    // Check if the menu item has access control restrictions.
    if (isset($item['access'])) {
      // Ensure user isn't admin (if they are, don't worry about specific area check)
      if (!isset($user['admin']) || !$user['admin']) {
        // Check access to area
        if (!isset($user[$item['access']]) || !$user[$item['access']]) {
          // Access denied.
          // Skip this menu item and move on to the next.
          //
          // Note that [currently] if access is denied to an item with a submenu,
          // we skip displaying the whole submenu too.
          continue;
        }
      }
    }

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
      $markup .= $this->_generate_menu_markup($item['submenu'], $active_path);
      $markup .= '</ul>';
    } else {
      $markup .= '<a href="' . ssl_url($item['url']) . '">' . $item['title'] . '</a>';
    }
    $markup .= '</li>' . "\n";
  }
  return $markup;
}

/*
 * Return our back-end navigation main menu right side as an array.
 *
 * @see _generate_menu_markup()
 */
private function _mainmenu_right_array() {
  $menu = array(
    /*
     * User Account
     */
    array(
      'url' => 'contributors/user',
      'title' => 'User Account'
    ),
    /*
     * Log out
     */
    array(
      'url' => 'administration/logout',
      'title' => 'Log Out'
    ),
  );
  return $menu;
}

/*
 * Return our back-end navigation main menu left side as an array.
 *
 * @see _generate_menu_markup()
 */
private function _mainmenu_left_array() {
  $menu = array(
    /*
     * Contributors
     */
    array(
      'url' => 'contributors',
      'title' => 'Contributors',
      'submenu' => array(
        array(
          'url' => 'contributors/trails',
          'title' => 'Trails',
          'access' => 'allow_trails',
        ),
        array(
          'url' => 'contributors/use_areas',
          'title' => 'Use Areas',
          'access' => 'allow_use_areas',
        ),
        array(
          'url' => 'contributors/markers',
          'title' => 'Markers',
          'access' => 'allow_markers',
        ),
        /*
         * Contributors: Loops
         */
        array(
          'url' => 'contributors/loops',
          'title' => 'Loops',
          'access' => 'allow_loops',
          'submenu' => array(
            array(
              'url' => 'contributors/autoloop',
              'title' => 'Autoloop Manual',
              'access' => 'allow_loops',
            ),
            array(
              'url' => 'contributors/autoloop_csv',
              'title' => 'Autoloop CSV',
              'access' => 'allow_loops',
            ),
          ),
        ),
        array(
          'url' => 'contributors/trailclosures',
          'title' => 'Trail Closures',
          'access' => 'allow_closures',
        ),
      ),
    ),
    /*
     * Administration
     */
    array(
      'url' => 'administration',
      'title' => 'Administration',
      'access' => 'admin',
      'submenu' => array(
        array(
          'url' => 'administration/contributors',
          'title' => 'Manage Contributors',
          'access' => 'admin',
        ),
        array(
          'url' => 'administration/markers',
          'title' => 'Markers',
          'access' => 'admin',
        ),
        array(
          'url' => 'administration/purge_tilestache',
          'title' => 'Purge Tilestache',
          'access' => 'admin',
        ),
        array(
          'url' => 'administration/seed_tilestache',
          'title' => 'Seed Tilestache',
          'access' => 'admin',
        ),
        array(
          'url' => 'administration/auditlog',
          'title' => 'Log',
          'access' => 'admin',
        ),
      ),
    ),
    /*
     * Docs
     */
    array(
      'url' => 'docs',
      'title' => 'Docs',
      'submenu' => array(
        /*
         * Docs: Content
         */
        array(
          'url' => 'docs/index/content/panel',
          'title' => 'Content &amp; Contributors',
          'submenu' => array(
            array(
              'url' => 'docs/index/content/panel',
              'title' => 'Content &amp; Contributors Panel',
            ),
          ),
        ),
        /*
         * Docs: Admin
         */
        array(
          'url' => 'docs/index/admin/panel',
          'title' => 'Administration',
          'access' => 'admin',
          'submenu' => array(
            array(
              'url' => 'docs/index/admin/panel',
              'title' => 'Admin Panel',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/stack',
              'title' => 'Programming Language, Frameworks, Techniques',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/js_compression',
              'title' => 'Javascript Compression',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/mapfish_print',
              'title' => 'MapFish Print',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/db_load',
              'title' => 'Database Load',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/db_update',
              'title' => 'Database Update',
              'access' => 'admin',
            ),
            array(
              'url' => 'docs/index/admin/tilestache',
              'title' => 'TileStache Basemap',
              'access' => 'admin',
            ),
          ),
        ),
        /*
         * Docs: CMS
         */
        array(
          'url' => 'docs/index/cms/cms',
          'title' => 'CMS &amp; Embedding',
          'submenu' => array(
            array(
              'url' => 'docs/index/cms/cms',
              'title' => 'The CMS and embedded map pages',
            ),
            array(
              'url' => 'docs/index/cms/finder',
              'title' => 'The Finders: embeddable search systems',
            ),
            array(
              'url' => 'docs/index/cms/url_params',
              'title' => 'Controlling map start view',
            ),
            array(
              'url' => 'docs/index/cms/loops',
              'title' => 'Loops',
            ),
            array(
              'url' => 'docs/index/cms/trail_closures',
              'title' => 'Trail Closures',
            ),
          ),
        ),
      ),
    ),
    ///*
    // * Testing
    // */
    //array(
    //  'url' => 'administration/testing',
    //  'title' => 'Testing'
    //),
  );

  return $menu;
}

}