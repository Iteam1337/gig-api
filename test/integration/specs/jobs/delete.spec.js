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

const req = (options = {}, path = '/jobs') => request({
  path,
  headers: {
    'client-id': site.id,
    'client-secret': site.secret
  },
  options: Object.assign({
    method: 'GET'
  }, options)
})

describe('jobs/delete', () => {
  let now
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

  it('allows the user to remove a job', async () => {
    await req({
      method: 'POST',
      body: job
    })

    const { total, results: [ { id } ] } = await req()

    expect(total, 'total number of saved jobs').to.eql(1)

    await req({
      method: 'DELETE'
    }, `/job/${id}`)

    const { total: totalAfterDelete } = await req()

    expect(totalAfterDelete, 'total after delete').to.eql(0)
  })


  after(async () => {
    await truncateElastic()
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
