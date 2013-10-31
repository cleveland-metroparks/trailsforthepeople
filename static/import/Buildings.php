<?php
///// go through a database of Buildings metadata, and populate these fields in the cm_buildings table
///// This consists of two steps:
///// - Loading Buildings.xlsx to find the DEST_ID for each building given its name
///// - Using the DEST_ID to look up the latlng in driving_destinations,
///// and copying that latlng into cm_buildings  as lat_driving and lng_driving

// define BASEPATH so we can properly include config files
// the value isn't used since we're only including config and not launching CodeIgniter
define('BASEPATH', getcwd() );

// load up PHPExcel so we can read the spreadsheet
require 'PHPExcel/Classes/PHPExcel.php';

// connect to the database
require '/var/www/application/config/database.php';
$DB_USER = $db['default']['username'];
$DB_PASS = $db['default']['password'];
$DB_BASE = $db['default']['database'];
$DB_PORT = $db['default']['port'];
$db = pg_connect("dbname={$DB_BASE} user={$DB_USER} password={$DB_PASS} port={$DB_PORT}");

// open the spreadsheet and grab the first worksheet
$phpexcel = PHPExcel_IOFactory::createReader('Excel2007');
$phpexcel->setReadDataOnly(true);
$xls      = $phpexcel->load("Buildings.xlsx");
$sheet    = $xls->setActiveSheetIndex(0);

$numrows = $sheet->getHighestRow();
for ($row=2; $row<$numrows; $row++) {
   $name     = $sheet->getCellByColumnAndRow( 0, $row)->getValue();
    $dest_id  = $sheet->getCellByColumnAndRow( 1, $row)->getValue();
   printf("%s = %d<br/>\n", $name, $dest_id );

    // round 1: save the DEST_ID field to the buildings
    $affected = pg_query_params($db, 'UPDATE cm_buildings SET dest_id=$1 WHERE name=$2', array($dest_id,$name) );
    $affected = pg_affected_rows($affected);
    if ($affected != 1) printf("---- %d matches: %d %s<br/>\n", $affected, $dest_id, $name );

    // round 2: find that dest_id in the driving_destinations table to get an alternate latlng for driving
    // this may fail (since we can't categorically guarantee success) in which case we use the existing latlng
    // Performance note: the driving destinations are not unique, for example multiple buildings and trails may have the same parking lot
    // so we may run the same dest_id multiple times. This isn't a real problem, though: the whole process runs in a few seconds,
    // and isn't meant for realtime interaction; high performance is not necessary
    $latlng = pg_query_params('SELECT * FROM driving_destinations WHERE dest_id=$1', array($dest_id) );
    $latlng = pg_fetch_assoc($latlng);
    if (@$latlng['lat'] and @$latlng['lng']) {
        pg_query_params($db, 'UPDATE cm_buildings SET lat_driving=$1, lng_driving=$2 WHERE dest_id=$3', array($latlng['lat'],$latlng['lng'],$dest_id) );
    } else {
        pg_query_params($db, 'UPDATE cm_buildings SET lat_driving=lat, lng_driving=lng WHERE dest_id=$1', array($dest_id) );
    }
}
