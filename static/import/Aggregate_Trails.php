<?php
///// go through the trail segments in cm_trails and aggregate them per the Aggregate_Trails.xlsx spreadsheet

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
$xls      = $phpexcel->load("Aggregate_Trails.xlsx");
$sheet    = $xls->setActiveSheetIndex(0);

///// PHASE 0
// iterate over rows, fetching the trail name and description, and the query to perform on the cm_trails data to get the segments
// load this into an associative array, since they aren't unique and we don't want to run them multiple times
// row 1 is the title row; the rest are data
//  0 Recreation Type ID. Ignored
//  1 Recreation Type. Ignored
//  2 Reservation ID. Ignored
//  3 Reservation Name. Ignored
//  4 Location Name ID. Ignored
//  5 LINK. The URL of a landing page to view info about this Trail
//  6 Location Name. The name for this Trail
//  7 Description. The free-text description for this trail
//  8 blank
//  9 blank
// 10 blank
// 11 blank
// 12 Query2Geom. The SQL query to fetrch the trail segments comprising this Trail

print "<p>Loading XLSX into memory...</p>\n";
$trails = array();
$numrows = $sheet->getHighestRow();
for ($row=2; $row<$numrows; $row++) {
    $usetype  = $sheet->getCellByColumnAndRow( 1, $row)->getValue();
    $title    = $sheet->getCellByColumnAndRow( 6, $row)->getValue();
    $res      = $sheet->getCellByColumnAndRow( 3, $row)->getValue();
    $url      = $sheet->getCellByColumnAndRow( 5, $row)->getValue();
    $descr    = $sheet->getCellByColumnAndRow( 7, $row)->getValue();
    $sql      = $sheet->getCellByColumnAndRow( 8, $row)->getValue();
    $driving  = $sheet->getCellByColumnAndRow( 9, $row)->getValue();
    //printf("%s<br/>\n", $title ); ob_flush();

    // the SQL has some issues: capitalization of field names, and not escaping ' characters in the trail name
    $sql = str_replace('"FOR_SHOW"', 'for_show', $sql);
    $sql = str_replace('"RES"', 'res', $sql);
    $sql = str_replace('"LABEL_NAME"', 'label_name', $sql);
    $sql = str_replace('"SOURCE"', 'label_name', $sql);

    /* Nov 26 2012, this field now uses '' to escape ' characters, so we don't need to
    $labelname = null; preg_match('/%(.+?)%/', $sql, $labelname);
    if (sizeof($labelname)) {
        $labelname = str_replace("'", "''", $labelname[1]);
        $sql = preg_replace('/%.+?%/', "%$labelname%", $sql);
    }
    */

    // create the entry for this Trail, if we haven't yet
    if (! @$trails[$title]) {
        $trails[$title] = array(
            // these are in the spreadsheet and were read above
            'name'=>$title,
            'reservation'=>$res,
            'infourl'=>$url,
            'description'=>$descr,
            'segmentsql'=>$sql,
            'dest_id'=>$driving,
            'uses'=>array(),

            // the rest of this must be calculated in the loops below
            'howmanysegments' => 0, // how many segments are in this Trail? used to calculate percentage of pavement
            'gids' => array(), // a list of the segment GIDs which comprise this Trail, used to cross-reference between Trail->Trailpiece
            'boxw' => null, 'boxs' => null, 'boxe' => null, 'boxn' => null, // the bounding box (SRS is WGS84, was precalculated); starts as this segment's own bbox
            'lat' => null, 'lng' => null, // the LatLng of the centroid of the trail (SRS is WGS84, was precalculated); this is populated after the loop, when we have the entire trail collected
            'paved' => 0, // count of how many segments are paved; compared to howmanysegments, this later becomes a string such as "Mostly" or "No"
            'wkt' => "", // the WKT of the union of all segments, for plotting the aggregated Trail onto the map
            'length' => 0.0, // the sum length (feet) of all segments comprising the Trail
            'length_text' => "", // that length expressed as a string, e.g. "0.25 miles"
        );
    }

    // append non-unique data for this trail, since Trails are repeated for each Use Type
    // the resulting lists may not be unique, if the spreadsheet repeats them
    $trails[$title]['uses'][] = $usetype;
    $trails[$title]['howmanysegments']++;
}
printf("<p>Loaded %d trails to aggregate</p>", sizeof($trails) ); ob_flush();
//print_r($trails); exit;


// PHASE 1b: iterate over the trails and correct the Uses into a fixed-order list
// at present it is non-unique, and we want it sorted in a non-alphabetical order
$activity_sort = array(
    'Hiking & Walking' => 1,
    'Biking' => 2,
    'Exercising' => 3,
    'Horseback Riding' => 4,
    'Cross-Country Skiing' => 5,
    'Snowshoeing' => 6,
);
function sort_by_activity_name($p,$q) {
    global $activity_sort;
    $px = $activity_sort[$p];
    $qx = $activity_sort[$q];
    return $px - $qx;
}
foreach (array_keys($trails) as $tname) {
    $trails[$tname]['uses'] = array_unique($trails[$tname]['uses']);
    usort($trails[$tname]['uses'], 'sort_by_activity_name');
    $trails[$tname]['uses'] = implode(", ", $trails[$tname]['uses'] );
}
//print_r($trails); exit;


