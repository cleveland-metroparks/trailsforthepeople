<?php class Auditlog extends DataMapper {
// this class is used for logging activity of Contributors and Administrators
// used primarily within those Controllers

var $table    = 'auditlog';
var $default_order_by = array('timestamp DESC');


function __construct($id = NULL) {
    parent::__construct($id);
}

/**
 * Get all audit log messages.
 */
public static function fetch_messages($howmany=500) {
    $logs = new Auditlog();
    $logs->limit($howmany)->get();
    return $logs;
}

/**
 * Add an audit log message.
 */
public static function log_message($message, $username=null) {
    $msg = new Auditlog();
    $msg->username    = $username;
    $msg->message     = $message;
    $msg->ipaddress   = $_SERVER['REMOTE_ADDR'];
    $msg->save();
}

}