exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  pgm.createTable('jobs', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true, notNull: true },
    type: { type: 'text', notNull: true },
    company: { type: 'text', notNull: true },
    title: { type: 'text', notNull: true },
    preamble: { type: 'text', notNull: true },
    text: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    language: { type: 'text', notNull: true },
    link: { type: 'text', notNull: true },
    contact: { type: 'text', notNull: true },
    pay: { type: 'jsonb', notNull: false },
    categories: { type: 'jsonb', notNull: false },
    start_date: { type: 'timestamp', notNull: true },
    end_date: { type: 'timestamp', notNull: true },
    listed_date: { type: 'timestamp', notNull: false },
    source: { type: 'text', notNull: false },
    entry_by: { type: 'text', notNull: false },
    source_id: { type: 'text', notNull: true },
    latitude: { type: 'numeric', notNull: true },
    longitude: { type: 'numeric', notNull: true }
  })
}

exports.down = pgm => {
  pgm.dropTable('jobs')
}
