<?php
///// go through the Use Area POIs and the Reservations, and aggregate for each
///// Reservation a list of all activities taking place within all Use Areas within
///// Thus, reservations can also have a list of activities

// load up PHPExcel so we can read the spreadsheet
require 'PHPExcel/Classes/PHPExcel.php';

// connect to the database
require '/var/www/application/config/database.php';
$DB_USER = $db['default']['username'];
$DB_PASS = $db['default']['password'];
$DB_BASE = $db['default']['database'];
$DB_PORT = $db['default']['port'];
$db = pg_connect("dbname={$DB_BASE} user={$DB_USER} password={$DB_PASS} port={$DB_PORT}");

// go through each Reservation
$ress = pg_query('SELECT * FROM reservation_boundaries_public_private_cm_dissolved ORDER BY res');
while ($res = pg_fetch_assoc($ress)) {
    printf("Reservation %s <br/>", $res['res'] );

    // iterate over Use Area POIs and simply collect a list
    $activities = array();
    $pois = pg_query("SELECT * FROM cm_use_areas WHERE ST_INTERSECTS(geom,'{$res['geom']}'::geometry)");
    while ($poi= pg_fetch_assoc($pois)) {
        printf("---- %s<br/>\n", $poi['use_area'] );
        foreach (explode('; ',$poi['activity']) as $act) $activities[] = $act;
        printf("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; %s<br/>\n", $poi['activity'] );
    }

    // unique-ify and sort this reservation's activity list, re-join it with the same delimiter
    $activities = array_unique($activities);
    sort($activities);
    $activities = implode('; ', $activities);
    printf("Final list: %s<br/>\n", $activities );

    // done. update the reservation's field AND also its text-search field
    pg_query_params('UPDATE reservation_boundaries_public_private_cm_dissolved SET activities=$1 WHERE gid=$2', array($activities,$res['gid']) );
    pg_query_params('UPDATE reservation_boundaries_public_private_cm_dissolved SET search=to_tsvector(coalesce(res,\'\') || \' \' || coalesce(activities,\'\')) WHERE gid=$1', array($res['gid']) );
}

///// done!
print "<p>DONE!</p>\n";
