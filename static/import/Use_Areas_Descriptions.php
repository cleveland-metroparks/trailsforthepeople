<?php
///// go through a database of use areas metadata, and add descriptions to the database

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
$xls      = $phpexcel->load("Use_Areas_Descriptions.xlsx");
$sheet    = $xls->setActiveSheetIndex(0);

// iterate over rows, fetching the description and the location's ID#
// row 1 is the title row; the rest are data
//  0 UID, corresponds to the loc_id numeric field in the database table from the bshapefile
//  1 location, the title of the Use Area
//  2 activity
//  3 res
//  4 parent_iframe, a landing page URL for the "link" field
//  5 activity_link
//  6 img_link, an URL for an image, for the "image_url" field
//  7 cal_link, an URL, a link to a calendar for the "calendar" field
//  8 access
// 10 Description, the long-text description for the "description" field

$CMS_FEED_NAME = 'UseAreaPOI';
pg_query_params($db, 'DELETE FROM cms_pages WHERE feed=$1', array($CMS_FEED_NAME) );
function generateURLKey($string) {
    return substr(preg_replace('/[^\w\-]/', '-', strtolower($string) ),0,500);
}

$already = array(); // the Use Areas are duplicated; this makes sure we don't run more than 1 CMS page for one

$numrows = $sheet->getHighestRow();
for ($row=2; $row<=$numrows; $row++) {
    $locid   = $sheet->getCellByColumnAndRow( 0, $row)->getValue();
    $title   = $sheet->getCellByColumnAndRow( 1, $row)->getValue();
    $descr   = $sheet->getCellByColumnAndRow(10, $row)->getValue();
    $imgurl  = $sheet->getCellByColumnAndRow( 6, $row)->getValue();
    $calurl  = $sheet->getCellByColumnAndRow( 7, $row)->getValue();
    $pageurl = $sheet->getCellByColumnAndRow( 4, $row)->getValue();
    $driving = $sheet->getCellByColumnAndRow(11, $row)->getValue();
    printf("%s: %s<br/>\n", $locid, $title );

    // data fix: the $imgurl is often multiple image URLs with commas in between, we only support one
    if ($imgurl) $imgurl = preg_split('/,\s+/', $imgurl); $imgurl = $imgurl[0];

    // data fix: descriptions often have these weird codes, drop them
    if ($descr) $descr = str_replace('_x000D_', '', $descr);

    // done, do the relevant updates
    if ($descr)   pg_query_params($db, 'UPDATE cm_use_areas SET description=$1 WHERE loc_id=$2', array($descr,$locid) );
    if ($imgurl)  pg_query_params($db, 'UPDATE cm_use_areas SET image_url=$1 WHERE loc_id=$2', array($imgurl,$locid) );
    if ($calurl)  pg_query_params($db, 'UPDATE cm_use_areas SET cal_link=$1 WHERE loc_id=$2', array($calurl,$locid) );
    if ($pageurl) pg_query_params($db, 'UPDATE cm_use_areas SET link=$1 WHERE loc_id=$2', array($pageurl,$locid) );
    if ($driving) pg_query_params($db, 'UPDATE cm_use_areas SET dest_id=$1 WHERE loc_id=$2', array($driving,$locid) );

    // and create the CMS Page and a single CMS Point
    if (! @$already[$locid]) {
        printf("Creating CMS Page (locid %d) %s <br/>\n", $locid, $title );
        $pageid = pg_query_params($db, 'INSERT INTO cms_pages (feed,urlkey,title,content,imageurl,externalurl) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', array(
            $CMS_FEED_NAME, generateURLKey("$title-$locid"), $title, $descr, $imgurl, $pageurl
        ) );
        $pageid = pg_fetch_assoc($pageid);
        $pageid = $pageid['id'];
        pg_query_params($db, 'INSERT INTO cms_page_points (page_id,location_id) VALUES ($1,$2)', array(
            $pageid, $locid
        ));
    }

    // done, tag it as already done
    $already[$locid] = true;
}

// some final fixes for ones with wonky descriptions that obviously should be blank
pg_query_params($db, 'UPDATE cm_use_areas SET description=$1 WHERE description=$2', array('','0') );
pg_query_params($db, 'UPDATE cm_use_areas SET description=$1 WHERE description=$2', array('','URL') );

// a new stage! go over all Use Areas in the database, and see whether there's a special Driving LatLng for this Use Area
// Update the lat_driving and lng_driving accordingly

$pois = pg_query('SELECT gid, use_area, lat, lng, dest_id FROM cm_use_areas');
while ($poi = pg_fetch_assoc($pois)) {
    printf("Driving location for %s <br/>\n", $poi['use_area'] );

    $altloc = pg_query_params('SELECT lat,lng FROM driving_destinations WHERE dest_id=$1', array($poi['dest_id']) );
    $altloc = pg_fetch_assoc($altloc);
    if (! $altloc['lat'] or ! $altloc['lng']) $altloc = array( 'lat'=>$poi['lat'], 'lng'=>$poi['lng'] );

    pg_query_params('UPDATE cm_use_areas SET lat_driving=$1, lng_driving=$2 WHERE gid=$3', array($altloc['lat'],$altloc['lng'],$poi['gid']) );
}

// done!
print "<p>Done OK</p>\n";
