<?php class Contributor extends DataMapper {

var $table    = 'contributors';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('realname');


function __construct($id = NULL) {
    parent::__construct($id);
}



function setPassword($password) {
    // pick a random lowercase letter ($salt), prepend to the password, take the SHA1 of it plus the salt, voila
    $salt   = chr(97 + mt_rand(0, 25));
    $salted = $salt . sha1($salt.$password);

    // save it to the user account
    $this->password = $salted;
    $this->save();
}


function checkPassword($password) {
    // standard pattern for salted password: pull the salt from the stored cipher, prepend to the putative password, take the SHA1 hash; they should be equal
    $salted = $this->password;
    $salt   = substr($salted,0,1);
    return ($salt . sha1($salt.$password)) == $salted;
}

/*
 * Capture certain contributor attributes into a variable we'll
 * store in the session.
 */
function buildSessionDataArray() {
    return array(
        'id' => $this->id,
        'email' => $this->email,
        'realname' => $this->realname,
        'admin' => ($this->admin == 't'),
        'allow_markers' => ($this->allow_markers == 't'),
        'allow_swgh' => ($this->allow_swgh == 't'),
        'allow_loops' => ($this->allow_loops == 't'),
        'allow_closures' => ($this->allow_closures == 't'),
        'allow_twitter' => ($this->allow_twitter == 't'),
    );
}

}