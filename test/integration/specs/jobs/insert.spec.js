const { expect } = require('chai')
const { useFakeTimers } = require('sinon')
const request = require('../../helpers/request')
const {
  sites: {
    gigstr: site
  }
} = require('../../config')

const psql = require('../../helpers/psql')
const generateJob = require('../../helpers/generateJob')

describe('jobs/insert', () => {
  let job, jobID, now

  before(() => {
    now = useFakeTimers(Date.now())

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

  let client
  before(async () => {
    client = psql()
    await client.connect()
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

    expect([total, totalPages, currentPage]).to.eql([1, 1, 1])

    const [ result ] = results

    expect(result).to.eql(Object.assign({}, job, { id: jobID }))
  })

  it('can get the specific job', async () => {
    const { id } = await request({
      path: `/job/${jobID}`
    })

    expect(id).to.eql(jobID)
  })

  it('does not re-add the same job twice', async () => {
    const future = useFakeTimers(Date.now())

    future.tick('52:00:00')

    job.endDate = new Date(future.now).toISOString()

    const response = await request({
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

    expect(response).to.have.all.keys('total', 'successful', 'failed', 'results')

    const { results, total, failed, successful } = response

    expect([total, failed, successful]).to.eql([1, 1, 0])

    const { failed: [ { sourceId } ] } = results

    expect(sourceId).to.eql(job.sourceId)
  })

  it('checks if the job got stuck in database', async () => {
    const { rows: [ row ], rowCount } = await client.query(`SELECT * FROM jobs;`)
    expect(rowCount).to.eql(1)
    expect(row.source_id).to.eql(job.sourceId)
  })

  after(async () => {
    await client.end()
  })
})
