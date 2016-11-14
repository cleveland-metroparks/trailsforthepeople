<?php

/**
 * Job Model
 */

// Job statuses: Currently storing in DB as text to avoid making up an integer-based system,
// (partly since JS is sometimes looking at these, too).
const JOB_NOT_STARTED  = 'NOT_STARTED';
const JOB_COMPLETE     = 'COMPLETE';
const JOB_ABORTED      = 'ABORTED';
const JOB_RUNNING      = 'RUNNING';
const JOB_PAUSED       = 'PAUSED';


/**
 * Job
 */
class Job extends DataMapper {

var $table    = 'jobs';

function __construct($id = NULL) {
    parent::__construct($id);
}

}



/**
 * Leaving this here for now:
 */

/*

CREATE TABLE IF NOT EXISTS jobs (
  id serial,
  title varchar(100),
  start_time timestamp DEFAULT current_timestamp,
  end_time timestamp,
  creator_email varchar(100),
  percent_complete integer DEFAULT 0,
  status varchar(30),
  status_msg varchar(255),
  PRIMARY KEY(id)
);
GRANT ALL PRIVILEGES ON TABLE jobs TO trails;
GRANT ALL PRIVILEGES ON SEQUENCE jobs_id_seq TO trails;

*/