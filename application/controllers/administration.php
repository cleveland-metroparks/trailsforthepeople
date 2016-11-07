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