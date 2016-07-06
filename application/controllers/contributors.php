<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Contributors extends MY_Controller {

function __construct() {
    parent::__construct();

    // Add our contributors JS as a <script> include.
    $this->_add_js_include('static/contributors/contributors.js');
}


// purge the tile cache for a given type of change, e.g. clear the Closures tiles
// Dec 2014: the $changedfeauretype has no effect as Closures and Markers are both in the same tile layer (geoserver_features)
//           but this is in place should they be teased apart again some day, or otherwise require special treatment
private function _clearTileCache($changedfeauretype) {
    $layers = array('geoserver_features','geoserver_labels','geoserver_labels_aerial','satphoto_mobilestack','basemap_mobilestack');
    foreach ($layers as $layer) {
        $tiledirs = glob("/var/tilestache/tiles/$layer/[1][0-9]");
        foreach ($tiledirs as $tilesubdir) $this->delTree($tilesubdir);
    }
}
private function delTree($dir) {
    if (! $dir) throw new Exception("delTree called without a directory!");
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
      error_log("$dir/$file");
      (is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
}

/*
 * Login
 *
 * Deprecated; using administration for this now.
 */
function login() {
    return redirect(ssl_url('administration/login'));
}

/*
 * Logout
 *
 * Deprecated; using administration for this now.
 */
function logout() {
    return redirect(ssl_url('administration/logout'));
}

/*
 * User Account page
 */
function user() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    $data = array();

    // Make an array of the back-end areas the user has access to
    $all_areas = array(
        'admin' => 'Admin',
        'allow_swgh' => 'SWGH',
        'allow_markers' => 'Markers',
        'allow_loops' => 'Loops',
        'allow_closures' => 'Closures',
    );
    $access_areas = array();
    foreach ($all_areas as $k => $v) {
        if ($this->loggedin[$k] == 't') {
            $access_areas[] = $v;
        }
    }
    $data['access_areas'] = $access_areas;

    // They've successfully submitted the Change Password form
    if (!empty($_POST['password1'])) {
        // Fetch user's Contributor account
        $contributor = new Contributor();
        $contributor->where('id', $this->loggedin['id'] )->get();
        $contributor->setPassword($_POST['password1']);
    }

    $this->load->view('contributors/user.phtml', $data);
}


function index() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    $this->load->view('contributors/home.phtml');
}



function markers() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $myid = $this->loggedin;

    $data = array();

    // fetch the marker list, MY OWN markers with possible filters
    $data['markers'] = new Marker();
    $data['markers']->where('creatorid', $myid['id']);
    if (@$_GET['expired']) {
        $myid = $this->loggedin;
        $data['markers']->where('expires <',  date('Y-m-d') );
    }
    $data['markers']->get();
    $data['markers_count'] = $data['markers']->result_count();

    // fetch the marker list, MY OWN markers with possible filters
    if ($this->loggedin['admin']) {
        $data['other_markers'] = new Marker();
        $data['other_markers']->where('creatorid !=', $myid['id']);
        if (@$_GET['expired']) {
            $myid = $this->loggedin;
            $data['other_markers']->where('expires <',  date('Y-m-d') );
        }
        $data['other_markers']->get();
        $data['other_markers_count'] = $data['other_markers']->result_count();
    }

    // display it
    $this->load->view('contributors/markers.phtml', $data);
}


