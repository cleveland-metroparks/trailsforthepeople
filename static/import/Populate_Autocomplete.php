<?php
///// the autocomplete_words table is used by ajax.php autocomplete_keywords()
///// to give the client a list of autocomplete phrases to help them in guessing
///// the right inflection of ball, baseball, baseball diamond, sport, sporting, sports, ...
///// Not strictly necessary but a guide for those who don't know what they're looking for...

///// This PHP empties the autocomplete table and then repopulates it,
///// using the titles, names, and activities found in the various tables
///// reservations, buildings, Use Area POIs, ...

// define BASEPATH so we can properly include config files
// the value isn't used since we're only including config and not launching CodeIgniter
define('BASEPATH', getcwd() );

// connect to the database
require '/var/www/application/config/database.php';
$DB_USER = $db['default']['username'];
$DB_PASS = $db['default']['password'];
$DB_BASE = $db['default']['database'];
$DB_PORT = $db['default']['port'];
$db = pg_connect("dbname={$DB_BASE} user={$DB_USER} password={$DB_PASS} port={$DB_PORT}");

// what tables and fields do we use to collect the words that we're interested in?
// this can be a straight fieldname, or multiple field names joined with coalesce()
// This is cribbed directly from views/docs/dbdata.phtml which generates the tsvector search terms,
// so we should end up with results that closely match the real searchable terms
$tables_and_fields = array(
    "reservation_boundaries_public_private_cm_dissolved" => "res",
    "cm_use_areas" => "coalesce(use_area,'') || ' ' || replace(coalesce(use_area,''),'.',' ') || ' ' || replace(coalesce(use_area,''),'.','') || ' ' || replace(coalesce(use_area,''),'-',' ') || ' ' || replace(coalesce(use_area,''),'-','') || ' ' || coalesce(activity,'')",
    "cm_buildings" => "coalesce(name,'') || ' ' || replace(coalesce(name,''),'.',' ') || ' ' || replace(coalesce(name,''),'.','') || ' ' || replace(coalesce(name,''),'-',' ') || ' ' || replace(coalesce(name,''),'-','') || ' ' || coalesce(site_location,'')",
    "trails_fixed" => "name",
    "loops" => "name",
);

header('Content-type: text/plain');

// repopulate it one at a time, filtering the words as we go
// try to eliminate very short items like "and" and non-word things like phone numbers
$COLLECTED_WORDS = array();
foreach ($tables_and_fields as $tablename=>$fieldclause) {
    $rows = pg_query("SELECT $fieldclause AS words FROM $tablename");
    while ($row = pg_fetch_assoc($rows)) {
        $words = preg_split('/\s+/', preg_replace('/[^\w\s]/', ' ', $row['words'] ));
        foreach ($words as $word) {
            // filter out blank or nonsensical potential words
            if (strlen($word) < 3) continue;
            if (strlen($word) == 32) continue; // a randomly-generated ID, e.g. for Loops
            if ($word == 'and') continue;
            $COLLECTED_WORDS[ $word ] = true;
        }
    }
}

// now that we have a unique set of words, sort them and flatten into a list
$COLLECTED_WORDS = array_keys($COLLECTED_WORDS);
sort($COLLECTED_WORDS);
printf("***** Collected %d words\n", sizeof($COLLECTED_WORDS) );

// finally, do the purge and insertion
pg_query('TRUNCATE TABLE autocomplete_words');
foreach ($COLLECTED_WORDS as $word) {
    printf("    %s\n", $word );
    pg_query_params('INSERT INTO autocomplete_words (word) VALUES ($1)', array($word) );
}
print "***** Autocomplete table repopulated. Done.\n";
