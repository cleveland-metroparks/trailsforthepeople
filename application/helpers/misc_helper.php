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
