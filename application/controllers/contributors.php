<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class Contributors extends MY_Controller {

function __construct() {
    parent::__construct();

    // Add our administration & contributors (shared) JS as a <script> include.
    $this->_add_js_include('static/admin/admin-contrib.js');

    // Add our contributors JS as a <script> include.
    $this->_add_js_include('static/contributors/contributors.js');
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

        $this->_add_user_message('Your password has been changed.', 'success');
    }

    $this->load->view('contributors/user.phtml', $data);
}

/**
 *
 */
function index() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user
    if ($this->_user_access() !== NULL) return;

    $this->load->view('contributors/home.phtml');
}

/**
 * List/manage Markers
 */
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

/**
 * Edit Marker
 */
function marker_edit($id) {
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
            // Not an admin; make sure the owner ID matches too
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
    $this->load->view('contributors/marker_edit.phtml', $data);
}

/**
 * Delete Marker
 *
 * Confirm, then delete a marker from the database, checking access permissions.
 */
function marker_delete($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;
    
    $myid = $this->loggedin;

    if (empty($_POST['submit']) ) {
        // Ask for confirmation
        $data = array();
        $data['marker'] = null;
        if ((integer) $id) {
            $data['marker'] = new Marker();
            $data['marker']->where('id', $id);
            if (!$this->loggedin['admin']) {
                // Not an admin; make sure the owner ID matches
                $data['marker']->where('creatorid', $myid['id']);
            }
            $data['marker']->get();

            // @TODO: How to bail?
            if (!$data['marker']->id) return redirect(ssl_url('contributors/markers'));
        }

        $this->load->view('contributors/marker_delete.phtml', $data);
    } else {
        // The initial confirmation has been accepted; start the delete process
        $marker = new Marker();
        $marker->where('id', $id);
        if (! $this->loggedin['admin'] ) {
            // Not an admin; make sure the owner ID matches too
            $marker->where('creatorid', $myid['id']);
        }
        $marker->get();

        if ($marker->id) {
            // Log this event
            $email = $this->loggedin;
            $email = $email['email'];
            Auditlog::log_message( sprintf("Marker deleted: \"%s\" (id: %d)", htmlspecialchars($marker->title), $marker->id) , $email);

            // Delete it
            $marker->delete();
        } else {
            // @TODO: Say: "This marker doesn't exist, or you don't have access to it."
            return redirect(ssl_url('contributors/markers'));
        }

        redirect(ssl_url('contributors/markers'));
    }
}

/**
 * Save Marker
 *
 * Save a new or edited marker to the database, checking access permissions.
 */
function marker_save() {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $myid = $this->loggedin;

    $marker = new Marker();
    // Fetch the marker record we're updating, or create a new record and set its ownership/creator info
    if (@$_POST['id']) {
        // Existing marker
        $marker->where('id', $_POST['id']);
        $marker->where('creatorid', $myid['id']);
        $marker->get();
        if (! $marker->id) return redirect(ssl_url('contributors/markers'));
    } else {
        // New marker
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
    $this->db->query(
        "UPDATE markers SET geom=ST_GeometryFromText('POINT(? ?)',4326) WHERE id=?",
        array(
            (float)$marker->lng,
            (float)$marker->lat,
            $marker->id
        )
    );

    // now enable/disable the marker based on its startdate and expires date
    $today = date('Y-m-d');
    $marker->enabled = 1;
    if ($marker->startdate and $marker->startdate > $today) {
        $marker->enabled = 0;
    }
    if ($marker->expires and $marker->expires < $today) {
        $marker->enabled = 0;
    }
    $marker->save();

    // done
    $email = $this->loggedin;
    $email = $email['email'];
    if (@$_POST['id']) {
        Auditlog::log_message( sprintf("Marker edited: \"%s\" (id: %d)", htmlspecialchars($marker->title), $marker->id) , $email);
    } else {
        Auditlog::log_message( sprintf("Marker created: \"%s\" (id: %d)", htmlspecialchars($marker->title), $marker->id) , $email);
    }

    redirect(ssl_url('contributors/markers'));
    //$this->load->view('contributors/marker.phtml', $data);
}

/**
 * List/manage Loops
 */
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

/**
 * Edit/create Loop
 */
function loop_edit($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Markers" permission
    if ($this->_user_access('allow_markers') !== NULL) return;

    $this->_add_js_include('static/contributors/loop.js');

    //$myid = $this->loggedin;

    // Load the Loop info
    $data = array();
    $data['loop'] = null;
    if ((integer) $id) {
        $data['loop'] = new Loop();
        $data['loop']->where('id',$id)->get();
        if (! $data['loop']->id) return redirect(ssl_url('contributors/loops'));

        //// Must be owner of the Loop or an admin
        // load the marker info, if any; note the extra WHERE to ensure that we own the marker
        //    if (! $this->loggedin['admin'] ) {
        //        // Not an admin; make sure the owner ID matches too
        //        $data['loop']->where('creatorid', $myid['id']);
        //    }
        //    $data['loop']->get();
        //    if (! $data['loop']->id) return redirect(ssl_url('contributors/loops'));

        // must be owner of the Loop, or an admin
        if (! $this->loggedin['admin'] and $data['loop']->creatorid != $this->loggedin['id']) {
            return redirect(ssl_url('contributors/loops'));
        }

        //if (! $data['marker']->id) return redirect(ssl_url('contributors/loops'));
    }

    $this->load->view('contributors/loop_edit.phtml', $data);
}

/**
 * Save Loop
 */
function loop_save() {
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
        $saveas = "static/images/loops/{$loop->id}.jpg";
        copy($source,$saveas);
    }

    // done
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message(sprintf("Loop saved: \"%s\" (id: %d)", htmlspecialchars($loop->name), $loop->id), $email);
    $url = $loop->source == 'random' ? ssl_url('contributors/loops?random=1') : ssl_url('contributors/loops');
    redirect($url);
}

