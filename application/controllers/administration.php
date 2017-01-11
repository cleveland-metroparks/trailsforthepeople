<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Administration extends MY_Controller {

function __construct() {
    parent::__construct();

    // Add our administration & contributors (shared) JS as a <script> include.
    $this->_add_js_include('static/admin/admin-contrib.js');

    // Add our administration JS as a <script> include.
    $this->_add_js_include('static/admin/admin.js');
}

///*
// * Check that we're in SSL mode and that the user is logged-in.
// *
// * @param $check_admin:
// *   Whether to also ensure the user is an administrator.
// *
// * return:
// *   NULL if everything checks-out.
// *   Otherwise redirect or load appropriate page.
// */
//private function _check_ssl() {
//    if (!is_ssl()) {
//        return $this->load->view('administration/sslrequired.phtml');
//    }
//}

/*
 * index()
 */
function index() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    // Don't require admin, since the top-level page is "home" and default post-login.
    if ($this->_user_access() !== NULL) return;

    $this->load->view('administration/home.phtml');
}

/*
 * Login
 */
function login() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');

    // If already logged-in, redirect to user account page
    if ($this->loggedin) {
        return redirect(ssl_url('contributors/user'));
    }

    // if they submitted a user & pass AND it matches the salted SHA1 hash, good
    // set their session variable and send them onward
    if (@$_POST['username'] and $_POST['password']) {
        // fetch their account and check their password
        $account = new Contributor();
        $account->where('email',$_POST['username'])->get();
        $login_ok = ($account->id && $account->checkPassword($_POST['password']));

        // if both passed, they're in.
        // capture a bunch of their Contributor attributes into a session variable
        // that can be used in templates or this controller via $this->loggedin
        if ($login_ok) {
            Auditlog::log_message("Successful login", $account->email);
            $this->session->set_userdata('contributor', $account->buildSessionDataArray());
            return redirect(ssl_url('administration'));
        } else {
            Auditlog::log_message("Failed login attempt", $_POST['username']);
        }
    }

    // If we got here, the login failed or the form has not yet been successfully submitted
    $this->session->unset_userdata('contributor');

    $this->load->view('administration/login.phtml');
}

/*
 * Log out
 */
function logout() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');

    // wow, they actually logged out? log it!
    Auditlog::log_message("Successful logout from admin panel",'administrator');

    // purge their token, send them to the login page
    $this->session->unset_userdata('contributor');
    redirect(ssl_url('administration/login'));
}

/*
 * Access Denied
 */
function access_denied() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');

    $this->load->view('administration/access_denied.phtml');
}

/*
 * System Audit Log
 */
function auditlog() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    $data = array();
    $data['logs'] = Auditlog::fetch_messages();
    $this->load->view('administration/auditlog.phtml', $data);
}

/*
 * List Contributors
 */
function contributors() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    // simply make a list of all contributors in the system
    $data = array();
    $data['contributors'] = new Contributor();
    $data['contributors']->get();

    // and print it out
    $this->load->view('administration/contributors.phtml', $data);
}

/*
 * Add/Edit Contributor
 */
function contributor($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    // if the ID# 0 was given, either reuse a current record with a blank username OR create such a blank and use it
    if ($id == "0") {
        $con = new Contributor();
        $con->where('realname','')->where('email','')->get();
        if (!$con->id) {
            $con->realname = "";
            $con->email    = "";
            $con->password = "";
            $con->save();
        }
        $id = $con->id;
    }

    // load the contributor's info
    $data = array();
    $data['contributor'] = null;
    if ((integer) $id) {
        $data['contributor'] = new Contributor();
        $data['contributor']->where('id',$id)->get();
        if (! $data['contributor']->id) return redirect(ssl_url('administration/contributors'));
    }

    // are they saving info? if not, bail to a form
    if (!@$_POST['realname']) return $this->load->view('administration/contributor.phtml', $data);
    // okay, they ARE saving; do it

    // sanity check: check against duplicate email; that would be a DB error
    $_POST['email'] = strtolower($_POST['email']);
    $already = new Contributor();
    $already->where('email',$_POST['email'])->where('id !=', $id)->get();
    if ($already->id) return print "That email address is already registered. Click your Back button and try again.";

    // save the contributor's info
    $data['contributor']->realname       = $_POST['realname'];
    $data['contributor']->email          = $_POST['email'];
    $data['contributor']->admin          = $_POST['admin'];
    $data['contributor']->allow_swgh     = $_POST['allow_swgh'];
    $data['contributor']->allow_markers  = $_POST['allow_markers'];
    $data['contributor']->allow_loops    = $_POST['allow_loops'];
    $data['contributor']->allow_closures = $_POST['allow_closures'];
    $data['contributor']->allow_twitter  = $_POST['allow_twitter'];
    $data['contributor']->allow_hintmaps = $_POST['allow_hintmaps'];
    if (@$_POST['password1']) $data['contributor']->setPassword($_POST['password1']);
    $data['contributor']->save();

    // log this event and done
    Auditlog::log_message( sprintf("Contributor edited: %s", htmlspecialchars($data['contributor']->email) ) , 'administrator');
    redirect(ssl_url('administration/contributors'));
}

