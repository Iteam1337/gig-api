const db = require('../adapters/db')
const camelcaseKeys = require('camelcase-keys')
const snakecaseKeys = require('snakecase-keys')


async function getPlatforms ({ page = 1, pageLimit = 10 }) {
  const offset = (page - 1) * pageLimit
  const sqlParams = [offset, pageLimit]
  const sql = 'SELECT * FROM platforms ORDER BY created_at OFFSET $1 LIMIT $2'

  const results = await db.manyOrNone(sql, sqlParams)

  let { total } = await db.one('SELECT COUNT(1) AS total FROM platforms')

  total = parseInt(total) || 0

  const totalByLimit = total / pageLimit
  const totalPages = Math.ceil(totalByLimit > 1 ? totalByLimit : 1)

  return {
    results,
    total,
    totalPages,
    currentPage: page
  }
}


async function getPlatform (id) {
  return db.manyOrNone('SELECT * FROM platforms WHERE id = $1;', [id])
}

module.exports = {
  getPlatforms,
  getPlatform
}
