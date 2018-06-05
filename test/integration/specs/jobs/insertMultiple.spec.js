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

describe('jobs/insertMultiple', () => {
  let now, client

  before(async () => {
    now = useFakeTimers(Date.now())

    client = psql()
    await client.connect()
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
  })

  after(async () => {
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
