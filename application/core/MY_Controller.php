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
    array(
      'url' => 'admin/index/home',
      'title' => 'Home'
    ),
    array(
      'url' => 'admin/index/content',
      'title' => 'Content'
    ),
    array(
      'url' => 'admin/index/admin',
      'title' => 'Administration',
      'submenu' => array(
        array(
          'url' => 'admin/contributors',
          'title' => 'Manage Contributors',
        ),
        array(
          'url' => 'admin/index/admin/data',
          'title' => 'Manage Data',
        ),
      ),
    ),
    array(
      'url' => 'admin/index/docs',
      'title' => 'Docs',
      'submenu' => array(
        array(
          'url' => 'admin/index/docs/content/panel',
          'title' => 'Content &amp; Contributors',
          'submenu' => array(
            array(
              'url' => 'admin/index/docs/content/panel',
              'title' => 'Content &amp; Contributors Panel',
            ),
          ),
        ),
        array(
          'url' => 'admin/index/docs/admin/panel',
          'title' => 'Administration',
          'submenu' => array(
            array(
              'url' => 'admin/index/docs/admin/panel',
              'title' => 'Admin Panel',
            ),
            array(
              'url' => 'admin/index/docs/admin/stack',
              'title' => 'Programming Language, Frameworks, Techniques',
            ),
            array(
              'url' => 'admin/index/docs/admin/js_compression',
              'title' => 'Javascript Compression',
            ),
            array(
              'url' => 'admin/index/docs/admin/mapfish_print',
              'title' => 'MapFish Print',
            ),
            array(
              'url' => 'admin/index/docs/admin/db_load',
              'title' => 'Database Load',
            ),
            array(
              'url' => 'admin/index/docs/admin/db_update',
              'title' => 'Database Update',
            ),
            array(
              'url' => 'admin/index/docs/admin/tilestache',
              'title' => 'TileStache Basemap',
            ),
          ),
        ),
        array(
          'url' => 'admin/index/docs/cms/cms',
          'title' => 'CMS &amp; Embedding',
          'submenu' => array(
            array(
              'url' => 'admin/index/docs/cms/cms',
              'title' => 'The CMS and embedded map pages',
            ),
            array(
              'url' => 'admin/index/docs/cms/finder',
              'title' => 'The Finders: embeddable search systems',
            ),
            array(
              'url' => 'admin/index/docs/cms/url_params',
              'title' => 'Controlling map start view',
            ),
          ),
        ),
      ),
    ),
    array(
      'url' => 'admin/index/testing',
      'title' => 'Testing'
    ),
  );

  return $mainmenu_array;
}

}