///// PHASE 2: iterate over each Trail name, fetch its segments, compose WKT, calculate proportions of paved, bike use, etc.
// note the iteration over array_keys() since we do want to make in-place edits to the array, and & references are evil!
foreach (array_keys($trails) as $tname) {
    printf("Round 1 (segment collection) for %s<br/>\n", $tname ); ob_flush();
    //print "SELECT * FROM cm_trails WHERE {$trails[$tname]['segmentsql']};<br/>\n";
    $segments = pg_query("SELECT * FROM cm_trails WHERE {$trails[$tname]['segmentsql']}");
    if (!$segments) { printf("***** %s<br/><br/>\n", pg_last_error() ); continue; }
    if (! pg_num_rows($segments) ) { print "***** No segments found, check the trail name<br/><br/>\n"; unset($trails[$tname]); continue; }

    while ($segment = pg_fetch_assoc($segments)) {
        // simple attribute copies, effectively the Trail's attrib is the attrib of the last-found segment
        $trails[$tname]['pri_use'] = $segment['pri_use'];
        $trails[$tname]['gids'][] = $segment['gid'];

        // extend the Trail's bounding box to fit this segment's bbox
        // centroid is recalculated in round 2
        if (!$trails[$tname]['boxw'] or $segment['boxw'] < $trails[$tname]['boxw']) $trails[$tname]['boxw'] = $segment['boxw'];
        if (!$trails[$tname]['boxs'] or $segment['boxs'] < $trails[$tname]['boxs']) $trails[$tname]['boxs'] = $segment['boxs'];
        if (!$trails[$tname]['boxe'] or $segment['boxe'] > $trails[$tname]['boxe']) $trails[$tname]['boxe'] = $segment['boxe'];
        if (!$trails[$tname]['boxn'] or $segment['boxn'] > $trails[$tname]['boxn']) $trails[$tname]['boxn'] = $segment['boxn'];

        // increment any flags that will be based on the segment count (percentages)
        if ($segment['paved']  == 'Yes') $trails[$tname]['paved']++;
        $trails[$tname]['howmanysegments']++;
    }

    // done with this Trail
    //print_r($trails[$tname]);
}


///// PHASE 3: iterate over each Trail name, and do second-stage calculations such as centroid and percentage of use types and pavement
// note the iteration over array_keys() since we do want to make in-place edits to the array, and & references are evil!
foreach (array_keys($trails) as $tname) {
    printf("Round 2 (aggregate calculation) for %s<br/>\n", $tname ); ob_flush();

    // centroid is simply the mean of the bounding box sides
    $trails[$tname]['lat'] = ( $trails[$tname]['boxs'] + $trails[$tname]['boxn'] ) / 2.0;
    $trails[$tname]['lng'] = ( $trails[$tname]['boxw'] + $trails[$tname]['boxe'] ) / 2.0;

    // paved (and perhaps other) status, are turned into percentages and then into words like "Most" or "Few"
    foreach (array('paved') as $usetype) {
        $percentage = 10 * round((100 * $trails[$tname][$usetype] / (float) $trails[$tname]['howmanysegments'])/10);
        switch ($percentage) {
            case 0:
            case 10:
                $trails[$tname][$usetype] = "No";
                break;
            case 20:
            case 30:
                $trails[$tname][$usetype] = "Few areas";
                break;
            case 40:
            case 50:
            case 60:
                $trails[$tname][$usetype] = "Some areas";
                break;
            case 70:
            case 80:
                $trails[$tname][$usetype] = "Most areas";
                break;
            case 90:
            case 100:
                $trails[$tname][$usetype] = "Yes";
                break;
        } // end of percentage calculation switch for this use type for this trail
    } // end of use types loop

    // done with this Trail
    //print_r($trails[$tname]);
}
//print_r($trails); exit;

///// PHASE 4: iterate over Trails again, fetch the length and WKT geometry for each
// note the iteration over array_keys() since we do want to make in-place edits to the array, and & references are evil!
foreach (array_keys($trails) as $tname) {
    printf("Round 3 (geometry calculation) for %s<br/>\n", $tname ); ob_flush();

    $wkt = pg_query("SELECT SUM(length) AS length, ST_ASTEXT(ST_TRANSFORM(ST_MULTI(ST_UNION(ST_FORCE_2D(ST_GeometryN(geom,1)))),4326)) AS wkt FROM cm_trails WHERE {$trails[$tname]['segmentsql']}");
    $wkt = pg_fetch_assoc($wkt);
    $trails[$tname]['wkt']         = $wkt['wkt'];
    $trails[$tname]['length']      = round($wkt['length']);
    $trails[$tname]['length_text'] = sprintf("%.2f mi", $wkt['length'] / 5280.0 );

    // done with this Trail
    //printf("---- Length is %d feet, %s<br/>\n", $trails[$tname]['length'], $trails[$tname]['length_text'] );
    //printf("---- WKT is %s<br/>\n", $trails[$tname]['wkt'] );
}


