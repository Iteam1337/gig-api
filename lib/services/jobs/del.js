const elasticClient = require('../../adapters/elastic')
const db = require('../../adapters/db')
const { raw } = require('../../helpers/elasticQuery')

async function deleteJob (id) {
  const query = raw({ id, refresh: 'wait_for' })

  if (elasticClient.exists(query)) {
    await elasticClient.delete(query)
    await db.del('jobs', { id })
  }

  return id
}

module.exports = {
  deleteJob
}
