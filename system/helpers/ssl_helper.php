<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/**
 * CodeIgniter
 *
 * An open source application development framework for PHP 5.1.6 or newer
 *
 * @package		CodeIgniter
 * @author		ExpressionEngine Dev Team
 * @copyright	Copyright (c) 2008 - 2011, EllisLab, Inc.
 * @license		http://codeigniter.com/user_guide/license.html
 * @link		http://codeigniter.com
 * @since		Version 1.0
 * @filesource
 */

// ------------------------------------------------------------------------

/**
 * CodeIgniter URL Helpers
 *
 * @package		CodeIgniter
 * @subpackage	Helpers
 * @category	Helpers
 * @author		Greg Allensworth at GreenInfo Network
 * @description	supplies the option for generating SSL-based URLs using $config['ssl_url'] in case your whole site isn't running under SSL
 */

// ------------------------------------------------------------------------

/**
 * Site URL
 *
 * Create a local URL based on your basepath. Segments can be passed via the
 * first parameter either as a string or an array.
 *
 * @access	public
 * @param	string
 * @return	string
 */
if ( ! function_exists('ssl_url')) {
	function ssl_url($uri = '') {
		$CI =& get_instance();
		if ($uri == '') $url = $CI->config->slash_item('ssl_url').$CI->config->item('index_page');

		if ($CI->config->item('enable_query_strings') == FALSE) {
			$suffix = ($CI->config->item('url_suffix') == FALSE) ? '' : $CI->config->item('url_suffix');
			$url = $CI->config->slash_item('ssl_url').$CI->config->slash_item('index_page').$CI->config->_uri_string($uri).$suffix;
		}
		else {
			$url = $CI->config->slash_item('ssl_url').$CI->config->item('index_page').'?'.$CI->config->_uri_string($uri);
		}

		return $url;
	}
}


/**
 * Current URL
 *
 * Like the current_url() helper function, except ensures that the SSL base is used.
 *
 * @access	public
 * @return	string
 */
if ( ! function_exists('ssl_current_url')) {
	function ssl_current_url() {
		$CI =& get_instance();
		return ssl_url($CI->uri->uri_string());
	}
}


/**
 * Are we using SSL ?
 *
 * Returns TRUE or FALSE indicating whether SSL is currently in use
 *
 * @return	boolean
 */
if ( ! function_exists('is_ssl')) {
	function is_ssl() {
		return (boolean) @$_SERVER['HTTPS'];
	}
}



/* End of file ssl_helper.php */
/* Location: ./system/helpers/ssl_helper.php */