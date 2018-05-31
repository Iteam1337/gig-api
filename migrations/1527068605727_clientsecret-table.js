exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  pgm.createTable('allowed_clients', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true, notNull: true },
    secret: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true }
  })
}

exports.down = pgm => {
  pgm.dropTable('allowed_clients')
}
