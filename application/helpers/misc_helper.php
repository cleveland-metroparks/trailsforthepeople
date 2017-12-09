<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Filesystem helper functions.
 */

/**
* Get the total size and number of files (not dirs) within a given directory.
*/
if ( ! function_exists('_strip_descr_markup'))
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
if ( ! function_exists('_transform_main_site_image_url'))
{
    function _transform_main_site_image_url($url, $new_width) {
        $main_site_url = 'https://www.clevelandmetroparks.com/';
        $url = str_replace('~/', $main_site_url, $url);

        $url_parts = parse_url($url);
        parse_str($url_parts['query'], $query_vars);

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