function marker($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $myid = $this->loggedin;

    // load the marker info, if any; note the extra WHERE to ensure that we own the marker
    $data = array();
    $data['marker'] = null;
    if ((integer) $id) {
        $data['marker'] = new Marker();
        $data['marker']->where('id',$id);
        if (! $this->loggedin['admin'] ) {
            // not an admin, then make sure the owner ID matches too
            $data['marker']->where('creatorid', $myid['id']);
        }
        $data['marker']->get();
        if (! $data['marker']->id) return redirect(ssl_url('contributors/markers'));
    }

    // load the list of categories; very specific to the combination of permissions
    if ($this->loggedin['admin']) {
        $data['categories'] = array(
            "Health and Fitness Tips",
            "Events",
            "Seasonal Natural Features",
            "Nature Alerts",
            "Trail Closures and Construction",
        );
    } else if ($this->loggedin['allow_swgh']) {
        $data['categories'] = array(
            "Health and Fitness Tips",
            "Events",
        );
    } else {
        $data['categories'] = array(
            "Events",
            "Seasonal Natural Features",
            "Nature Alerts",
            "Trail Closures and Construction",
        );
    }

    // ready, set, show!
    $this->load->view('contributors/marker.phtml', $data);
}

function deletemarker() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $myid = $this->loggedin;

    // fetch it, delete it
    $marker = new Marker();
    $marker->where('id',@$_POST['id']);
    if (! $this->loggedin['admin'] ) {
        // not an admin, then make sure the owner ID matches too
        $marker->where('creatorid', $myid['id']);
    }
    $marker->get();
    if ($marker->id) {
        $email = $this->loggedin;
        $email = $email['email'];
        Auditlog::log_message( sprintf("Marker deleted: %s", htmlspecialchars($marker->title)) , $email);

        $marker->delete();
    }

    // purge the tile cache
    $this->_clearTileCache('marker');

    // we're outta here
    redirect(ssl_url('contributors/markers'));
}


function savemarker() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $myid = $this->loggedin;

    // fetch the record we're updating, or create a new record and set its ownership/creator info
    if (@$_POST['id']) {
        $marker = new Marker();
        $marker->where('id',$_POST['id']);
        $marker->where('creatorid', $myid['id']);
        $marker->get();
        if (! $marker->id) return redirect(ssl_url('contributors/markers'));
    } else {
        $marker = new Marker();
        $myid = $this->loggedin;
        $marker->creatorid = $myid['id'];
        $marker->creator   = $myid['realname'];
        $marker->created   = date('Y-m-d');
    }

    // save the plain and simple fields to the database, accounting for some possibly NULL fields
    if (!$_POST['expires']) $_POST['expires'] = null;
    $asisfields = array( 'lat', 'lng', 'content', 'title', 'expires', 'startdate', 'annual', 'category' );
    foreach ($asisfields as $fieldname) {
        $marker->{$fieldname} = $_POST[$fieldname];
    }
    $marker->save();

    // update the geometry
    $this->db->query("UPDATE markers SET geom=ST_GeometryFromText('POINT(? ?)',4326) WHERE id=?", array( (float) $marker->lng, (float) $marker->lat, $marker->id ) );

    // now enable/disable the marker based on its startdate and expires date
    $today = date('Y-m-d');
    $marker->enabled = 1;
    if ($marker->startdate and $marker->startdate > $today) $marker->enabled = 0;
    if ($marker->expires and $marker->expires < $today) $marker->enabled = 0;
    $marker->save();

    // purge the tile cache
    $this->_clearTileCache('marker');

    // done
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message( sprintf("Marker edited: %s", htmlspecialchars($marker->title)) , $email);
    redirect(ssl_url('contributors/markers'));
}




function autoloop() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    $myid = $this->loggedin;

    $this->load->view('contributors/autoloop.phtml');
}


