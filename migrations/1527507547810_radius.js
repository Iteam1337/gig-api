exports.shorthands = undefined;

exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "cube";')
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "earthdistance";')
  // pgm.sql('CREATE INDEX "latitude_longitude" on "jobs" USING gist(ll_to_earth("latitude", "longitude"));')
}

exports.down = pgm => {
  pgm.sql('DROP EXTENSION IF EXISTS "earthdistance" cascade;')
  pgm.sql('DROP EXTENSION IF EXISTS "cube" cascade;')
  // pgm.sql('DROP INDEX IF EXISTS "latitude_longitude";')
}
