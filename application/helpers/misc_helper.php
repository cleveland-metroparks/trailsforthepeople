<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Filesystem helper functions.
 */

/**
* Get the total size and number of files (not dirs) within a given directory.
*/
if (!function_exists('_strip_descr_markup'))
{
    function _strip_description_markup($markup) {
        $pattern = '|</?font[^>]*>|i';
        $markup = preg_replace($pattern, '' , $markup);
        return $markup;
    }
}

/**
 * Transform main site image URL
 *
 * Take an image URL from the database referring to an image on the main site, like:
 * ~/getmedia/6cb586c0-e293-4ffa-b6c2-0be8904856b2/North_Chagrin_thumb_01.jpg.ashx?width=1440&height=864&ext=.jpg
 * and turn it into an absolute URL, scaled (proportionately) to the width provided.
 *
 * @param $url string
 * @param $new_width int
 *
 * @return string
 *   New absolute URL.
 */
if (!function_exists('_transform_main_site_image_url'))
{
    function _transform_main_site_image_url($url, $new_width) {
        $main_site_url = 'https://www.clevelandmetroparks.com/';
        $url = str_replace('~/', $main_site_url, $url);

        $url_parts = parse_url($url);
        if (isset($url_parts['query']) &&
            isset($url_parts['scheme']) &&
            isset($url_parts['host']) &&
            isset($url_parts['path'])
        ) {
            parse_str($url_parts['query'], $query_vars);

            if (isset($query_vars['width']) && isset($query_vars['height'])) {
                $orig_width = $query_vars['width'];
                $orig_height = $query_vars['height'];

                $scale_ratio = $orig_width / $new_width;
                $new_sizes = array(
                    'width' => $new_width,
                    'height' => intval($orig_height / $scale_ratio),
                );

                $query_vars = array_merge($query_vars, $new_sizes);
                $new_query = http_build_query($query_vars);
                $new_url = $url_parts['scheme'] .
                            '://' .
                            $url_parts['host'] .
                            $url_parts['path'] .
                            '?' .
                            $new_query;

                return $new_url;
            }
        }

        return $url;
    }
}

/**
 * lat/lng as string in prescribed coordinate format.
 *
 * @param $latlng: array('lat' => latitude, 'lng' => longitude)
 * @param $coordinate_format: string
 *
 * @return string: Formatted coordinates
 */
if (!function_exists('_latlng_formatted'))
{
    function _latlng_formatted($latlng, $coordinate_format) {
        switch ($coordinate_format) {
            case 'dms':
                return _latlng_as_dms($latlng);
            case 'ddm':
                return _latlng_as_ddm($latlng);
            case 'dd':
                return _latlng_as_dd($latlng);
            default:
                return _latlng_as_dms($latlng);
        }
    }
}

/**
 * lat/lng as Degrees Minutes Seconds (DMS) string.
 *
 * @param $latlng: array('lat' => latitude, 'lng' => longitude)
 * @param $precision: int
 *
 * @return string: Formatted coordinates
 */
if (!function_exists('_latlng_as_dms'))
{
    function _latlng_as_dms($latlng, $precision=0) {
        $ns = $latlng['lat'] < 0 ? 'S' : 'N';
        $ew = $latlng['lng'] < 0 ? 'W' : 'E';

        $lat_dd = abs($latlng['lat']);
        $lng_dd = abs($latlng['lng']);

        $lat_d = intval($lat_dd);
        $lat_m = intval(60 * ($lat_dd - $lat_d));
        $lat_s = number_format((($lat_dd - $lat_d - ($lat_m / 60)) * 3600), $precision);

        $lng_d = intval($lng_dd);
        $lng_m = intval(60 * ($lng_dd - $lng_d));
        $lng_s = number_format((($lng_dd - $lng_d - ($lng_m / 60)) * 3600), $precision);

        $latlng_str = $lat_d . '° ' . $lat_m . '\' ' . $lat_s . '" ' . $ns . ', ' . $lng_d . '° ' . $lng_m . '\' ' . $lng_s . '" ' . $ew;

        return $latlng_str;
    }
}

/**
 *lat/lng as Degrees Decimal Minutes (DDM) string.
 *
 * @param $latlng: array('lat' => latitude, 'lng' => longitude)
 * @param $precision: int
 *
 * @return string: Formatted coordinates
 */
if (!function_exists('_latlng_as_ddm'))
{
    function _latlng_as_ddm($latlng, $precision=2) {
        $ns = $latlng['lat'] < 0 ? 'S' : 'N';
        $ew = $latlng['lng'] < 0 ? 'W' : 'E';

        $lat_dd = abs($latlng['lat']);
        $lng_dd = abs($latlng['lng']);

        $lat_d = intval($lat_dd);
        $lat_m = number_format((60 * ($lat_dd - $lat_d)), $precision);

        $lng_d = intval($lng_dd);
        $lng_m = number_format((60 * ($lng_dd - $lng_d)), $precision);

        $latlng_str = $lat_d . '° ' . $lat_m . '\' ' . $ns . ', ' . $lng_d . '° ' . $lng_m . '\' ' . $ew;

        return $latlng_str;
    }
}

/**
 * lat/lng as Decimal Degrees (DD) string.
 *
 * @param $latlng: array('lat' => latitude, 'lng' => longitude)
 * @param $precision int
 *
 * @return string: Formatted coordinates
 */
if (!function_exists('_latlng_as_dd'))
{
    function _latlng_as_dd($latlng, $precision=4) {
        $latlng_str = number_format($latlng['lat'], $precision) . ', ' . number_format($latlng['lng'], $precision);
        return $latlng_str;
    }
}