///// PHASE 5: iterate over Trails again, check the destinations table to see if there's an alternate driving destination
// note the iteration over array_keys() since we do want to make in-place edits to the array, and & references are evil!
foreach (array_keys($trails) as $tname) {
    printf("Round 4 (driving points) for %s<br/>\n", $tname ); ob_flush();

    $altloc = pg_query_params('SELECT lat,lng FROM driving_destinations WHERE dest_id=$1', array($trails[$tname]['dest_id']) );
    $altloc = pg_fetch_assoc($altloc);
    if ($altloc['lat'] and $altloc['lng']) {
        $trails[$tname]['lat_driving'] = $altloc['lat'];
        $trails[$tname]['lng_driving'] = $altloc['lng'];
        //printf("---- Driving location is %f %f <br/>\n", $trails[$tname]['lat_driving'], $trails[$tname]['lng_driving'] );
    } else {
        $trails[$tname]['lat_driving'] = $trails[$tname]['lat'];
        $trails[$tname]['lng_driving'] = $trails[$tname]['lng'];
        //print "---- No driving location found <br/>\n";
    }
}


///// PHASE 999: truncate the target table, then load it with these aggregated Trails
pg_query("TRUNCATE TABLE trails_fixed");
pg_query("TRUNCATE TABLE pieces_to_trails");
foreach (array_keys($trails) as $tname) {
    printf("Database insertion for %s<br/>\n", $tname ); ob_flush();

    // insert the fields PLUS a tsvector search field. no true geometry (just the wkt) since this is just for listings and bbox-style zooms, not WMS rendering
    // use a PostgreSQL trick of RETURNING to get the gid assigned to the row
    $gid = pg_query_params('INSERT INTO trails_fixed (name,pri_use,boxw,boxs,boxe,boxn,lat,lng,dest_id,lat_driving,lng_driving,uses,paved,reservation,wkt,length,length_text,link,description,search) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,to_tsvector($20)) RETURNING gid', array(
        $trails[$tname]['name'],
        $trails[$tname]['pri_use'],
        $trails[$tname]['boxw'], $trails[$tname]['boxs'], $trails[$tname]['boxe'], $trails[$tname]['boxn'],
        $trails[$tname]['lat'], $trails[$tname]['lng'],
        $trails[$tname]['dest_id'], $trails[$tname]['lat_driving'], $trails[$tname]['lng_driving'],
        $trails[$tname]['uses'], $trails[$tname]['paved'], $trails[$tname]['reservation'],
        $trails[$tname]['wkt'], $trails[$tname]['length'], $trails[$tname]['length_text'],
        $trails[$tname]['infourl'],
        $trails[$tname]['description'],
        $trails[$tname]['name'] . ' ' . $trails[$tname]['reservation'] . ' ' . $trails[$tname]['description']
    ) );
    $gid = pg_fetch_assoc($gid);
    $trails[$tname]['gid'] = $gid['gid'];
    //print $trails[$tname]['gid'];

    // save the feet-based geometry, used for intersection, e.g. with trail closures
    pg_query_params("UPDATE trails_fixed SET geom=ST_TRANSFORM(ST_GEOMFROMTEXT(wkt,4326),3734) WHERE gid=\$1", array($gid['gid']) );

    // now populate the Trail <-> Trailpiece mapping
    // for some reason DataMapper ORM won't save this relation, not sure why; probably more efficient this way anyway
    foreach ($trails[$tname]['gids'] as $sgid) {
        pg_query_params('INSERT INTO pieces_to_trails (segmentgid,trailgid) VALUES ($1,$2)', array($sgid,$trails[$tname]['gid']) );
    }
}


///// PHASE 999: re-calculate any trail closures, since these are wholly new trails now

pg_query("SELECT update_trail_closures()");


///// PHASE 999: delete any CMS Pages for Trails, and repopulate them
$CMS_FEED_NAME = 'Trail';
pg_query_params($db, 'DELETE FROM cms_pages WHERE feed=$1', array($CMS_FEED_NAME) );
function generateURLKey($string) {
    return substr(preg_replace('/[^\w\-]/', '-', strtolower($string) ),0,500);
}
foreach (array_keys($trails) as $tname) {
    printf("CMS page for %s<br/>\n", $tname ); ob_flush();

    $pageid = pg_query_params($db, 'INSERT INTO cms_pages (feed,urlkey,title,content,externalurl) VALUES ($1,$2,$3,$4,$5) RETURNING id', array(
        $CMS_FEED_NAME, generateURLKey($tname), $tname,
        $trails[$tname]['description'],
        $trails[$tname]['infourl']
    ));
    $pageid = pg_fetch_assoc($pageid);
    $pageid = $pageid['id'];

    pg_query_params($db, 'INSERT INTO cms_page_points (page_id,location_id) VALUES ($1,$2)', array(
        $pageid, $trails[$tname]['gid']
    ) );
}


///// PHASE 999: done!
print "<p>Done OK</p>\n";
