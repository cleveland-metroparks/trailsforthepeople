<?php

/**
 * A means for updating the trailsforthepeople database as the application evolves.
 *
 * Update functions will have a version number in their name, incrementing with each new
 * one. We store the last-run version number in the database. Then, any update functions
 * whose version is newer than the current database version have yet to be run.
 *
 * This is evolving...
 *
 * Currently run via command-line (with some manual tweaking).
 */

define('BASEPATH', getcwd() );

/**
 * Set the current version number in the database.
 */
function set_db_version($version) {
	// @TODO
}

/**
 * Get and return the current version number from the database. All updates
 * greater than this number have yet to be run.
 */
function get_db_version() {
	// @TODO
	$version = 2000;

	return $version;
}

/**
 * Connect to the database
 */
function db_connect() {
	require BASEPATH . '/../../application/config/database.php';
	$DB_USER = $db['default']['username'];
	$DB_PASS = $db['default']['password'];
	$DB_BASE = $db['default']['database'];
	$DB_PORT = $db['default']['port'];
	$db = pg_connect("dbname={$DB_BASE} user={$DB_USER} password={$DB_PASS} port={$DB_PORT}");
	return $db;
}

/**
 *
 */
function get_all_db_update_nums() {
    $update_nums = array();
    $all_functions = get_defined_functions();
    $regexp = '/^trailsforthepeople_db_update_(\d+)$/';
    foreach (preg_grep('/_\d+$/', $all_functions['user']) as $function) {
      if (preg_match($regexp, $function, $matches)) {
        $update_nums[] = (int)$matches[1];
      }
    }
    sort($update_nums, SORT_NUMERIC);

    return $update_nums;
}

/**
 *
 */
function get_pending_db_update_nums() {
	$pending_update_nums = array();

	$current_version = get_db_version();
	$all_update_nums = get_all_db_update_nums();

	foreach ($all_update_nums as $update_num) {
		if ($update_num > $current_version) {
			$pending_update_nums[] = $update_num;
		}
	}

	return $pending_update_nums;
}

/**
 *
 */
function run_updates($update_nums) {
	foreach ($update_nums as $num) {
		$function = 'trailsforthepeople_db_update_' . $num;
		if ($function_exists($function)) {
			// @TODO: Run the update function
			call_user_func($function);
			// @TODO: Log this
			set_db_version($num);
		}
	}
}

/**
 * Database update #2000
 * 
 * Test.
 */
function trailsforthepeople_db_update_2000() {
	db_connect();

	$sql = 'SELECT * FROM trails';

	$result = pg_query($sql) or exit("Error running query.");
}

/**
 * Database update #2001
 * 
 * Create "jobs" table.
 */
function trailsforthepeople_db_update_2001() {
	$db = db_connect();

	$sql='
		CREATE TABLE IF NOT EXISTS jobs (
		  id serial,
		  title varchar(100),
		  start_time timestamp DEFAULT current_timestamp,
		  end_time timestamp,
		  creator_email varchar(100),
		  percent_complete integer DEFAULT 0,
		  status varchar(30),
		  status_msg varchar(255),
		  PRIMARY KEY(id)
		);
		GRANT ALL PRIVILEGES ON TABLE jobs TO trails;
		GRANT ALL PRIVILEGES ON SEQUENCE jobs_id_seq TO trails;
	';

	$result = pg_query($db, $sql) or exit("Error running query.");
}

/**
 * Database update #2002
 *
 * Add "allow_trails" permission to contributors.
 */
function trailsforthepeople_db_update_2002() {
	$db = db_connect();

	$sql = 'ALTER TABLE contributors ADD COLUMN allow_trails bool NOT NULL SET DEFAULT false;';
	$result = pg_query($db, $sql)
		or exit("Error running query.");

	$sql = 'UPDATE contributors SET allow_trails=TRUE WHERE admin=true;';

	$result = pg_query($db, $sql) or exit("Error running query.");
}

/**
 * Database update #2003
 *
 * Add new "trails" table.
 */
function trailsforthepeople_db_update_2003() {
	$db = db_connect();

	// First, dupliate the "loops" table, without data.
	$sql = 'CREATE TABLE trails AS SELECT * FROM loops WHERE 1=2;';

	// Add columns from the "trails_fixed" table that weren't in "loops"...
	// Driving destination ID.
	$sql .= 'ALTER TABLE trails ADD COLUMN dest_id int4;';
	// Driving destination lat/lng. Do we need these? They match
	// what's in driving_destinations for the corresponding dest_id.
	$sql .= 'ALTER TABLE trails ADD COLUMN lng_driving float8;';
	$sql .= 'ALTER TABLE trails ADD COLUMN lat_driving float8;';
	// URL for the trail resource on the main CM website.
	$sql .= 'ALTER TABLE trails ADD COLUMN link varchar(1000);';
	// Distance in feet. Same as distance_feet in loops table.
	$sql .= 'ALTER TABLE trails ADD COLUMN length int4;';
	// Length of the trail, in miles, with units. Calculated during Aggregate process. Almost same as distancetext in loops table (but that one sometimes describes in feet if small).
	$sql .= 'ALTER TABLE trails ADD COLUMN length_text varchar(20);';
	// Full indication of reservation the trail is in. (Is this applicable?)
	$sql .= 'ALTER TABLE trails ADD COLUMN reservation text;';
	// Primary trail use, like "Hiking"
	$sql .= 'ALTER TABLE trails ADD COLUMN pri_use varchar(25);';
	// All trail uses, comma-separated, like "Mountain Biking, Hiking & Walking"
	$sql .= 'ALTER TABLE trails ADD COLUMN uses varchar(200);';

	$sql .= '
	INSERT INTO trails
		(id, geom, dest_id, lng_driving, lat_driving, description, link, length, wkt, length_text, boxn, boxe, boxs, boxw, lng, lat, search, closed, reservation, pri_use, paved, uses, name)
	SELECT
		gid, geom, dest_id, lng_driving, lat_driving, description, link, length, wkt, length_text, boxn, boxe, boxs, boxw, lng, lat, search, closed, reservation, pri_use, paved, uses, name
		FROM trails_fixed;
	';

	$result = pg_query($db, $sql) or exit("Error running query.");
}


//print_r(get_all_db_update_nums());
//print_r(get_pending_db_update_nums());

//run_updates(get_pending_db_update_nums());

trailsforthepeople_db_update_2003();
