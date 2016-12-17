<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
| -------------------------------------------------------------------------
| URI ROUTING
| -------------------------------------------------------------------------
| This file lets you re-map URI requests to specific controller functions.
|
| Typically there is a one-to-one relationship between a URL string
| and its corresponding controller class/method. The segments in a
| URL normally follow this pattern:
|
|	example.com/class/method/id/
|
| In some instances, however, you may want to remap this relationship
| so that a different class/function is called than the one
| corresponding to the URL.
|
| Please see the user guide for complete details:
|
|	http://codeigniter.com/user_guide/general/routing.html
|
| -------------------------------------------------------------------------
| RESERVED ROUTES
| -------------------------------------------------------------------------
|
| There area two reserved routes:
|
|	$route['default_controller'] = 'welcome';
|
| This route indicates which controller class should be loaded if the
| URI contains no data. In the above example, the "welcome" class
| would be loaded.
|
|	$route['404_override'] = 'errors/page_missing';
|
| This route will tell the Router what URI segments to use if those provided
| in the URL cannot be matched to a valid route.
|
*/

$route['default_controller'] = "mobile";

$route['404_override'] = '';

// We're phasing out separate mobile & desktop versions.
// Eventually we'll replace both those controllers with a single "map" controller.
// For now let's provide for "/map" as the main URL by routing to "mobile".
$route['map'] = "mobile";
$route['map/(:any)'] = "mobile/$1";

// Remap our "Short URLs" that start with "url/"
$route['url/(:any)'] = "mobile/url/$1";

// Marker management
$route['contributors/marker/(:num)'] = "contributors/marker_edit/$1";
$route['contributors/marker/(:num)/edit'] = "contributors/marker_edit/$1";
$route['contributors/marker/(:num)/delete'] = "contributors/marker_delete/$1";

// Hint Map management
$route['administration/hint_map/(:num)'] = "administration/hint_map_edit/$1";
$route['administration/hint_map/(:num)/edit'] = "administration/hint_map_edit/$1";
$route['administration/hint_map/(:num)/delete'] = "administration/hint_map_delete/$1";
$route['administration/hint_map/(:num)/refresh'] = "administration/hint_map_refresh/$1";

// Hint Map aliases
$route['hint/(:num)'] = "administration/hint_map_retrieve/$1";

/* End of file routes.php */
/* Location: ./application/config/routes.php */