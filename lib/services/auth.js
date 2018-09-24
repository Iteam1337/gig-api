const { NotAuthorizedError } = require('restify-errors')
const db = require('../adapters/db')

async function validateClientAndReturn (clientId, clientSecret) {
  const sql = `SELECT name FROM allowed_clients WHERE id = $1 AND secret = $2`
  const client = await db.oneOrNone(sql, [clientId, clientSecret])

  if (!client) {
    throw new NotAuthorizedError('Not a recognized consumer')
  }

  return {
    clientName: client.name,
    clientId
  }
}

module.exports = {
  validateClientAndReturn
}
