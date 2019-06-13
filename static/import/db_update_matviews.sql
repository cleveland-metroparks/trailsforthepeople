-- -------------------------------------------
-- Update CM Maps FDW-based materialized views.
-- -------------------------------------------


--
-- Update "materialized view" view_cmp_gisactivitytype
--

BEGIN;
DELETE FROM view_cmp_gisactivitytype;
INSERT INTO view_cmp_gisactivitytype
  SELECT * FROM fdw_cmp_gisactivitytype;
END;


--
-- Update "materialized view": view_cmp_gisamenitytype
--

BEGIN;
DELETE FROM view_cmp_gisamenitytype;
INSERT INTO view_cmp_gisamenitytype
  SELECT * FROM fdw_cmp_gisamenitytype;
END;


--
-- Update "materialized view": view_cmp_gisattractions
--

BEGIN;
DELETE FROM view_cmp_gisattractions;
INSERT INTO view_cmp_gisattractions
SELECT * FROM fdw_cmp_gisattractions;
-- Recreate geometries:
UPDATE view_cmp_gisattractions SET geom = ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),3734);
UPDATE view_cmp_gisattractions SET drivingdestination_geom = ST_Transform(ST_SetSRID(ST_MakePoint(drivingdestinationlongitude, drivingdestinationlatitude), 4326),3734);
END;


--
-- Update "materialized view": view_cmp_categories
--

BEGIN;
DELETE FROM view_cmp_giscategories;
INSERT INTO view_cmp_giscategories
  SELECT * FROM fdw_cmp_giscategories;
END;


--
-- Update "materialized view": view_cmp_reservations
--

BEGIN;
DELETE FROM view_cmp_gisreservations;
INSERT INTO view_cmp_gisreservations
  SELECT * FROM fdw_cmp_gisreservations;
-- Recreate geometries:
UPDATE view_cmp_gisreservations SET geom = ST_Transform(ST_SetSRID(ST_MakePoint(longitude, latitude), 4326),3734);
UPDATE view_cmp_gisreservations SET drivingdestination_geom = ST_Transform(ST_SetSRID(ST_MakePoint(drivingdestinationlongitude, drivingdestinationlatitude), 4326),3734);
END;


--
-- Update "materialized view": view_cmp_venuetype
--

BEGIN;
DELETE FROM view_cmp_gisvenuetype;
INSERT INTO view_cmp_gisvenuetype
  SELECT * FROM fdw_cmp_gisvenuetype;
END;

--
-- Cleanup
--

VACUUM(FULL);

