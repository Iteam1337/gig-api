const snakecaseKeys = require('snakecase-keys')

const db = require('../../adapters/db')
const elasticQuery = require('../../helpers/elasticQuery')
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
    require_ssn: !!doc.require_ssn,
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
    retryOnConflict: method === 'update' ? 10 : undefined,
    // update requires body to be an object with a doc-property, not index ...
    body: method === 'update' ? { doc: body } : body
  })

  return elasticClient[method](query)
}

function updateElasticDocument (doc, id) {
  return indexElasticDocument({
    doc,
    id,
    method: 'update'
  })
}

async function update (job, { clientId, clientName } = {}) {
  const dbDocument = await db.oneOrNone(`
    SELECT
      *
    FROM
      jobs
    WHERE
      source_id = $1
      AND
        client = $2;
  `, [job.source_id, clientId])

  if (!dbDocument) {
    console.error(`
      could not find db document
        {"source_id":"${job.source_id}","client":"${clientId}"}
    `)
    return null
  }

  const toSave = Object.assign({}, dbDocument, job)
  const [ upsertResult ] = await db.upsert('jobs', toSave)

  if (!upsertResult || upsertResult.id !== dbDocument.id) {
    console.error(`
      could not run upsert for
        {"source_id":"${toSave.source_id}","client":"${clientId}"}
    `)
    return null
  }

  toSave.source = clientName

  try {
    await updateElasticDocument(toSave, dbDocument.id)
  } catch (error) {
    console.error(error)
    if (error && error.status !== 404) {
      console.error(`
        could not run upsert or insert
          {"source_id":${toSave.source_id}","source":"${toSave.source}"}
      `)

      await db.del('jobs', { id: dbDocument.id })

      return null
    }

    await indexElasticDocument({
      doc: toSave,
      id: dbDocument.id
    })
  }

  return upsertResult
}

async function insert (snakeCasedDoc, source) {
  const result = await db.insert('jobs', snakeCasedDoc)

  const { id } = result

  const doc = Object.assign({}, snakeCasedDoc, { source })

  await indexElasticDocument({
    doc,
    id
  })

  return result
}

async function insertJob (job, client = {}) {
  const { clientId, clientName } = client
  try {
    job = new Job(job)
    job.client = clientId
    // don't set id when creating
    delete job.id
    // source is from relation
    delete job.source
  } catch (error) {
    console.error(`
      ${error.toString()}
      thrown for ${JSON.stringify(job, null, 2)}
    `)
    return job || error
  }

  const { sourceId } = job

  const exists = await db.oneOrNone(`
    SELECT
      1
    FROM jobs
    WHERE
      source_id = $1
      AND client = $2;
  `, [sourceId, clientId])

  const snakeCased = snakecaseKeys(job)

  if (exists) {
    return update(snakeCased, client)
  } else {
    return insert(snakeCased, clientName)
  }
}

async function insertJobs (jobs, client) {
  jobs = Array.isArray(jobs) ? jobs : [jobs]

  const insert = await Promise.all(
    jobs.map(job =>
      insertJob(job, client))
  )

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
