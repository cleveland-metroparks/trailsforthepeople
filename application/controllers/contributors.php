<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Contributors extends MY_Controller {


function __construct() {
    parent::__construct();

    // a shortcut for use in templates: $this->loggedin is a shortcut to an assocarray of the Contributor's info
    $this->loggedin = $this->session->userdata('contributor');
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

function login() {
    // must be using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    // if they submitted a user & pass AND it matches the salted SHA1 hash, good
    // set their session variable and send them onward
    if (@$_POST['username'] and $_POST['password']) {
        // fetch their account and check their password
        $account = new Contributor();
        $account->where('email',$_POST['username'])->get();
        $login_ok = $account->id and $account->checkPassword($_POST['password']);

        // if both passed, they're in; capture a bunch of their Contributor attributes into a session variable
        // this can be used in templates or this controller via $this->loggedin or $this->loggedin
        if ($login_ok) {
            $sessiondata = array(
                'id' => $account->id,
                'email' => $account->email,
                'realname' => $account->realname,
                'admin' => $account->admin == 't',
                'allow_markers' => $account->allow_markers == 't',
                'allow_swgh' => $account->allow_swgh == 't',
                'allow_loops' => $account->allow_loops == 't',
                'allow_closures' => $account->allow_closures == 't',
                'allow_twitter' => $account->allow_twitter == 't',
            );
            $this->session->set_userdata('contributor', $sessiondata);
            Auditlog::log_message("Successful login to contributor panel", $account->email);
            return redirect(ssl_url('contributors/'));
        } else {
            Auditlog::log_message("Failed login attempt to contributor panel", $_POST['username']);
        }
    }

    // if we got here, it must not have worked out
    $this->session->unset_userdata('contributor');

    $this->load->view('contributors/login.phtml');
}

function logout() {
    // must be using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');

    // log the event, wow they actually logged out!
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message("Successful logout from to contributor panel", $email);

    // purge their token, send them to the login page
    $this->session->unset_userdata('contributor');
    redirect(ssl_url('contributors/login'));
}

/*
 * User Account
 */
function user() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

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

    $this->load->view('contributors/user.phtml', $data);
}


function index() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    $this->load->view('contributors/home.phtml');
}



function markers() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_markers']) return redirect(ssl_url('contributors/'));
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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_markers']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_markers']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_markers']) return redirect(ssl_url('contributors/'));

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



function trailclosures() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_closures']) return redirect(ssl_url('contributors/'));

    // if they are not saving, then bail to a form
    if (! @$_POST['save']) {
        $data = array();
        $data['closures'] = new Trailclosure();
        $data['closures']->order_by('name')->get();
        return $this->load->view('contributors/trailclosures.phtml',$data);
    }

    // bypass the ORM cuz we need to insert geometries and truncate tables and stuff
    if (! @$_POST['closure_names']) $_POST['closure_names'] = array();
    $this->db->query('TRUNCATE TABLE trail_closures');
    for ($i=0; $i<sizeof($_POST['closure_names']); $i++) {
        $this->db->query('INSERT INTO trail_closures (name,description,wkt,geom) VALUES (?,?,?,ST_TRANSFORM(ST_GEOMFROMTEXT(?,4326),3734))',
            array(
            $_POST['closure_names'][$i], $_POST['closure_texts'][$i],
            $_POST['closure_geoms'][$i],
            $_POST['closure_geoms'][$i]
        ));
    }

    // some postprocessing: add the centroid LatLng coordinates, for zooming in that UI
    $this->db->query('UPDATE trail_closures SET boxw=ST_XMIN(ST_TRANSFORM(geom,4326))');
    $this->db->query('UPDATE trail_closures SET boxe=ST_XMAX(ST_TRANSFORM(geom,4326))');
    $this->db->query('UPDATE trail_closures SET boxs=ST_YMIN(ST_TRANSFORM(geom,4326))');
    $this->db->query('UPDATE trail_closures SET boxn=ST_YMAX(ST_TRANSFORM(geom,4326))');

    // postprocessing: find any Trails which intersect any of these Closures, tag them
    $this->db->query('SELECT update_trail_closures()');

    // purge the tile cache
    $this->_clearTileCache('closure');

    // done, audit and send them on
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message("Trail closures saved", $email);
    redirect(ssl_url('contributors/'));
}




function autoloop() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

    $this->load->view('contributors/autoloop.phtml');
}


function autoloop_csv() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));
    $myid = $this->loggedin;

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_loops']) return redirect(ssl_url('contributors/'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    // load the tweets and print 'em, is all
    $data = array();
    $data['tweets'] = new Twitter();
    $data['tweets']->limit(500)->where('deleted','f')->get();
    $this->load->view('contributors/twitter.phtml', $data);
}



function twitterbans() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // must have the permission to use this specific function
    if (! $this->loggedin['allow_twitter']) return redirect(ssl_url('contributors/'));

    // load the list of banned twits and print 'em, is all
    $data = array();
    $data['twits'] = Twitter::getBanList(true);
    $this->load->view('contributors/twitterbans.phtml', $data);
}



function twitter_delete() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

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
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->session->userdata('admin') ) return redirect(ssl_url('contributors/login'));

    // log the event and do the deed
    $username = @$_POST['username'];
    if ($username) {
        Auditlog::log_message( sprintf("Twitter account reinstated: %s", htmlspecialchars($username) ), $this->loggedin['email']);
        Twitter::removeFromBanList($username);
    }

    // done, just say OK
    print 'ok';
}


function password() {
    // must be logged in and using SSL to do this
    if (! is_ssl() ) return $this->load->view('contributors/sslrequired.phtml');
    if (! $this->loggedin) return redirect(ssl_url('contributors/login'));

    // not saving? bail
    if (! @$_POST) return $this->load->view('contributors/password.phtml');

    $data = array();

    // guess we're saving; validate that they gave a password
    // deeper validation would mean them hacking their browser to give themselves a weak password, which isn't a realistic concern
    if (! $_POST['password1']) return $this->load->view('contributors/password.phtml', $data);

    // fetch my own Contributor account
    $contributor = new Contributor();
    $contributor->where('id', $this->loggedin['id'] )->get();
    $contributor->setPassword($_POST['password1']);

    // done
    $this->load->view('contributors/password_done.phtml', $data);
}


}
