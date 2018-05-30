exports.up = pgm => {
  pgm.sql(`TRUNCATE jobs CASCADE;`)

  pgm.createExtension('ltree')

  pgm.createType('language', ['en', 'sv', 'ar', 'fa', 'so', 'ti'])
  pgm.createType('employment', ['gig', 'employment'])
  pgm.createType('payment', ['hourly', 'fixed'])

  pgm.dropColumns('jobs', ['type', 'categories', 'language', 'pay'])

  pgm.addColumns('jobs', {
    type: { type: 'employment', notNull: true },
    pay: { type: 'numeric', notNull: false },
    payment_type: { type: 'payment', notNull: false },
    currency: { type: 'text', notNull: false },
    category: { type: 'ltree', notNull: false },
    language: { type: 'language', notNull: true }
  })

  pgm.alterColumn('jobs', 'start_date', { type: 'timestamp', notNull: false })
  pgm.alterColumn('jobs', 'end_date', { type: 'timestamp', notNull: false })
}

exports.down = pgm => {
  pgm.sql(`TRUNCATE jobs CASCADE;`)

  pgm.dropColumns('jobs', ['type', 'category', 'language', 'payment_type', 'currency', 'pay'])

  pgm.addColumns('jobs', {
    type: { type: 'text', notNull: true },
    categories: { type: 'jsonb', notNull: false },
    pay: { type: 'jsonb', notNull: false },
    language: { type: 'text', notNull: true },
    pay: { type: 'jsonb', notNull: false }
  })

  pgm.alterColumn('jobs', 'start_date', { type: 'timestamp', notNull: true })
  pgm.alterColumn('jobs', 'end_date', { type: 'timestamp', notNull: true })

  pgm.dropExtension('ltree')

  pgm.dropType('language')
  pgm.dropType('employment')
  pgm.dropType('payment')
}