/**
 * Clone Loop
 *
 * @TODO: Turn the confirmation into 
 */
function loop_clone($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;

    // fetch the original Loop
    $old_loop = new Loop();
    $old_loop->where('id',$id)->get();
    if (! $old_loop->id) return redirect(ssl_url('contributors/loops'));

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

    // Log this event
    $email = $this->loggedin;
    $email = $email['email'];
    Auditlog::log_message(sprintf("Loop cloned as: \"%s\" (original id: %d; clone id: %d)", htmlspecialchars($new_loop->name), $old_loop->id, $new_loop->id) , $email);

    // send them to the new Loop's editing page
    redirect( ssl_url("contributors/loop/{$new_loop->id}/edit") );
}

/**
 * Delete Loop
 *
 * Confirm, then delete a loop from the database, checking access permissions.
 */
function loop_delete($id) {
    // Require SSL
    if (! is_ssl() ) return $this->load->view('administration/sslrequired.phtml');
    // Require logged-in user with "Allow Loops" permission
    if ($this->_user_access('allow_loops') !== NULL) return;
    
    $myid = $this->loggedin;

    if (empty($_POST['submit']) ) {
        // Ask for confirmation
        $data = array();
        $data['loop'] = null;
        if ((integer) $id) {
            $data['loop'] = new Loop();
            $data['loop']->where('id', $id);
            if (!$this->loggedin['admin']) {
                // Not an admin; make sure the owner ID matches
                $data['loop']->where('creatorid', $myid['id']);
            }
            $data['loop']->get();

            // @TODO: How to bail?
            if (!$data['loop']->id) return redirect(ssl_url('contributors/loops'));
        }

        $this->load->view('contributors/loop_delete.phtml', $data);
    } else {
        // The initial confirmation has been accepted; start the delete process
        $loop = new Loop();
        $loop->where('id', $id);
        if (! $this->loggedin['admin'] ) {
            // Not an admin; make sure the owner ID matches too
            $loop->where('creatorid', $myid['id']);
        }
        $loop->get();

        if ($loop->id) {
            // Log this event
            $email = $this->loggedin;
            $email = $email['email'];
            Auditlog::log_message(sprintf("Loop deleted: \"%s\" (id: %d)", htmlspecialchars($loop->name), $loop->id), $email);

            // Delete it
            $loop->delete();
        } else {
            // @TODO: Say: "This loop doesn't exist, or you don't have access to it."
            return redirect(ssl_url('contributors/loops'));
        }

        // delete any static images associated with it
        $photo = "static/images/loops/{$loop->id}.jpg";
        if (is_file($photo)) unlink($photo);

        redirect(ssl_url('contributors/loops'));
    }
}

/*
 * List/manage Trails
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
 * List/manage Use Areas
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
