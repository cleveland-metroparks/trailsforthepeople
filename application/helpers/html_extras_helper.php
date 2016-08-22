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

/**
 * Render an HTML checkbox list.
 */
if (!function_exists('html_checkbox_list'))
{
    function html_checkbox_list($options, $selected_list) {
        $markup = '';
        foreach ($options as $option) {
            $selected_markup = in_array($option, $selected_list) ? ' checked' : '';
            $markup .=
                '<label class="checkbox-inline">
                <input class="form-check-input" type="checkbox" value="' . $option .'"' . $selected_markup . '>'
                . htmlspecialchars($option) . '</label>';
        }

        return $markup;
    }
}