function autoloop_csv() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    $myid = $this->loggedin;

    // is a CSV file uploaded? no? then bail
    $csvfilename = @$_FILES['csv']['tmp_name'];
    if (! $csvfilename or ! is_uploaded_file($csvfilename)) return $this->load->view('contributors/autoloop_csv.phtml');

    // check the first line of the CSV file, make sure we get a string and two floats
    $csv = fopen($csvfilename,'r');
    $line = fgetcsv($csv);
    fclose($csv);
    $error = null;
    if (sizeof($line) != 3) $error = "Must have 3 columns (Name, Lat, Lon) and no header/title row.";
    if ((integer) $line[0] or ! (float) $line[1] or ! (float) $line[2])$error = "Columns must be in this order: Name, Lat, Lon. There must be no header/title row.";
    if ($line[1] < 0) $error = "Lat & Lon columns seem to be switched. Lat goes into column 2, Lon in 3.";
    if ($line[2] > 0) $error = "Lat & Lon columns seem to be switched. Lat goes into column 2, Lon in 3.";
    if ($error) return print "Invalid CSV file. $error";

    // well, proceed: close and reopen the file so we reset the file pointer, then iterate over lines
    // for each line, iterate over use types and miles and generate loops!
    $stats = array( 'total' => 0, 'good' => 0, 'bad' => 0 );
    $csv = fopen($csvfilename,'r');
    while ($line = fgetcsv($csv)) {
        $name = $line[0];
        $lat  = $line[1];
        $lon  = $line[2];
        foreach (array(5,10,15,20,25) as $miles) {
            foreach (array('hike','bike_advanced','bridle') as $usetype) {
                // compose the URL, then visit it and fetch the reply
                $url = sprintf("%s?lat=%f&lon=%f&miles=%d&usetype=%s&basename=%s&creatorid=%d",
                    ssl_url('ajax/autoloop'),
                    $lat, $lon,
                    $miles,
                    $usetype,
                    urlencode($name),
                    $this->loggedin['id']
                );
                // printf("%s<br/>\n", $url); flush();
                $response = file_get_contents($url);

                // an integer indicates success, anything else indicates failure; keep a tally
                $stats['total']++;
                if ( (integer) $response ) {
                    printf("%s, %d, %s = %s <br/>\n", $name, $miles, $usetype, 'OK');
                    flush();
                    $stats['good']++;
                } else {
                    printf("%s, %d, %s = %s <br/>\n", $name, $miles, $usetype, 'FAILED');
                    flush();
                    $stats['bad']++;
                }

                // this helps to flush the browser's own buffer so it prints the output more often. maybe. sometimes. hopefully.
                echo("<!--" .  str_repeat(".",4090) . "-->");
            }
        }
    }
    fclose($csv);

    // done, print the tally
    printf("DONE:  %d good, %d bad, %d total = %d%% success rate", $stats['good'], $stats['bad'], $stats['total'], 100*(float) $stats['good']/(float) $stats['total'] );
}



function loops() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    $myid = $this->loggedin;

    // simply make a list of all loops in the system
    // note the select() clause below to fetch only the fields of interest: the WKT and geom fields are expensive!
    $fields = 'id,name,creatorid,status,editedby,distancetext,closedloop,hike,bike,mountainbike,bridle';
    $data = array();
    $data['loops'] = new Loop();
    if (@$_GET['random'])$data['loops']->where('source', 'Random');
    else                 $data['loops']->where('source !=', 'Random');
    $data['loops']->select($fields)->get();

    // and print it out
    $this->load->view('contributors/loops.phtml', $data);
}



function loop($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    // load the loop's info
    $data = array();
    $data['loop'] = null;
    if ((integer) $id) {
        $data['loop'] = new Loop();
        $data['loop']->where('id',$id)->get();
        if (! $data['loop']->id) return redirect(ssl_url('contributors/loops'));

        // must be owner of the Loop, or an admin
        if (! $this->loggedin['admin'] and $data['loop']->creatorid != $this->loggedin['id']) {
            return redirect(ssl_url('contributors/loops'));
        }
    }

    // ready, set, show!
    $this->load->view('contributors/loop.phtml', $data);
}


