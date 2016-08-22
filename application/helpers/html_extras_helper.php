<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * HTML markup helper functions.
 */


/**
 * Render an HTML <select> list.
 */
if (!function_exists('html_select_list'))
{
    function html_select_list($name, $options, $selected) {
        $markup = '<select class="form-control" name="' . $name . '">';
        foreach ($options as $option) {
            $selected_markup = ($option == $selected) ? ' selected="true"' : '';
            $markup .= '<option value="' . $option . '"' . $selected_markup . '>' . $option . '</option>';
        }
        $markup .= '</select>';

        return $markup;
    }
}