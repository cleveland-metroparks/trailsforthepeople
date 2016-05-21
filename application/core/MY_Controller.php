<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
 * Extend CI core Controller class to create a base page template for backend pages.
 */
class MY_Controller extends CI_Controller {

function __construct()
{
    parent::__construct();
}

function _output($content)
{
    // Load the base template with output content available as $content
    $data['content'] = &$content;
    $data['mainmenu'] = $this->_generate_menu_markup($this->_mainmenu_array(), $this->uri->uri_string);
    $body_classes_array = array(
      'section-' . $this->router->class,
      'page-' . $this->router->method,
    );
    $data['body_classes'] = implode(' ', $body_classes_array);

    echo($this->load->view('backend_base', $data, true));
}

/*
 * From a menu array (simple custom data structure), generate markup to display it as a bootstrap menu.
 *
 * @see _mainmenu_array()
 */
private function _generate_menu_markup($menu, $active_path='') {
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
 * Return our back-end navigation main menu (in a custom format).
 *
 * @see _generate_menu_markup()
 */
private function _mainmenu_array() {
  $mainmenu_array = array(
    ///*
    // * Home
    // */
    //array(
    //  'url' => 'administration',
    //  'title' => 'Home'
    //),
    ///*
    // * Content
    // */
    //array(
    //  'url' => 'administration/index/content',
    //  'title' => 'Content'
    //),
    /*
     * Administration
     */
    array(
      'url' => 'administration',
      'title' => 'Administration',
      'submenu' => array(
        array(
          'url' => 'administration/contributors',
          'title' => 'Manage Contributors',
        ),
        array(
          'url' => 'administration/markers',
          'title' => 'Markers',
        ),
        array(
          'url' => 'administration/purge_tilestache',
          'title' => 'Purge Tilestache',
        ),
        array(
          'url' => 'administration/seed_tilestache',
          'title' => 'Seed Tilestache',
        ),
        array(
          'url' => 'administration/auditlog',
          'title' => 'Log',
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
          'submenu' => array(
            array(
              'url' => 'docs/index/admin/panel',
              'title' => 'Admin Panel',
            ),
            array(
              'url' => 'docs/index/admin/stack',
              'title' => 'Programming Language, Frameworks, Techniques',
            ),
            array(
              'url' => 'docs/index/admin/js_compression',
              'title' => 'Javascript Compression',
            ),
            array(
              'url' => 'docs/index/admin/mapfish_print',
              'title' => 'MapFish Print',
            ),
            array(
              'url' => 'docs/index/admin/db_load',
              'title' => 'Database Load',
            ),
            array(
              'url' => 'docs/index/admin/db_update',
              'title' => 'Database Update',
            ),
            array(
              'url' => 'docs/index/admin/tilestache',
              'title' => 'TileStache Basemap',
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
    /*
     * Testing
     */
    array(
      'url' => 'administration/testing',
      'title' => 'Testing'
    ),
    /*
     * Log out
     */
    array(
      'url' => 'administration/logout',
      'title' => 'Log out'
    ),
  );

  return $mainmenu_array;
}

}