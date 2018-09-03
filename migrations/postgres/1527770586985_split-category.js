exports.up = pgm => {
  pgm.sql(`TRUNCATE jobs CASCADE;`)

  pgm.dropColumns('jobs', ['category'])

  pgm.addColumns('jobs', {
    experience: { type: 'ltree[]', notNull: false },
    skills: { type: 'ltree[]', notNull: false },
    education: { type: 'ltree[]', notNull: false },
    language_skills: { type: 'ltree[]', notNull: false }
  })
}

exports.down = pgm => {
  pgm.sql(`TRUNCATE jobs CASCADE;`)

  pgm.dropColumns('jobs', ['experience', 'skills', 'education', 'language_skills'])

  pgm.addColumns('jobs', {
    category: { type: 'ltree', notNull: false }
  })
}