/*
 * Delete Contributor
 */
function deletecontributor() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    // fetch it, log it, delete it
    $contributor = new Contributor();
    $contributor->where('id',@$_POST['id'])->get();
    if ($contributor->id) {
        Auditlog::log_message( sprintf("Contributor deleted: %s", htmlspecialchars($contributor->email) ) , 'administrator');
        $contributor->delete();
    }

    // we're outta here
    redirect(ssl_url('administration/contributors'));
}

/*
 * Purge Tilestache
 */
function purge_tilestache() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    return $this->load->view('administration/purge_tilestache.phtml');
}

/*
 * Seed Tilestache
 */
function seed_tilestache() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require admin user
    if ($this->_user_access('admin') !== NULL) return;

    return $this->load->view('administration/seed_tilestache.phtml');
}

/*
 * List Hint Maps
 */
function hint_maps() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    // Get all Hint Maps
    $data = array();
    $data['hint_maps'] = new HintMap();
    $data['hint_maps']->get();

    // Load template
    $this->load->view('administration/hint_maps.phtml', $data);
}

/*
 * Add/Edit Hint Map
 */
function hint_map_edit($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    // Add new hint map entry
    if ($id == "0") {
        $hint_map = new HintMap();
        $id = $hint_map->id;
    }

    // load the hint map info
    $data = array();
    $data['hint_map'] = null;
    if ((integer) $id) {
        $data['hint_map'] = new HintMap();
        $data['hint_map']->where('id', $id)->get();
        if (! $data['hint_map']->id) return redirect(ssl_url('administration/hint_maps'));
    }

    return $this->load->view('administration/hint_map_edit.phtml', $data);
}

/*
 * Save Hint Map
 */
function hint_map_save() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    $myid = $this->loggedin;

    $hint_map = new HintMap();

    // Fetch if we're editing existing
    if (@$_POST['id']) {
        $hint_map->where('id', $_POST['id']);
        $hint_map->get();
        if (! $hint_map->id) return redirect(ssl_url('administration/hint_maps'));
    }

    // If url_external has changed or this is a new record,
    // we'll need to download the image
    if ($hint_map->url_external != $_POST['url_external']) {
        $save_image = TRUE;
    }

    $hint_map->title        = $_POST['title'];
    $hint_map->url_external = $_POST['url_external'];

    // Set "last edited" timestamp
    $postgre_timestamp_format = 'Y-m-d H:i:s';
    $hint_map->last_edited = date($postgre_timestamp_format);

    $hint_map->save();

    // Log
    Auditlog::log_message(
        sprintf(
            "Hint Map '%s' saved (id: %d).",
            $hint_map->title,
            $hint_map->id
        ),
        $myid['email']);

    // Download the image
    if ($save_image) {
        $this->__hint_map_cache_save($hint_map->id);
    }

    redirect(ssl_url('administration/hint_maps'));
}

/*
 * Get hint map from external source and save locally.
 */
