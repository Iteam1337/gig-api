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

const jobsJSON = require('./jobs.json')

describe('jobs/insertMultiple', () => {
  let now, client

  before(async () => {
    client = psql()
    await client.connect()
    now = useFakeTimers(Date.now())
  })

  it('checks if there are any jobs in the database', async () => {
    const results = await client.query(`SELECT COUNT(*) FROM jobs;`)

    const { rows: [{ count }] } = results

    expect(count).to.eql('0')
  })

  it('inserts multiple jobs', async () => {
    const jobs = [...Array(12).keys()]
      .map(() => generateJob({
        company: site.name,
        source: site.name,
        from: now
      }))

    const response = await request({
      path: '/jobs',
      headers: {
        'client-id': site.id,
        'client-secret': site.secret
      },
      options: {
        method: 'POST',
        body: jobs
      }
    })

    expect(response.total).to.eql(12)

    await client.query(`TRUNCATE jobs CASCADE;`)
  })

  let jobs
  beforeEach(async () => {
    jobs = jobsJSON.map(object => {
      return generateJob(Object.assign({}, {
        company: site.name,
        source: site.name,
        from: now
      }, object))
    })
  })

  it('inserts multiple jobs and queries', async () => {
    const response = await request({
      path: '/jobs',
      headers: {
        'client-id': site.id,
        'client-secret': site.secret
      },
      options: {
        method: 'POST',
        body: jobs
      }
    })

    expect(response.total).to.eql(jobs.length)
  })

  it('gets the job closest to location', async () => {
    const expected = jobs.find(job => job.address === 'Nils Ericsons Plan, Stockholm')
    const { results: [ { sourceId } ] } = await request({ path: `/jobs?longitude=${expected.longitude}&latitude=${expected.latitude}&pageLimit=1` })
    expect(sourceId).to.eql(expected.sourceId)
  })

  after(async () => {
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