function saveloop() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    // fetch the record we're updating, or create a new record
    if (@$_POST['id']) {
        $loop = new Loop();
        $loop->where('id',$_POST['id'])->get();
        if (! $loop->id) return redirect(ssl_url('contributors/loops'));

        // must be owner of the Loop, or an admin
        if (! $this->loggedin['admin'] and $loop->creatorid != $this->loggedin['id']) {
            return redirect(ssl_url('contributors/loops'));
        }
    } else {
        $loop = new Loop();
        $loop->creatorid = $this->loggedin['id'];
    }

    // save the plain and simple fields to the database
    $asisfields = array(
        'name', 'description',
        'bike', 'bridle', 'hike', 'mountainbike', 'difficulty', 'paved',
        'wp0lat', 'wp0lng','wp1lat', 'wp1lng', 'wp2lat', 'wp2lng', 'wp3lat', 'wp3lng', 'wp4lat', 'wp4lng', 'wp5lat', 'wp5lng', 'wp6lat', 'wp6lng', 'wp7lat', 'wp7lng', 'wp8lat', 'wp8lng', 'wp9lat', 'wp9lng', 
        'distance_feet', 'distancetext', 'duration_hike', 'durationtext_hike', 'duration_bike', 'durationtext_bike', 'duration_bridle', 'durationtext_bridle', 
        'wkt', 'elevation_profile', 'closedloop', 'terrain_filter', 
        'startdate','expires','annual',
        'status', 'source', 'editedby', 
    );
    if (!$_POST['expires']) $_POST['expires'] = null;
    foreach ($asisfields as $fieldname) {
        if (! @$_POST[$fieldname]) {
            switch (@$fieldname) {
                case 'distance_feet':
                case 'duration_hike':
                case 'duration_bike':
                case 'duration_bridle':
                    $_POST[$fieldname] = 0;
                    break;
            }
        }
        $loop->{$fieldname} = @$_POST[$fieldname];
    }
    $loop->save();

    // now the directions steps, in JSON format
    $steps = array();
    for ($i=0; $i<sizeof($_POST['text']); $i++) {
        $steps[] = array(
            'stepnumber' => $_POST['stepnumber'][$i],
            'text' => $_POST['text'][$i],
            'distance' => $_POST['distance'][$i],
            'timehike' => $_POST['timehike'][$i],
            'timebike' => $_POST['timebike'][$i],
            'timebridle' => $_POST['timebridle'][$i],
        );
    }
    $loop->steps = json_encode($steps);
    $loop->save();

    // the WKT is saved already; save it as a geometry in both SRSs, WGS84 and 3734
    // and calculate its centroid and WSEN bbox
    if (@$_POST['wkt']) {
        $this->db->query('UPDATE loops SET the_geom=ST_GeometryFromText(wkt,4326) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET geom=ST_TRANSFORM(ST_GeometryFromText(wkt,4326),3734) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET lat=ST_Y(ST_StartPoint(ST_GeometryN(the_geom,1))) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET lng=ST_X(ST_StartPoint(ST_GeometryN(the_geom,1))) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET boxw=ST_XMIN(the_geom) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET boxs=ST_YMIN(the_geom) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET boxe=ST_XMAX(the_geom) WHERE id=?', array($loop->id) );
        $this->db->query('UPDATE loops SET boxn=ST_YMAX(the_geom) WHERE id=?', array($loop->id) );
    }

    // the tsvector fulltext search
    $this->db->query("UPDATE loops SET search=to_tsvector(coalesce(name,'') || ' ' || coalesce(description,'') ) WHERE id=?", array($loop->id) );

    // now the list of intersecting reservations
    $this->db->query('SELECT update_loop_reservations(?)', array($loop->id) );

    // save the elevation profile image; they have a tempfile in the browser, save it by the loop's ID#
    if ($_POST['elevation_profile_image']) {
        $source = $_POST['elevation_profile_image'];
        $saveas = "static/photos/loops/{$loop->id}.jpg";
        copy($source,$saveas);
    }

    // done
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message( sprintf("Loop saved: %s", htmlspecialchars($loop->name) ) , $email);
    $url = $loop->source == 'random' ? ssl_url('contributors/loops?random=1') : ssl_url('contributors/loops');
    redirect($url);
}


