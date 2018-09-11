const snakecaseKeys = require('snakecase-keys')

const db = require('../../adapters/db')
const elasticQuery = require('../../adapters/elasticQuery')
const Job = require('../../models/Job')
const elasticClient = require('../../adapters/elastic')

function formatElasticDocument (doc) {
  if (!doc || Array.isArray(doc) || typeof doc !== 'object') {
    return null
  }

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

function indexElasticDocument ({ doc, id, method = 'index' }) {
  const body = formatElasticDocument(doc)

  const query = elasticQuery.raw({
    id,
    refresh: 'wait_for',
    // update requires body to be an object with a doc-property, not index ...
    body: method === 'update' ? { doc: body } : body
  })

  return elasticClient[method](query)
}

async function update (job) {
  const dbDocument = await db.oneOrNone(`
    SELECT
      *
    FROM
      jobs
    WHERE
      source_id = $1
      AND
        source = $2;
  `, [job.source_id, job.source])

  if (!dbDocument) {
    console.error(`
      could not find db document
        {"source_id":"${job.source_id}","source":"${job.source}"}
    `)
    return null
  }

  const toSave = Object.assign({}, dbDocument, job)
  const [ upsertResult ] = await db.upsert('jobs', toSave)

  if (!upsertResult || upsertResult.id !== dbDocument.id) {
    console.error(`
      could not run upsert for
        {"source_id":"${toSave.source_id}","source":"${toSave.source}"}
    `)
    return null
  }

  await indexElasticDocument({
    doc: toSave,
    id: dbDocument.id,
    method: 'update'
  })

  return upsertResult
}

async function insert (job) {
  const snakeCasedDoc = snakecaseKeys(job)

  const result = await db.insert('jobs', snakeCasedDoc)

  await indexElasticDocument({
    doc: snakeCasedDoc,
    id: result.id
  })

  return result
}

async function insertJob (job) {
  try {
    job = new Job(job)
    delete job.id
  } catch (error) {
    console.error(`
      ${error.toString()}
      thrown for ${JSON.stringify(job, null, 2)}
    `)
    return job || error
  }

  const { sourceId, source } = job

  const sql = `SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2;`
  const exists = await db.manyOrNone(sql, [sourceId, source])

  const snakeCased = snakecaseKeys(job)

  if (exists.length > 0) {
    return update(snakeCased)
  } else {
    return insert(snakeCased)
  }
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
