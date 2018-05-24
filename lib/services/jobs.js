const db = require('../adapters/db')
const dedent = require('dedent')
const camelcaseKeys = require('camelcase-keys')
const snakecaseKeys = require('snakecase-keys')

async function getJobs () {
  const sql = 'SELECT * FROM jobs'

  return db.manyOrNone(sql)
    .then(camelcaseKeys)
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
    latitude
  } = job

  const sql = 'SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2'
  const exists = await db.manyOrNone(sql, [sourceId, source])

  if (exists.length > 0) {
    return
  }

  return db.insert('jobs', snakecaseKeys({ type, company, title, preamble, text, createdAt, language, link, contact, pay, categories, startDate, endDate, listedDate, source, sourceId, entryBy, longitude, latitude }))
}

async function insertJobs (jobs) {
  await Promise.all(jobs.map(insertJob))

  return { message: 'ok' }
}

module.exports = {
  getJobs,
  insertJobs,
  insertJob
}
