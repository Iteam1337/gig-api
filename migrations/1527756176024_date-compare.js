exports.shorthands = undefined

exports.up = pgm => {
  pgm.createExtension('btree_gist')
}

exports.down = pgm => {
  pgm.dropExtension('btree_gist')
}
