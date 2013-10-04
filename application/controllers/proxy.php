<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Proxy extends CI_Controller {


function __construct() {
    parent::__construct();
}



/* disabled Sep 2012, as we don't use Mapbox anymore
// MapFishPrint has an issue with Mapbox URLs: it sticks an extra / in there which raises a 404 at Mapbox
// rewrite the URL so it doesn't have this extra /
function mapbox($which=null) {
    $MAPBOX_URL = "http://a.tiles.mapbox.com/v3/greeninfo.map-fdff5ykx";

    $pathinfo = str_replace('/proxy/mapbox', '', $_SERVER['PATH_INFO'] );
    $url = sprintf("%s%s", $MAPBOX_URL, $pathinfo );
    //error_log($url);

    header("Location: $url");
}
*/


// a proxy for the Ohio WMS imagery server. they don't allow requests over 1000px width or height, and we need them big for printing
// we point the WMS here when we tell MapFish Print about it.
// This accepts a too-large request, splits up the width, height, and bbox into 4 requests, and then composites the 4 images
// together, and treturns it. voila, transparent WMS proxy
function ohioimagery() {
    $BASE_URL = "http://gis4.oit.ohio.gov/arcgis/services/OSIP/MapServer/WMSServer";

    // parse the bbox into 4 numbers: NOTE THIS IS NOT THE USUAL SEQUENCE
    // this is S W N E, and I have no idea how they do that. Maybe that's WMS 1.3.0 ?
    list($miny,$minx,$maxy,$maxx) = explode(",",$_GET['BBOX']);

    // calculate the W/S/E/N for the 4 quadrants, e.g. a logical "nw" box bounded by $nw_w $nw_s $nw_e $nw_n
    $halfx = ($maxx + $minx) / 2.0;
    $halfy = ($maxy + $miny) / 2.0;
    $nw_w = $minx; $nw_s = $halfy; $nw_e = $halfx; $nw_n = $maxy;
    $ne_w = $halfx; $ne_s = $halfy; $ne_e = $maxx; $ne_n = $maxy;
    $sw_w = $minx; $sw_s = $miny; $sw_e = $halfx; $sw_n = $halfy;
    $se_w = $halfx; $se_s = $miny; $se_e = $maxx; $se_n = $halfy;

    // split the width and height in half, but use subtraction so we don't fall victim to rounding
    $nw_width = $sw_width = round($_GET['WIDTH'] / 2.0);
    $ne_width = $se_width = $_GET['WIDTH'] - $nw_width;
    $nw_height = $ne_height = round($_GET['HEIGHT'] / 2.0);
    $sw_height = $se_height = $_GET['HEIGHT'] - $nw_height;

    // now generate a new set of WMS params and then URLs for each of the 4 boxes
    $nw = $_GET; $nw['WIDTH'] = $nw_width; $nw['HEIGHT'] = $nw_height; $nw['BBOX'] = "$nw_s,$nw_w,$nw_n,$nw_e";
    $ne = $_GET; $ne['WIDTH'] = $ne_width; $ne['HEIGHT'] = $ne_height; $ne['BBOX'] = "$ne_s,$ne_w,$ne_n,$ne_e";
    $sw = $_GET; $sw['WIDTH'] = $sw_width; $sw['HEIGHT'] = $sw_height; $sw['BBOX'] = "$sw_s,$sw_w,$sw_n,$sw_e";
    $se = $_GET; $se['WIDTH'] = $se_width; $se['HEIGHT'] = $se_height; $se['BBOX'] = "$se_s,$se_w,$se_n,$se_e";
    $nw_url = $BASE_URL . '?' . http_build_query($nw);
    $ne_url = $BASE_URL . '?' . http_build_query($ne);
    $sw_url = $BASE_URL . '?' . http_build_query($sw);
    $se_url = $BASE_URL . '?' . http_build_query($se);
    /*
    header("Content-type: text/plain");
    print "ORIGINAL\n"; print_r($_GET); print "\n\n";
    print "NW\n"; print_r($nw); print "\n\n";
    print "NE\n"; print_r($ne); print "\n\n";
    print "SW\n"; print_r($sw); print "\n\n";
    print "SE\n"; print_r($se); print "\n\n";
    print "NW\n$nw_url\n";
    print "NE\n$ne_url\n";
    print "SW\n$sw_url\n";
    print "SE\n$se_url\n";
    */

    // fetch the four images and composite them into a single canvas
    $canvas = imagecreatetruecolor($_GET['WIDTH'],$_GET['HEIGHT']);
    $nw_img = imagecreatefrompng($nw_url);
    $ne_img = imagecreatefrompng($ne_url);
    $sw_img = imagecreatefrompng($sw_url);
    $se_img = imagecreatefrompng($se_url);
    imagecopy($canvas, $nw_img, $sw_width-1, $ne_height-1, 0, 0, imagesx($nw_img), imagesy($nw_img) );
    imagecopy($canvas, $ne_img, $nw_width-1, 0, 0, 0, imagesx($ne_img), imagesy($ne_img) );
    imagecopy($canvas, $sw_img, 0, $nw_height-1, 0, 0, imagesx($sw_img), imagesy($sw_img) );
    imagecopy($canvas, $se_img, 0, 0, 0, 0, imagesx($se_img), imagesy($se_img) );

    // spit it back out
    header("Content-type: image/png");
    imagepng($canvas, null, 0);
}


}
