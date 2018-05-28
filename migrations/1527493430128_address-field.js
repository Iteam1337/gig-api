exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('jobs', { address: { type: 'text', notNull: true } })
}

exports.down = (pgm) => {
  pgm.dropColumns('jobs', 'address')
};
