<?php class Twitter extends DataMapper {
/* This class queries the list of Twitter postings (tweets), whether they are visible or pending or deleted, et cetera.
 */

var $table    = 'tweets';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array("posted");


function __construct($id = NULL) {
    parent::__construct($id);
}



function getBanList($list=false) {
    $banned = array();
    $bx = $this->db->query("SELECT * FROM tweets_banned ORDER BY username");
    foreach ($bx->result() as $b) $banned[$b->username] = true;
    return $list ? array_keys($banned) : $banned;
}


function addToBanList($username) {
    // are they already on the list? if so, simply bail
    $already = $this->db->query('SELECT COUNT(*) AS already FROM tweets_banned WHERE username=?', array($username) )->row();
    $already = $already->already;
    if ($already) return false;

    // do the insertion
    $this->db->query('INSERT INTO tweets_banned (username) VALUES (?)', array($username) );
    return true;
}


function removeFromBanList($username) {
    $this->db->query('DELETE FROM tweets_banned WHERE username=?', array($username) );
}



}