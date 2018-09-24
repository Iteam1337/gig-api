const elasticClient = require('../../adapters/elastic')
const db = require('../../adapters/db')
const { raw } = require('../../helpers/elasticQuery')

async function checkIfOwner (id, clientId) {
  const query = raw({ id, refresh: 'wait_for' })

  const exists = await elasticClient.exists(query)

  if (!exists) {
    return false
  }

  const sameOwner = await db.oneOrNone(`
    SELECT
      1
    FROM
      jobs
    WHERE
      id = $1 AND client = $2;
  `, [id, clientId])

  return !!sameOwner
}

async function deleteJob (id, { clientId } = {}) {
  const query = raw({ id, refresh: 'wait_for' })

  const allowed = await checkIfOwner(id, clientId)

  if (allowed) {
    await elasticClient.delete(query)
    await db.del('jobs', { id })
  }

  return id
}

module.exports = {
  deleteJob
}
