<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * Filesystem helper functions.
 */

/**
* Get the total size and number of files (not dirs) within a given directory.
*/
if ( ! function_exists('_dir_stats'))
{
    function _dir_stats($dir_path) {
        $stats = array(
            'num_files' => 0,
            'size' => 0
        );
        foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir_path)) as $file){
            if (is_file($file)) {
                $stats['num_files']++;
            }
            $stats['size'] += $file->getSize();
        }
        return $stats;
    }
}

/**
* Converts bytes into human readable file size.
*/
if ( ! function_exists('_human_filesize')) {
    function _human_filesize($bytes, $decimals = 2) {
      $sz = 'BKMGTP';
      $factor = floor((strlen($bytes) - 1) / 3);
      return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
    }
}

/**
 * Remove one directory at a time so we can generate status and output
 */
if ( ! function_exists('_rrmdir')) {
    function _rrmdir($path) {
        if (is_file($path)) {
            return @unlink($path);
        } else {
            return array_map('_rrmdir', glob($path . '/*')) == @rmdir($path);
        }
    }
}