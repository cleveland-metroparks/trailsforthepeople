<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * HTML markup helper functions.
 */

/**
 * Check if a array's keys are strings (instead of numeric).
 *
 * We use this to identify options lists specified with different keys and values,
 * vs only one set (to use as both).
 */
function has_string_keys(array $array) {
  return count(array_filter(array_keys($array), 'is_string')) > 0;
}

/**
 * Render an HTML <select> list.
 *
 * @param $options
 *   Can be specified as a simple array of strings,
 *   in which case each string is used as both the value and the human readable text,
 *   or an associative array with: 'value'=>'human readable' items.
 */
if (!function_exists('html_select_list'))
{
    function html_select_list($name, $options, $selected) {
        $markup = '<select class="form-control" name="' . $name . '">';
        $has_string_keys = has_string_keys($options);
        foreach ($options as $k => $v) {
            $human_readable = $v;
            if ($has_string_keys) {
                $machine_name = $k;
            } else {
                $machine_name = $v;
            }
            $selected_markup = ($machine_name == $selected) ? ' selected="true"' : '';
            $markup .= '<option value="' . $machine_name . '"' . $selected_markup . '>' . $human_readable . '</option>';
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
        $has_string_keys = has_string_keys($options);
        foreach ($options as $k => $v) {
            $human_readable = $v;
            if ($has_string_keys) {
                $machine_name = $k;
            } else {
                $machine_name = $v;
            }
            $selected_markup = in_array($machine_name, $selected_list) ? ' checked' : '';
            $markup .=
                '<label class="checkbox-inline">
                <input class="form-check-input" type="checkbox" value="' . $machine_name .'"' . $selected_markup . '>'
                . htmlspecialchars($human_readable) . '</label>';
        }

        return $markup;
    }
}