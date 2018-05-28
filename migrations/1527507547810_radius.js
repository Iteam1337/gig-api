exports.shorthands = undefined;

exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "cube";')
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "earthdistance";')
}

exports.down = pgm => {
  pgm.sql('DELETE EXTENSION IF EXISTS "cube";')
  pgm.sql('DELETE EXTENSION IF EXISTS "earthdistance";')
}
