const snakecaseKeys = require('snakecase-keys')

const db = require('../../adapters/db')
const Job = require('../../models/Job')
const elasticClient = require('../../adapters/elastic')

const index = `${elasticClient.indexPrefix}jobs`

function elasticDocument (doc) {
  return {
    type: doc.type,
    company: doc.company,
    title: doc.title,
    preamble: doc.preamble,
    text: doc.text,
    created_at: new Date(doc.created_at),
    language: doc.language,
    link: doc.link,
    contact: doc.contact,
    pay: doc.pay,
    payment_type: doc.payment_type,
    currency: doc.currency,
    start_date: new Date(doc.start_date),
    end_date: new Date(doc.end_date),
    listed_date: new Date(doc.listed_date),
    position: {
      lat: doc.latitude,
      lon: doc.longitude
    },
    source: doc.source,
    source_id: doc.source_id,
    entry_by: doc.entry_by,
    address: doc.address,
    experience: doc.experience ? doc.experience.replace(/\{|\}/g, '').split(',') : null,
    skills: doc.skills ? doc.skills.replace(/\{|\}/g, '').split(',') : null,
    education: doc.education ? doc.education.replace(/\{|\}/g, '').split(',') : null,
    language_skills: doc.language_skills ? doc.language_skills.replace(/\{|\}/g, '').split(',') : null
  }
}

async function insertElasticDocument (doc, { id }) {
  return elasticClient.index({
    index,
    type: 'job',
    id,
    refresh: 'wait_for',
    body: elasticDocument(doc)
  })
}

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

  const snakeCasedDoc = snakecaseKeys(job)

  const result = await db.insert('jobs', snakeCasedDoc)

  await insertElasticDocument(snakeCasedDoc, result)

  return result
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
