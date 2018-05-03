<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Cronjobs extends CI_Controller {


function expired_markers() {
    header("Content-type: text/html; charset=utf-8");
    $today = date('Y-m-d');

    // go through disabled events, see if their startdate and expires date fit around today
    // indicating that it is now "in season" and should be enabled
    $disabled = new Marker();
    $disabled->where('startdate <',$today)->where('expires >',$today)->where('enabled',0)->get();
    foreach ($disabled as $marker) {
        printf("Enabling %s<br/>\n", $marker->location );

        // disable the marker
        $marker->enabled = 1;
        $marker->save();
    }
    $disabled->where('startdate <',$today)->where('expires',NULL)->where('enabled',0)->get();
    foreach ($disabled as $marker) {
        printf("Enabling %s<br/>\n", $marker->location );

        // disable the marker
        $marker->enabled = 1;
        $marker->save();
    }

    // go through all enabled markers whose starting date hasn't come up yet
    // this is basicaly human error
    $premature = new Marker();
    $premature->where('startdate >',$today)->where('enabled',1)->get();
    foreach ($premature as $marker) {
        printf("Premature %s<br/>\n", $marker->location );

        // disable the marker
        $marker->enabled = 0;
        $marker->save();
    }

    // go through all enabled markers which are past their expiration date...
    $outdated = new Marker();
    $outdated->where('expires <',$today)->where('enabled',1)->get();
    foreach ($outdated as $marker) {
        printf("Outdated %s<br/>\n", $marker->location );

        // disable the marker
        $marker->enabled = 0;
        $marker->save();

        // if it is tagged as Annual, and was only now disabled, then cycle it to next year: add 1 year to its starting date
        if ($marker->annual) {
            $year = substr($marker->startdate,0,4);
            $marker->startdate = str_replace($marker->startdate, $year, $year+1);

            $year = substr($marker->expires,0,4);
            $marker->expires   = str_replace($marker->expires, $year, $year+1);

            $marker->save();
        }
    }
}


//GDA
function expired_loops() {
    header("Content-type: text/html; charset=utf-8");
    $today = date('Y-m-d');

    // go through disabled Loops, see if their startdate and expires date fit around today
    // indicating that it is now "in season" and should be re-Published
    $disabled = new Loop();
    $disabled->where('startdate <',$today)->where('expires >',$today)->where('status','Expired')->get();
    foreach ($disabled as $loop) {
        printf("Enabling %s<br/>\n", $loop->name );

        // disable the marker
        $loop->status = 'Published';
        $loop->save();
    }
    $disabled->where('startdate <',$today)->where('expires',NULL)->where('status','Expired')->get();
    foreach ($disabled as $loop) {
        printf("Enabling %s<br/>\n", $loop->name );

        // disable the marker
        $loop->status = 'Published';
        $loop->save();
    }

    // go through all enabled markers whose starting date hasn't come up yet
    // this is basicaly human error
    $premature = new Loop();
    $premature->where('startdate >',$today)->where('status','Published')->get();
    foreach ($premature as $loop) {
        printf("Premature %s<br/>\n", $loop->name );

        // disable the marker
        $loop->status = 'New';
        $loop->save();
    }

    // go through all enabled markers which are past their expiration date...
    $outdated = new Loop();
    $outdated->where('expires <',$today)->where('status','Published')->get();
    foreach ($outdated as $loop) {
        printf("Outdated %s<br/>\n", $loop->name );

        // disable the marker
        $loop->status = 'Expired';
        //GDA//$loop->save();

        // if it is tagged as Annual, and was only now disabled, then cycle it to next year: add 1 year to its starting date
        if ($loop->annual) {
            $year = substr($loop->startdate,0,4);
            $loop->startdate = str_replace($loop->startdate, $year, $year+1);

            $year = substr($loop->expires,0,4);
            $loop->expires   = str_replace($loop->expires, $year, $year+1);

            //GDA//$loop->save();
        }
    }
}

/**
 *
 */
function cms_load_events() {
    return print "events removed October 2012";
}

/* events removed October 2012
function cms_load_events() {
    ///// Phase 0: purge the existing CMS Pages and CMS Points
    $this->db->query('TRUNCATE TABLE cms_events');

    ///// Phase 1: fetch the ZIP file, pull out the only file and save to a CSV
    $random  = md5(mt_rand());
    $zipfile = sprintf("%s/%s.zip", $this->config->item('temp_dir'), $random );
    $csvfile = sprintf("%s/%s.csv", $this->config->item('temp_dir'), $random );
    copy($FEED_URL,$zipfile);
    $zip = zip_open($zipfile);
    if (! is_resource($zip)) { print "Feed ZIP not found (code $zip). Skipping.\n"; continue; }
    $csv = zip_read($zip);
    if (! $csv) { print "CSV not found in ZIP. Skipping.\n"; continue; }
    file_put_contents($csvfile, zip_entry_read($csv, zip_entry_filesize($csv)) );

    // load the CSV file, pull off the first line, the header, using good ol' CSV tools
    // Then, rename some of the hedaers, to effectively remap the fields
    $csv = fopen($csvfile,'r');
    $headers = fgetcsv($csv,0,"\t");
    $headers[0] = "CreateDate";
    $headers[1] = "ModifyDate";
    $headers[2] = "DataId";
    $headers[3] = "AutoNumber";
    $headers[24] = "Tile";

    // go over the lines and pull out the fields into an associative array
    // and use that to construct a CMS Page for the Event
    $numfields = sizeof($headers);
    while ($line = fgetcsv($csv,0,"\t")) {
        $row = array();
        for ($i=0; $i<$numfields; $i++) {
            $row[ $headers[$i] ] = $line[$i];
        }
        //print_r($row); continue;

        // data fixes: just in case someone screwed up, Titles should never have HTML
        $row['Title'] = strip_tags($row['Title']);

        // data fixes: generate an URL key based on the page's Title
        $row['URLKey'] = 'event-' . $row['AutoNumber'];

        // data fixes: the Tile picture is a pathname and needs a host portion
        if (@$row['Tile']) $row['Tile'] = $WEBSITE_BASE . $row['Tile'];
        else $row['Tile'] = '';

        // data fixes: the event date should be only the date, the times are screwy
        // and it should be in a nice text format instead (Aug 25) instead of 9/17/2012
        // and we also need the date in yyyy-mm-dd format
        $row['YYYYMMDD'] = explode(" ",$row['EventStartDate']);
        $row['YYYYMMDD'] = $row['YYYYMMDD'][0];
        $row['YYYYMMDD'] = date_parse($row['YYYYMMDD']);
        $row['TextDate'] = mktime(0, 0, 0, $row['YYYYMMDD']['month'], $row['YYYYMMDD']['day'], $row['YYYYMMDD']['year'] );
        $row['TextDate'] = date('M j', $row['TextDate']);
        $row['YYYYMMDD'] = sprintf("%04d-%02d-%02d", $row['YYYYMMDD']['year'], $row['YYYYMMDD']['month'], $row['YYYYMMDD']['day'] );

        // ready to create this page
        printf("Creating CMS event: <a target=\"_blank\" href=\"%s\">%s : %s</a><br/>\n", site_url("/cms/event/{$row['URLKey']}"), $row['TextDate'], htmlspecialchars($row['Title']) );
        $page = new CMSEvent();
        $page->urlkey   = $row['URLKey'];
        $page->title    = $row['Title'];
        $page->content  = $row['Description'];
        $page->imageurl = $row['Tile'];
        $page->sortdate = $row['YYYYMMDD'];
        $page->textdate = $row['TextDate'];
        $page->category = $row['Categories'];
        $page->time     = $row['Time'];
        $page->age      = $row['Age'];
        $page->cost     = $row['Cost'];
        $page->save();
    }


    ///// PHASE 999: acknowledge successful completion
    print "<p>DONE</p>\n";
}
*/



function cms_load_reservations() {
    // configuration
    $WEBSITE_BASE = "http://www.clevelandmetroparks.com/"; // image URLs in the XML are relative paths; provide the http://hostname/ portion here
    $FEED_URL = "http://legacy.clevelandmetroparks.com/Uploads/DataTransfer/Exports/Reservations.txt.zip";

    $CMS_FEED_NAME = "Reservation";

    // fetch the ZIP file (ZIP can't do a url_fopen), pull out the only file and save to a CSV file
    $random  = md5(mt_rand());
    $zipfile = sprintf("%s/%s.zip", $this->config->item('temp_dir'), $random );
    $csvfile = sprintf("%s/%s.csv", $this->config->item('temp_dir'), $random );
    copy($FEED_URL,$zipfile);
    $zip = zip_open($zipfile);
    if (! is_resource($zip)) { print "Feed ZIP not found (code $zip). Skipping.\n"; continue; }
    $csv = zip_read($zip);
    if (! $csv) { print "CSV not found in ZIP. Skipping.\n"; continue; }
    file_put_contents($csvfile, zip_entry_read($csv, zip_entry_filesize($csv)) );

    // load the CSV file, parse the first row which is file headers; rename a few columns so they're consistent between different CSV feeds
    $csv = fopen($csvfile,'r');
    $headers = fgetcsv($csv,0,"\t");
    $headers[0] = "CreateDate";
    $headers[1] = "ModifyDate";
    $headers[2] = "DataId";
    $headers[3] = "AutoNumber";
    $headers[26] = "Tile";

    // go over the lines and pull out the fields into an associative array, then build a list of those arrays for later CMS Pages
    // why not do it whtin the loop? structure and re-use as we add more feeds, easier to read and debug
    $pages_to_create = array();
    $numfields = sizeof($headers);
    while ($line = fgetcsv($csv,0,"\t")) {
        $row = array();
        for ($i=0; $i<$numfields; $i++) $row[ $headers[$i] ] = $line[$i];
        //print_r($row); continue;

        // data fixes: just in case someone screwed up, Titles should never have HTML
        $row['Title'] = strip_tags($row['Title']);
        if ($row['Title'] == 'Brookside Reservation') $row['Title'] = 'Brookside Reservation';

        // data fixes: generate an URL key based on the page's Title
        $row['URLKey'] = CMSPage::generateURLKey($row['Title']);

        // data fixes: the Tile picture is a pathname, but needs a host portion
        if (@$row['Tile']) $row['Tile'] = $WEBSITE_BASE . $row['Tile'];
        else $row['Tile'] = '';

        // data fixes: if there is a div#landing in the content, look for the a['href'] inside it to find the URL for a CMP landing page for that same activity
        $row['ExternalURL'] = array();
        preg_match('/<div id="landing"><a href="(.+?)"><\/div>/', $row['Description'], $row['ExternalURL'] );
        $row['ExternalURL'] = sizeof($row['ExternalURL']) ? $row['ExternalURL'][1] : '';

        // done, stick it onto the list for stage 2 processing
        $pages_to_create[] = $row;
    }
    printf("Loaded %d pages to create<br/>\n", sizeof($pages_to_create) );

    // delete the existing CMS pages for this feed, then go over the pages to create and do them
    $CMS_SUBFEED_NAME = "ReservationActivity";
    $this->db->query('DELETE FROM cms_pages WHERE feed=?', array($CMS_FEED_NAME) );
    $this->db->query('DELETE FROM cms_pages WHERE feed=?', array($CMS_SUBFEED_NAME) );
    foreach ($pages_to_create as $row) {
        // create the CMS Page
        printf("Creating CMS page: <a target=\"_blank\" href=\"%s\">%s</a><br/>\n", site_url("/cms/page/{$CMS_FEED_NAME}/{$row['URLKey']}"), htmlspecialchars($row['Title']) );
        $page = new CMSPage();
        $page->feed     = $CMS_FEED_NAME;
        $page->urlkey   = $row['URLKey'];
        $page->title    = $row['Title'];
        $page->content  = $row['Description'];
        $page->imageurl = $row['Tile'];
        $page->shareurl = $row['ExternalURL'];
        $page->save();

        // look for the first Reservation whose name matches this page's Title
        // if there is one, then insert a point associated to this CMS Page
        // yeah, this mixes SQL associations with DataMapper, but DataMapper won't do this nearly as easily nor quickly
        $target = new Park();
        $target->where('res',$page->title)->get();
        if (! $target->gid) continue;

        // so there was a matching res
        // link this location point to it
        $this->db->query('INSERT INTO cms_page_points (page_id,location_id) VALUES (?,?)', array($page->id,$target->gid) );

        // now find all Activities in all use Areas within that res, and create a Reservation+Activity page for each distinct Activity
        // each page has all Use Area points for each distinct activity
        $activities = array();
        $pois = new Usearea();
        $pois->where('reservation',$page->title)->get();
        foreach ($pois as $poi) {
            foreach (explode("; ", $poi->activity) as $act) {
                if (! @$activities[ $act ]) $activities[ $act ] = array();
                $activities[$act][] = $poi;
            } // end of Activity within a Use Area POI within a Reservation
        } // end of Use Area POI within Reservation
        foreach ($activities as $act=>$pois) {
            $resact_URLKey = CMSPage::generateURLKey( $row['Title'] . '-' . $act );
            $resact_Title  = sprintf("%s in %s", $act, $row['Title'] );
            printf("Creating CMS page: <a target=\"_blank\" href=\"%s\">%s</a><br/>\n", site_url("/cms/page/{$CMS_SUBFEED_NAME}/{$resact_URLKey}"), htmlspecialchars($resact_Title) );

            $page = new CMSPage();
            $page->feed     = $CMS_SUBFEED_NAME;
            $page->urlkey   = $resact_URLKey;
            $page->title    = $resact_Title;
            $page->content  = $row['Description'];
            $page->imageurl = $row['Tile'];
            $page->shareurl = $row['ExternalURL'];
            $page->save();

            foreach ($pois as $poi) {
                $this->db->query('INSERT INTO cms_page_points (page_id,location_id) VALUES (?,?)', array($page->id,$poi->gid) );
            }
        }

    } // end of Reservation

    /////
    ///// afterthought: a new Reservations CMS Page called "Overview" which has all Reservations as points
    /////
    $overview_URLKey = CMSPage::generateURLKey("ALL");
    $overview_Title  = "Cleveland Metroparks District";
    printf("Creating CMS page: <a target=\"_blank\" href=\"%s\">%s</a><br/>\n", site_url("/cms/page/{$CMS_FEED_NAME}/{$overview_URLKey}"), htmlspecialchars($overview_Title) );

    // the Page itself
    $page = new CMSPage();
    $page->feed     = $CMS_FEED_NAME;
    $page->urlkey   = $overview_URLKey;
    $page->title    = $overview_Title;
    $page->content  = '';
    $page->imageurl = '';
    $page->shareurl = '';
    $page->save();

    // and its marker points: for all CMS Page Reservations, find the Reservation by that same name
    $ress = new CMSPage();
    $ress->where('feed',$CMS_FEED_NAME)->get();
    foreach ($ress as $res) {
        $target = new Park();
        $target->where('res',$res->title)->get();
        if (!$target->gid) continue;
        $this->db->query('INSERT INTO cms_page_points (page_id,location_id) VALUES (?,?)', array($page->id,$target->gid) );
    }

    // done!
    print "<p>DONE!</p>\n";
}




function cms_load_facilities() {
    // configuration
    $WEBSITE_BASE = "http://www.clevelandmetroparks.com/"; // image URLs in the XML are relative paths; provide the http://hostname/ portion here
    $FEED_URL = "http://legacy.clevelandmetroparks.com/Uploads/DataTransfer/Exports/Facilities.txt.zip";
    $CMS_FEED_NAME = "Facility";

    // fetch the ZIP file (ZIP can't do a url_fopen), pull out the only file and save to a CSV file
    $random  = md5(mt_rand());
    $zipfile = sprintf("%s/%s.zip", $this->config->item('temp_dir'), $random );
    $csvfile = sprintf("%s/%s.csv", $this->config->item('temp_dir'), $random );
    copy($FEED_URL,$zipfile);
    $zip = zip_open($zipfile);
    if (! is_resource($zip)) { print "Feed ZIP not found (code $zip). Skipping.\n"; continue; }
    $csv = zip_read($zip);
    if (! $csv) { print "CSV not found in ZIP. Skipping.\n"; continue; }
    file_put_contents($csvfile, zip_entry_read($csv, zip_entry_filesize($csv)) );

    // load the CSV file, parse the first row which is file headers; rename a few columns so they're consistent between different CSV feeds
    $csv = fopen($csvfile,'r');
    $headers = fgetcsv($csv,0,"\t");
    $headers[0] = "CreateDate";
    $headers[1] = "ModifyDate";
    $headers[2] = "DataId";
    $headers[3] = "AutoNumber";
    $headers[38] = "Tile";

    // go over the lines and pull out the fields into an associative array, then build a list of those arrays for later CMS Pages
    // why not do it whtin the loop? structure and re-use as we add more feeds, easier to read and debug
    $pages_to_create = array();
    $numfields = sizeof($headers);
    while ($line = fgetcsv($csv,0,"\t")) {
        $row = array();
        for ($i=0; $i<$numfields; $i++) $row[ $headers[$i] ] = $line[$i];
        //print_r($row); continue;

        // data fixes: just in case someone screwed up, Titles should never have HTML
        $row['Title'] = strip_tags($row['Title']);

        // data fixes: generate an URL key based on the page's Title
        $row['URLKey'] = CMSPage::generateURLKey($row['Title']);

        // data fixes: the Tile picture is a pathname, but needs a host portion
        if (@$row['Tile']) $row['Tile'] = $WEBSITE_BASE . $row['Tile'];
        else $row['Tile'] = '';

        // data fixes: if there is a div#landing in the content, look for the a['href'] inside it to find the URL for a CMP landing page for that same activity
        $row['ExternalURL'] = array();
        preg_match('/<div id="landing"><a href="(.+?)"><\/div>/', $row['Description'], $row['ExternalURL'] );
        $row['ExternalURL'] = sizeof($row['ExternalURL']) ? $row['ExternalURL'][1] : '';

        // done, stick it onto the list for stage 2 processing
        $pages_to_create[] = $row;
    }
    printf("Loaded %d pages to create<br/>\n", sizeof($pages_to_create) );

    // delete the existing CMS pages for this feed, then go over the pages to create and do them
    $this->db->query('DELETE FROM cms_pages WHERE feed=?', array($CMS_FEED_NAME) );
    foreach ($pages_to_create as $row) {
        // create the CMS Page
        printf("Creating CMS page: <a target=\"_blank\" href=\"%s\">%s</a><br/>\n", site_url("/cms/page/{$CMS_FEED_NAME}/{$row['URLKey']}"), htmlspecialchars($row['Title']) );
        $page = new CMSPage();
        $page->feed     = $CMS_FEED_NAME;
        $page->urlkey   = $row['URLKey'];
        $page->title    = $row['Title'];
        $page->content  = $row['Description'];
        $page->imageurl = $row['Tile'];
        $page->shareurl = $row['ExternalURL'];
        $page->save();

        // look for the first Building whose name matches this page's Title (they're not unique, but the ones given are unique enough)
        // if there is one, then insert a point associated to this CMS Page
        // yeah, this mixes SQL associations with DataMapper, but DataMapper won't do this nearly as easily nor quickly
        $target = new Building();
        $target->where('name',$page->title)->get();
        if ($target->gid) {
            $this->db->query('INSERT INTO cms_page_points (page_id,location_id) VALUES (?,?)', array($page->id,$target->gid) );
        }
    }

    // done!
    print "<p>DONE!</p>\n";
}




function cms_load_activities() {
    // configuration
    $WEBSITE_BASE = "http://www.clevelandmetroparks.com/"; // image URLs in the XML are relative paths; provide the http://hostname/ portion here
    $FEED_URL = "http://legacy.clevelandmetroparks.com/Uploads/DataTransfer/Exports/ActivitiesExport.txt.zip";
    $CMS_FEED_NAME = "Activity";

    // fetch the ZIP file (ZIP can't do a url_fopen), pull out the only file and save to a CSV file
    $random  = md5(mt_rand());
    $zipfile = sprintf("%s/%s.zip", $this->config->item('temp_dir'), $random );
    $csvfile = sprintf("%s/%s.csv", $this->config->item('temp_dir'), $random );
    copy($FEED_URL,$zipfile);
    $zip = zip_open($zipfile);
    if (! is_resource($zip)) { print "Feed ZIP not found (code $zip). Skipping.\n"; continue; }
    $csv = zip_read($zip);
    if (! $csv) { print "CSV not found in ZIP. Skipping.\n"; continue; }
    file_put_contents($csvfile, zip_entry_read($csv, zip_entry_filesize($csv)) );

    // load the CSV file, parse the first row which is file headers; rename a few columns so they're consistent between different CSV feeds
    $csv = fopen($csvfile,'r');
    $headers = fgetcsv($csv,0,"\t");
    $headers[0] = "CreateDate";
    $headers[1] = "ModifyDate";
    $headers[2] = "DataId";
    $headers[3] = "AutoNumber";

    // go over the lines and pull out the fields into an associative array, then build a list of those arrays for later CMS Pages
    // why not do it whtin the loop? structure and re-use as we add more feeds, easier to read and debug
    $pages_to_create = array();
    $numfields = sizeof($headers);
    while ($line = fgetcsv($csv,0,"\t")) {
        $row = array();
        for ($i=0; $i<$numfields; $i++) $row[ $headers[$i] ] = $line[$i];
        //print_r($row); continue;

        // data fixes: just in case someone screwed up, Titles should never have HTML
        $row['Title'] = strip_tags($row['Title']);

        // a hack for some erroneous CSV fields: they mispelled some activities but never fixed the CSV file
        if ($row['Title'] == 'Picnicing') $row['Title'] = 'Picnicking';
        if ($row['Title'] == 'Playgrounds') $row['Title'] = 'Play Areas';

        // data fixes: generate an URL key based on the page's Title
        $row['URLKey'] = CMSPage::generateURLKey($row['Title']);

        // data fixes: the Tile picture is a pathname, but needs a host portion
        if (@$row['Tile']) $row['Tile'] = $WEBSITE_BASE . $row['Tile'];
        else $row['Tile'] = '';

        // data fixes: if there is a div#landing in the content, look for the a['href'] inside it to find the URL for a CMP landing page for that same activity
        $row['ExternalURL'] = array();
        preg_match('/<div id="landing"><a href="(.+?)"><\/div>/', $row['Description'], $row['ExternalURL'] );
        $row['ExternalURL'] = sizeof($row['ExternalURL']) ? $row['ExternalURL'][1] : '';

        // done, stick it onto the list for stage 2 processing
        $pages_to_create[] = $row;
    }
    printf("Loaded %d pages to create<br/>\n", sizeof($pages_to_create) );

    // delete the existing CMS pages for this feed, then go over the pages to create and do them
    $this->db->query('DELETE FROM cms_pages WHERE feed=?', array($CMS_FEED_NAME) );
    foreach ($pages_to_create as $row) {
        // create the CMS Page
        printf("Creating CMS page: <a target=\"_blank\" href=\"%s\">%s</a><br/>\n", site_url("/cms/page/{$CMS_FEED_NAME}/{$row['URLKey']}"), htmlspecialchars($row['Title']) );
        $page = new CMSPage();
        $page->feed     = $CMS_FEED_NAME;
        $page->urlkey   = $row['URLKey'];
        $page->title    = $row['Title'];
        $page->content  = $row['Description'];
        $page->imageurl = $row['Tile'];
        $page->shareurl = $row['ExternalURL'];
        $page->save();

        // look for all Use Areas which have this activity listed, and insert points associated to this CMS Page
        // yeah, this mixes SQL associations with DataMapper, but DataMapper won't do this nearly as easily nor quickly
        foreach (UseArea::getByActivity($page->title) as $target) {
            $this->db->query('INSERT INTO cms_page_points (page_id,location_id) VALUES (?,?)', array($page->id,$target->gid) );
        }
    }

    // done!
    print "<p>DONE!</p>\n";
}



}
