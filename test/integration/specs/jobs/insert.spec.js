const { expect } = require('chai')
const moment = require('moment')

const request = require('../../helpers/request')
const {
  sites: {
    gigstr: site
  }
} = require('../../config')
const psql = require('../../helpers/psql')
const generateJob = require('../../helpers/generateJob')
const { truncate: truncateElastic } = require('../../helpers/elasticClient')

describe('jobs/insert', () => {
  let job, jobID, now
  let client

  before(async () => {
    await truncateElastic()

    client = psql()
    await client.connect()

    now = moment().toISOString()
    job = generateJob({
      company: site.name,
      source: site.name,
      from: now
    })
  })

  it('responds with a error if no token is sent', async () => {
    let response

    try {
      await request({ path: '/jobs', options: { method: 'POST' } })
    } catch (error) {
      response = error
    }

    expect(response.statusCode).to.eql(403)
    expect(response.error).to.eql({
      message: 'Not a recognized consumer'
    })

    return true
  })

  it('checks if there are any jobs in the database', async () => {
    const results = await client.query(`SELECT COUNT(*) FROM jobs;`)

    const { rows: [{ count }] } = results

    expect(count).to.eql('0')
  })

  it('saves a job if token is sent', async () => {
    const response = await request({
      path: '/jobs',
      headers: {
        'client-id': site.id,
        'client-secret': site.secret
      },
      options: {
        method: 'POST',
        body: [ job, { entryBy: 'integration' } ]
      }
    })

    expect(response).to.have.all.keys('total', 'successful', 'failed', 'results')

    const { results, total, failed, successful } = response

    expect([total, failed, successful]).to.eql([2, 1, 1])

    expect(results.failed).to.eql([{ entryBy: 'integration' }])

    expect(results.successful).to.have.lengthOf(1)
    const { successful: [ uuid ] } = results
    expect(uuid).to.be.a.uuid('v4')

    jobID = uuid
  })


  it('checks if there are any jobs in the database', async () => {
    const { rows: [ row ], rowCount } = await client.query(`SELECT * FROM jobs;`)
    expect(rowCount).to.eql(1)
    expect(row.id).to.eql(jobID)
    return true
  })

  it('can get the job!', async () => {
    const { total, totalPages, currentPage, results } = await request({
      path: '/jobs'
    })

    expect([total, totalPages, currentPage], '[total, totalPages, currentPage]').to.eql([1, 1, 1])

    const [ result ] = results

    expect(result, 'result').to.eql(Object.assign({}, job, { id: jobID }))
  })

  it('can get the specific job', async () => {
    const { id } = await request({
      path: `/job/${jobID}`
    })

    expect(id).to.eql(jobID)
  })

  function postJob (job) {
    return request({
      path: '/jobs',
      headers: {
        'client-id': site.id,
        'client-secret': site.secret
      },
      options: {
        method: 'POST',
        body: job
      }
    })
  }

  it('updates successfully if re-adding', async () => {
    job.endDate = moment().add(52, 'hours').toISOString()

    const response = await postJob(job)

    expect(response, 'response to look a specific way').to.have.all.keys('total', 'successful', 'failed', 'results')

    const { total, failed, successful } = response

    expect([total, failed, successful], '[total, failed, successful]').to.eql([1, 0, 1])
  })

  it('checks if the job got stuck in database', async () => {
    const { rows: [ row ], rowCount } = await client.query(`SELECT * FROM jobs;`)
    expect(rowCount).to.eql(1)
    expect(row.source_id).to.eql(job.sourceId)
  })

  it('really does update when re-inserting a job', async () => {
    const expectedDateBeforeModified = moment().add(5, 'minutes').toISOString()
    const expectedDateAfterModified = moment(expectedDateBeforeModified).add(2, 'days').toISOString()

    await truncateElastic()
    await client.query(`TRUNCATE jobs CASCADE;`)

    job.endDate = expectedDateBeforeModified

    await postJob(job)

    const { results: initialResponse } = await request({ path: '/jobs' })
    expect(initialResponse, 'check length of initial response').to.have.lengthOf(1)

    const [ { endDate } ] = initialResponse
    expect(endDate, 'endDate before modifying').to.eql(expectedDateBeforeModified)

    job.endDate = expectedDateAfterModified
    await postJob(job)

    const { results: afterModified } = await request({ path: '/jobs' })
    expect(afterModified).to.have.lengthOf(1)

    const [ { endDate: endDateAfterModified } ] = afterModified

    expect(endDateAfterModified).to.eql(expectedDateAfterModified)
  })

  after(async () => {
    await truncateElastic()
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
