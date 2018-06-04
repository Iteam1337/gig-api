const { Client } = require('pg')

const {
  database: {
    user,
    password,
    host,
    port,
    database
  }
} = require('./config')

const client = new Client(`postgres://${user}:${password}@${host}:${port}/postgres`)

describe('teardown', () => {
  it('drops the db', async () => {
    await client.connect()
    await client
      .query(`DROP DATABASE "${database}";`)
      .catch(error => Promise.reject(error))
    return client.end()
  })
})
