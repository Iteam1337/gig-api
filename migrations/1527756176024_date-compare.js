exports.shorthands = undefined

exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "btree_gist";')
}

exports.down = pgm => {
  pgm.sql('DROP EXTENSION IF EXISTS "btree_gist" cascade;')
}
