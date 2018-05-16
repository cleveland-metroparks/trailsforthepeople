<?php class CMSEvent extends DataMapper {
    ///// this class is a wrapper around the cms_points table, which itself is loaded via a cronjob from a remote XML feed at Cleveland's website CMS

var $table    = 'cms_events';
var $default_order_by = array('sortdate','title');

function __construct($id = NULL) {
    parent::__construct($id);
}


}
