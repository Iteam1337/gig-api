exports.up = async pgm => {
  await pgm.sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
  await pgm.createTable('platforms', {
    id: { type: 'uuid', default: pgm.func('uuid_generate_v4()'), primaryKey: true, notNull: true },
    name: { type: 'text', notNull: true },
    description: { type: 'text', notNull: true },
    logo: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
  })

  return pgm.addColumns('allowed_clients', { platform_id: { type: 'uuid', notNull: false } })
}

exports.down = async pgm => {
  await pgm.dropTable('platforms')

  return pgm.dropColumns('allowed_clients', 'platform_id')
}
