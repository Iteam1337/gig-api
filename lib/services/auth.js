const { NotAuthorizedError } = require('restify-errors')
const db = require('../adapters/db')

async function validateClientAndReturnInfo (id, secret) {
  const sql = `SELECT id, secret FROM allowed_clients WHERE id = $1 AND secret = $2`
  const data = await db.manyOrNone(sql, [id, secret])

  if (!data || data.length < 1) {
    throw new NotAuthorizedError('Not a recognized consumer')
  }

  return true
}

module.exports = {
  validateClientAndReturnInfo
}
