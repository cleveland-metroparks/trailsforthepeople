--
-- Update CM Maps "materialized view" view_cmp_gisbeachclosures
--

BEGIN;
DELETE FROM view_cmp_gisbeachclosures;
INSERT INTO view_cmp_gisbeachclosures
  SELECT * FROM fdw_cmp_gisbeachclosures;
END;
