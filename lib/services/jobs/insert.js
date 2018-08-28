const snakecaseKeys = require('snakecase-keys')

const db = require('../../adapters/db')
const Job = require('../../models/Job')

async function insertJob (job) {
  try {
    job = new Job(job)
    delete job.id
  } catch (error) {
    return job || error
  }

  const { sourceId, source } = job

  const sql = `SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2;`
  const exists = await db.manyOrNone(sql, [sourceId, source])

  if (exists.length > 0) {
    return exists[0]
  }

  return db.insert('jobs', snakecaseKeys(job))
}

async function insertJobs (jobs) {
  jobs = Array.isArray(jobs) ? jobs : [jobs]

  const insert = await Promise.all(jobs.map(insertJob))

  const results = insert
    .reduce((object, result, index) => {
      if (!result || !result.id) {
        object.failed.push(jobs[index])
      } else {
        object.successful.push(result.id)
      }
      return object
    }, {
      failed: [],
      successful: []
    })

  return {
    results,
    total: jobs.length,
    successful: results.successful.length,
    failed: results.failed.length
  }
}

module.exports = {
  insertJobs,
  insertJob
}
