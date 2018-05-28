const db = require('../adapters/db')
const dedent = require('dedent')
const camelcaseKeys = require('camelcase-keys')
const snakecaseKeys = require('snakecase-keys')

async function getJobs (page = 1, pageLimit = 10) {
  const offset = (page - 1) * pageLimit
  const sql = `SELECT * FROM jobs ORDER BY created_at OFFSET $1 LIMIT $2`

  const results = await db.manyOrNone(sql, [offset, pageLimit]).then(camelcaseKeys)
  const { total } = await db.one('SELECT COUNT(1) AS total FROM jobs')
  const totalByLimit = total / pageLimit
  const totalPages = totalByLimit > 1 ? totalByLimit : 1

  return {
    results,
    total: parseInt(total),
    totalPages,
    currentPage: page
  }
}

async function getJob (id) {
  return db.manyOrNone('SELECT * FROM JOBS where id = $1', [id])
}

async function insertJob (job) {
  const {
    type,
    company,
    title,
    preamble,
    text,
    createdAt,
    language,
    link,
    contact,
    pay,
    categories,
    startDate,
    endDate,
    listedDate,
    source,
    sourceId,
    entryBy,
    longitude,
    latitude,
    address
  } = job

  const sql = 'SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2'
  const exists = await db.manyOrNone(sql, [sourceId, source])

  if (exists.length > 0) {
    return
  }

  return db.insert('jobs', snakecaseKeys({ type, company, title, preamble, text, createdAt, language, link, contact, pay, categories, startDate, endDate, listedDate, source, sourceId, entryBy, longitude, latitude, address }))
}

async function insertJobs (jobs) {
  await Promise.all(jobs.map(insertJob))

  return { message: 'ok' }
}

module.exports = {
  getJobs,
  getJob,
  insertJobs,
  insertJob
}
