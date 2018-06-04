const { Client } = require('pg')

const {
  database: {
    user,
    password,
    host,
    port,
    database
  }
} = require('../config')

module.exports = (dbName = database) => {
  const client = new Client(`postgres://${user}:${password}@${host}:${port}/${dbName}`)

  const realQuery = client.query

  client.query = (queryText, values = null) => {
    return (!values ? realQuery.call(client, queryText) : realQuery.call(client, queryText, values))
      .catch(error => Promise.reject(error))
  }

  return client
}