function cloneloop($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    // fetch the original Loop
    $old_loop = new Loop();
    $old_loop->where('id',$id)->get();
    if (! $old_loop->id) return redirect(ssl_url('contributors/loops'));

    // log this event
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message( sprintf("Loop cloned: %s", htmlspecialchars($old_loop->name) ) , $email);

    // create a new Loop, and copy in all field values
    // then override some fields: remove the ID, editor, status, ...
    $new_loop = new Loop();
    foreach($old_loop->stored as $field=>$value) $new_loop->{$field} = $value;
    unset($new_loop->id);
    $new_loop->status    = 'New';
    $new_loop->editedby  = $this->loggedin['realname'];
    $new_loop->creatorid = $this->loggedin['id'];
    $new_loop->name      = substr("COPY of " . $new_loop->name, 0, 255 );
    $new_loop->save();

    // send them to the new Loop's editing page
    redirect( ssl_url("contributors/loop/{$new_loop->id}") );
}

function deleteloop() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    // log this event
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message( sprintf("Loop deleted: %s", htmlspecialchars($loop->name) ) , $email);

    // fetch it
    $loop = new Loop();
    $loop->where('id',@$_POST['id'])->get();
    if (! $loop->id) return redirect(ssl_url('contributors/'));

    // they must own it, or be an admin
    if (! $this->loggedin['admin'] and $loop->creatorid != $this->loggedin['id']) {
        return redirect(ssl_url('contributors/loops'));
    }

    // fine; delete it
    $loop->delete();

    // delete any static images associated with it
    $photo = "static/photos/loops/{$loop->id}.jpg";
    if (is_file($photo)) unlink($photo);

    // we're outta here
    redirect(ssl_url('contributors/loops'));
}



function twitter() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    // load the tweets and print 'em, is all
    $data = array();
    $data['tweets'] = new Twitter();
    $data['tweets']->limit(500)->where('deleted','f')->get();
    $this->load->view('contributors/twitter.phtml', $data);
}



function twitterbans() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    // load the list of banned twits and print 'em, is all
    $data = array();
    $data['twits'] = Twitter::getBanList(true);
    $this->load->view('contributors/twitterbans.phtml', $data);
}



function twitter_delete() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    Auditlog::log_message("Tweet deleted: {$_POST['id']}", $this->loggedin['email']);

    // fetch it, set its deleted flag, save
    $tweet = new Twitter();
    $tweet->where('id',@$_POST['id'])->get();
    $tweet->deleted = 't';
    $tweet->save();
    print 'ok';
}



function twitter_ban() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    // fetch the tweet, and get its username
    $username = new Twitter();
    $username->where('id',@$_POST['id'])->get();
    $username = $username->username;
    if (!$username) return print 'That tweet was not found.';

    Auditlog::log_message("Twitter account banned: {$username}", $this->loggedin['email']);

    // tag any existing posts as deleted
    $tweets = new Twitter();
    $tweets->where('username',$username)->get();
    foreach ($tweets as $tweet) {
        $tweet->deleted = 't';
        $tweet->save();
    }

    // add them to the ban list
    Twitter::addToBanList($username);

    // done!
    print 'ok';
}



function twitter_unban() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('administration/login'));

    // log the event and do the deed
    $username = @$_POST['username'];
    if ($username) {
        Auditlog::log_message( sprintf("Twitter account reinstated: %s", htmlspecialchars($username) ), $this->loggedin['email']);
        Twitter::removeFromBanList($username);
    }

    // done, just say OK
    print 'ok';
}

/*
 * Manage Trails Page
 */
function trails() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    //if (! $this->loggedin['allow_trails']) return redirect(ssl_url('contributors/'));

    $this->load->view('contributors/trails.phtml');
}

/*
 * Manage Use Areas Page
 */
function use_areas() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    // must have the permission to use this specific function
    //if (! $this->loggedin['allow_use_areas']) return redirect(ssl_url('contributors/'));

    $this->load->view('contributors/use_areas.phtml');
}


}