private function __hint_map_cache_save($id) {
    $myid = $this->loggedin;

    $hint_map = new HintMap();
    $hint_map->where('id', $id)->get();

    // Download file to temp dir
    $local_filename_temp = 'hint_' . $id . '_tmp';
    $local_filepath_temp = $this->config->item('temp_dir') . '/' . $local_filename_temp;

    // Download and save image
    file_put_contents($local_filepath_temp, fopen($hint_map->url_external, 'r'));

    // Figure out file MIME type, and corresponding extension
    $mimetype = mime_content_type($local_filepath_temp);
    switch ($mimetype) {
        case 'image/png':
              $file_ext = 'png';
              break;
        case 'image/jpeg':
              $file_ext = 'jpg';
              break;
        case 'image/gif':
              $file_ext = 'gif';
              break;
        case 'image/bmp':
              $file_ext = 'bmp';
              break;
        case 'image/tiff':
              $file_ext = 'tif';
              break;
        case 'image/svg+xml':
              $file_ext = 'svg';
              break;
        default:
              $file_ext = '';
    }

    // Build local file path
    $local_filename = 'hint-' . $id . '.' . $file_ext;
    $local_dir = $this->config->item('hint_maps_dir');
    $local_filepath = $local_dir . '/' . $local_filename;

    // Move and rename with file extension
    if (!rename($local_filepath_temp, $local_filepath)) {
        Auditlog::log_message(
            sprintf(
                "Error: Hint Map image could not be moved from '%s' to '%s'.",
                $local_filepath_temp,
                $local_filepath
            ),
            $myid['email']);
        return;
    }

    $hint_map->image_filename_local = $local_filename;

    // Set "last refreshed" timestamp
    $postgre_timestamp_format = 'Y-m-d H:i:s';
    $hint_map->last_refreshed = date($postgre_timestamp_format);

    $hint_map->save();

    Auditlog::log_message(
        sprintf(
            "Hint Map '%s' image saved/refreshed (id: %d).",
            $hint_map->title,
            $hint_map->id
        ),
        $myid['email']);
}

/*
 * Essentially an alias for hint_map_cache(), run from listing/management page.
 */
function hint_map_refresh($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    $this->__hint_map_cache_save($id);

    return redirect(ssl_url('administration/hint_maps'));
}

/*
 * Delete Hint Map
 */
function hint_map_delete($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    // Delete or confirm
    if (!empty($_POST['submit']) ) {
        // Perform the delete
        $hint_map = new HintMap();
        $hint_map->where('id', $id)->get();

        if ($hint_map->id) {
            $myid = $this->loggedin;
            Auditlog::log_message(
                sprintf("Hint Map deleted: \"%s\" (id: %d)",
                    htmlspecialchars($hint_map->title),
                    $hint_map->id),
                $myid['email']
            );
            $hint_map->delete();
        }

        redirect(ssl_url('administration/hint_maps'));
    } else {
        // Show confirmation form
        // Load the hint map info
        $data = array();
        $data['hint_map'] = null;

        if ((integer) $id) {
            $data['hint_map'] = new HintMap();
            $data['hint_map']->where('id', $id)->get();

            // @TODO: How to bail?
            if (!$data['hint_map']->id) {
                return redirect(ssl_url('administration/hint_maps'));
            }
        }
        $this->load->view('administration/hint_map_delete.phtml', $data);
    }
}

/*
 * Download metadata on hint maps in CSV form.
 *
 * Rows include Title and URL
 */
function hint_maps_download_csv() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    $this->load->helper('download');

    // Get all Hint Maps
    $hint_maps = new HintMap();
    $hint_maps->get();

    $datestamp = date('Ymd-His');
    $csv_filename = 'hint_maps-' . $datestamp . '.csv';

    $csv_filepath_tmp = $this->config->item('temp_dir') . '/' . $csv_filename;
    $file_tmp = fopen($csv_filepath_tmp, 'w');

    fputcsv($file_tmp, array("Title", "URL"));
    foreach ($hint_maps as $hint_map) {
        $row = array($hint_map->title, $hint_map->hint_url(TRUE));
        fputcsv($file_tmp, $row);
    }

    fclose($file_tmp);
    $file_data = file_get_contents($csv_filepath_tmp);
    force_download($csv_filename, $file_data);
}

/*
 * Get a hint map image. For our aliasing (see routes.php).
 */
function hint_map_retrieve($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Hint Maps" permission
    if ($this->_user_access('allow_hint_maps') !== NULL) return;

    $hint_map = new HintMap();
    $hint_map->where('id', $id)->get();
    return redirect(ssl_url($hint_map->local_image_url()));
}

///*
// * Testing
// */
//function testing() {
//    // Require SSL
//    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
//    // Require admin user
//    if ($this->_user_access('admin') !== NULL) return;
//
//    $this->load->view('administration/testing.phtml');
//}


}