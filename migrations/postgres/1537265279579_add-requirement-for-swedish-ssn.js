exports.shorthands = undefined;

exports.up = pgm => {
  pgm.addColumns('jobs', {
    require_ssn: {
      type: 'boolean',
      default: false
    }
  })
}

exports.down = pgm => {
  pgm.dropColumns('jobs', 'require_ssn')
}
