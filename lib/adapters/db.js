const pgp = require('pg-promise')()
const { database } = require('../config')

module.exports = {
  db: pgp(database),
  dbHelpers: pgp.helpers
}
