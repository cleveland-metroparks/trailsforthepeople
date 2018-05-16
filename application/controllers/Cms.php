<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class CMS extends CI_Controller {

function index() {
    $data = array();
    $data['pages'] = new CMSPage();
    $data['pages']->get();
    return $this->load->view('cms/index.phtml', $data );
}



function page($feed=null,$urlkey=null) {
    $data = array();
    $page = new CMSPage();
    $page->where('feed',$feed)->where('urlkey',$urlkey)->get();

    // if the page wasn't found, give a 404
    if (! $page->urlkey) return show_404();
    $data['page'] = $page;
    $data['page_title'] = $page->title;

    /* events removed October 2012
    // load up a list of the top events, for the right-hand side link
    $data['events'] = new CMSEvent();
    $data['events']->limit(5)->order_by('id')->get();
    */

    // should we trigger some CSS for "narrow mode" and "bare mdoe" ?
    $data['narrow'] = (boolean) (integer) @$_GET['narrow'];
    $data['bare']   = (boolean) (integer) @$_GET['bare'];

    // load up whatever point(s) are associated with this page
    $data['markers'] = $data['page']->getPointsforCMS();

    // suppress the More Info (externalurl field) for some content types,
    // as the Cleveland website always loads these CMS pages from that selfsame page
    // and it's silly to link back to it
    $no_more_info = false;
    if ($page->feed == 'UseAreaPOI')  $no_more_info = true;
    if ($page->feed == 'Facility')    $no_more_info = true;
    if ($page->feed == 'Trail')       $no_more_info = true;
    if ($no_more_info) {
        for ($i=0, $l=sizeof($data['markers']); $i<$l; $i++) {
            $data['markers'][$i]['externalurl'] = '';
        }
    }

    // special case: for Reservation pages, each Marker's Description is a list of activities,
    // so let's prepend that phrasing to the description
    // or, if bare mode is requested, empty out the content entirely
    if ($data['bare']) {
        for ($i=0, $l=sizeof($data['markers']); $i<$l; $i++) $data['markers'][$i]['description'] = '';
    }
    else if ($page->feed == 'Reservation') {
        for ($i=0, $l=sizeof($data['markers']); $i<$l; $i++) {
            if ($data['markers'][$i]['description']) $data['markers'][$i]['description'] = '<b>Activities:</b> ' . $data['markers'][$i]['description'];
        }
    }

    // should we enable Directions in the page? only for some page types
    // this is for a car icon in the corner, for pages which feature one known location
    // and has no effect on the Get Directions item in the popup bubbles
    $data['enable_directions'] = false;
    if ($page->feed == 'UseAreaPOI') $data['enable_directions'] = true;
    if ($page->feed == 'Facility')   $data['enable_directions'] = true;
    $data['enable_directions'] = false;

    // should we link to the Desktop and Mobile apps, and if so by what type=XXX&name=XXX params?
    $data['maplinkquerystring'] = null;
    if (sizeof($data['markers'] == 1)) {
        if ($page->feed == 'UseAreaPOI')  { $data['maplinkquerystring'] = "type=poi&name=" . $page->title; }
        if ($page->feed == 'Facility')    { $data['maplinkquerystring'] = "type=building&name=" . $page->title; }
        if ($page->feed == 'Reservation') { $data['maplinkquerystring'] = "type=reservation&name=" . $page->title; }
        if ($page->feed == 'Trail')       { $data['maplinkquerystring'] = "type=trail&name=" . $page->title; }
    }

    // should there be a calendar URL for this page? a special case only if there's 1 marker and it has a "calendarurl"
    $data['calendarurl'] = null;
    if (sizeof($data['markers']) == 1 and $data['markers'][0]['calendarurl']) $data['calendarurl'] = $data['markers'][0]['calendarurl'];

    // if there are multiple markers, make up a list of all the locations and their bboxes
    // the HTML template will use this to generate a Zoom to... dropdown
    $data['locationnames'] = null;
    if (sizeof($data['markers']) > 1) {
        $data['locationnames'] = array();
        foreach ($data['markers'] as $m) $data['locationnames'][] = array( 'title'=>$m['title'], 'boxw'=>$m['boxw'], 'boxs'=>$m['boxs'], 'boxe'=>$m['boxe'], 'boxn'=>$m['boxn'] );
    }
    if ($page->feed == 'Reservation' and $urlkey=='all') $data['locationnames'] = null;

    // for some feeds (CMS page types) we only want the map and not text
    $data['map_only'] = false;
    if ($page->feed == 'Activity')            $data['map_only'] = true;
    if ($page->feed == 'Facility')            $data['map_only'] = true;
    if ($page->feed == 'Reservation')         $data['map_only'] = true;
    if ($page->feed == 'ReservationActivity') $data['map_only'] = true;

    // generate the CMS output
    $this->load->view('cms/page.phtml',$data);
}


/* events removed October 2012
function event($urlkey='') {
    $data = array();
    $event = new CMSEvent();
    $event->where('urlkey',$urlkey)->get();

    // if the page wasn't found, give a 404
    if (! $event->urlkey) return show_404();
    $data['event'] = $event;

    // it was. load up a list of the top events, for the right-hand side link
    $data['events'] = new CMSEvent();
    $data['events']->limit(5)->get();

    // ready
    $this->load->view('cms/event.phtml',$data);
}
*/


function query() {
    $result = new Usearea();
    $result = $result->getByBBOX($_GET['w'],$_GET['s'],$_GET['e'],$_GET['n']);

    if ($result and $result->gid) {
        $data = array();
        $data['result'] = $result;

        $this->load->view('cms/query.phtml',$data);
    }
}


}
