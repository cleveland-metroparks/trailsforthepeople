<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Cronjobs extends CI_Controller {

/**
 *
 */
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

/**
 *
 */
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

}
