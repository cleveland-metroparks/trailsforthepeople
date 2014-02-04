<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Administration extends CI_Controller {

function __construct() {
    parent::__construct();
}



function login() {
    // must be using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');

    $this->load->helper('recaptchalib');

    // check the CAPTCHA
    $captcha_ok = recaptcha_check_answer($this->config->item('recaptcha_private_key'), $_SERVER["REMOTE_ADDR"], @$_POST['recaptcha_challenge_field'], @$_POST['recaptcha_response_field']);
    $captcha_ok = $captcha_ok->is_valid;
    //$captcha_ok = 'True';
    // check their username & password, which are simple static configs
    $login_ok = (@$_POST['username'] and $_POST['username']==$this->config->item('admin_user') and @$_POST['password'] and $_POST['password']==$this->config->item('admin_pass'));

    if ($login_ok and $captcha_ok) {
        $this->session->set_userdata('admin', TRUE);
        Auditlog::log_message("Successful login to admin panel",'administrator');
        return redirect(ssl_url('administration/'));
    }

    // if they got here, then login failed; but if the CAPTCHA was good and the password was bad, then it was truly a failed login attempt
    if ($captcha_ok and ! $login_ok) Auditlog::log_message("Failed login attempt to admin panel", 'administrator');

    // if we got here, it must not have worked out
    $this->session->unset_userdata('admin');

    $data = array();
    $data['recaptcha'] = recaptcha_get_html( $this->config->item('recaptcha_public_key'), null, true );

    $this->load->view('administration/login.phtml', $data);
}


function logout() {
    // must be using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');

    // wow, they actually logged out? log it!
    Auditlog::log_message("Successful logout from admin panel",'administrator');

    // purge their token, send them to the login page
    $this->session->unset_userdata('admin');
    redirect(ssl_url('administration/login'));
}


function auditlog() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    $data = array();
    $data['logs'] = Auditlog::fetch_messages();
    $this->load->view('administration/auditlog.phtml', $data);
}



function index() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    $this->load->view('administration/mainmenu.phtml');
}


function contributors() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // simply make a list of all contributors in the system
    $data = array();
    $data['contributors'] = new Contributor();
    $data['contributors']->get();

    // and print it out
    $this->load->view('administration/contributors.phtml', $data);
}



function contributor($id) {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

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
    if (@$_POST['password']) $data['contributor']->setPassword($_POST['password']);
    $data['contributor']->save();

    // log this event and done
    Auditlog::log_message( sprintf("Contributor edited: %s", htmlspecialchars($data['contributor']->email) ) , 'administrator');
    redirect(ssl_url('administration/contributors'));
}


function deletecontributor() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

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



function markers() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // simply make a list of all contributors in the system
    $data = array();
    $data['markers'] = new Marker();
    $data['markers']->get();

    // and print it out
    $this->load->view('administration/markers.phtml', $data);
}



function marker($id) {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // load the marker's info
    $data = array();
    $data['marker'] = null;
    if ((integer) $id) {
        $data['marker'] = new Marker();
        $data['marker']->where('id',$id)->get();
        if (! $data['marker']->id) return redirect(ssl_url('administration/markers'));
    }

    // and show the details, that's all
    $this->load->view('administration/marker.phtml', $data);
}


function deletemarker() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // fetch it, delete it
    $marker = new Marker();
    $marker->where('id',@$_POST['id'])->get();
    if ($marker->id) {
        Auditlog::log_message( sprintf("Marker deleted: %s by %s", htmlspecialchars($contributor->title), htmlspecialchars($contributor->creator) ) , 'administrator');
        $marker->delete();
    }

    // we're outta here
    redirect(ssl_url('administration/markers'));
}




function purge_tilestache() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // bail to the OK form
    if (! @$_POST['ok']) return $this->load->view('administration/purge_tilestache.phtml');

    // print the HTML header; MVC violation ahead, as we delete and send incremental progress
    print $this->load->view('administration/header.phtml', array(), TRUE);

    // okay, go for it; one directory at a time so we can generate status and output
    // warning: MVC violation, generating our own output so we can send incrementally and not time out the browser
    function rrmdir($path) {
        return is_file($path) ? @unlink($path): array_map('rrmdir',glob($path.'/*'))==@rmdir($path);
    }
    foreach (glob(sprintf("%s/*/??", $this->config->item('tilestache_tiles_directory') )) as $dir) {
        printf("%s<br/>\n", $dir);
        ob_flush();
        rrmdir($dir);
    }

    // done!
    print "<p>DONE!</p>\n";
    print $this->load->view('administration/footer.phtml', array(), TRUE);
}





function seed_tilestache() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // bail to the OK form
    if (! @$_POST['ok']) return $this->load->view('administration/seed_tilestache.phtml');

    // some JavaScript to the client; yes, big MVC violation, see below for an even worse one  :)
    print $this->load->view('administration/header.phtml', array(), TRUE);

    // make up the command and run it in a new fork. the parent process will wait for it to exit, sending out progress reports based on the progress file
    $command = sprintf("%s -c %s -b %s -l %s -f %s %s", 
        $this->config->item('tilestache_seed'),
        $this->config->item('tilestache_cfg'),
        $this->config->item('tilestache_seed_bbox'),
        $this->config->item('tilestache_seed_layer'),
        $this->config->item('tilestache_progress_file'),
        implode(" " , $this->config->item('tilestache_seed_levels'))
    );

    // run it and send back the output. tougher than usual since seeder outputs to stderr and not stdout
    $progfile = $this->config->item('tilestache_progress_file');
    $handle = popen("$command 2>&1", 'r');
    while (! feof($handle)) {
        $output = fread($handle, 10240);
        if (! is_file($progfile) ) continue; // progress file may not exist for a few seconds
        $prog = json_decode(file_get_contents($progfile));
        if (! $prog or ! $prog->total ) continue; // file opened but no JSON in it yet, skip it

        // calculate a progress meter
        $prog->percent = round( 100 * (float) $prog->offset / (float) $prog->total );
        printf("Progress: %d / %d = %d %% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; %s<br/>\n", $prog->offset, $prog->total, $prog->percent, $prog->tile );
        flush();
    }
    pclose($handle);
    unlink( $progfile);

    // done!
    print "<p>DONE!</p>\n";
    print $this->load->view('administration/footer.phtml', array(), TRUE);
}

}
