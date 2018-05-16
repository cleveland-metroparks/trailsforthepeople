<?php class Shorturl extends DataMapper {
// this class is used by ajax.php make_shorturl() { and find_shorturl()
// so a long query string can be interchanegd with a long query string
// This does extent DataMapper, but in reality all access is in those two methods
// and using the two provided static wrapper methods  save_url() and fetch_url()

var $table = 'shorturls';


function __construct($id = NULL) {
    parent::__construct($id);
}



// wrapper function:
// $short = Shorturl::save_url($uri,$querystring)
public static function save_url($uri,$qstring) {
    $url = new Shorturl();
    $url->querystring = $uri . '?' . $qstring;
    $url->save();

    return Shorturl::alphaID($url->id,false);
}


// wrapper function:
// $qstring = Shorturl::fetch_url($key)
public static function fetch_url($key) {
    if (! $key) return "";

    $id = Shorturl::alphaID($key,true);

    $url = new Shorturl();
    $url->where('id',$id)->get();
    return $url->querystring;
}

// the excellent AlphaID function from Kevin van Zonneveld (http://kevin.vanzonneveld.net)
// adapted to our own needs
function alphaID($in, $to_num) {
    $index = "bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ";
    $base  = strlen($index);

    if ($to_num) { // convert from an alpha code to a number
        $in  = strrev($in);
        $out = 0;
        $len = strlen($in) - 1;
        for ($t = 0; $t <= $len; $t++) {
            $bcpow = bcpow($base, $len - $t);
            $out   = $out + strpos($index, substr($in, $t, 1)) * $bcpow;
        }

        $out = sprintf('%F', $out);
        $out = substr($out, 0, strpos($out, '.'));
    } else { // convert from a number to an alpha code
        $out = "";
        for ($t = floor(log($in, $base)); $t >= 0; $t--) {
            $bcp = bcpow($base, $t);
            $a   = floor($in / $bcp) % $base;
            $out = $out . substr($index, $a, 1);
            $in  = $in - ($a * $bcp);
        }
        $out = strrev($out); // reverse
    }

    return $out;
}


}