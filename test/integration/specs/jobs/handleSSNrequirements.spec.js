const { expect } = require('chai')
const moment = require('moment')
const pMap = require('p-map')

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

const now = moment().toISOString()

const requireSSN = generateJob({
  company: site.name,
  source: site.name,
  from: now,
  requireSsn: true
})

const noRequireSSN = generateJob({
  company: site.name,
  source: site.name,
  from: now,
  requireSsn: false
})

describe('jobs/handdle-ssn-requirements', () => {
  let client

  before(async () => {
    client = psql()
    await client.connect()

    await pMap([requireSSN, noRequireSSN], async job => {
      await req({
        method: 'POST',
        body: job
      })
    }, { concurrency: 2 })
  })

  it('gets all documents, if no filter is set', async () => {
    const { total, results: [ { sourceId: firstSourceId }, { sourceId: secondSourceId } ] } = await req()

    expect(total, 'total number of saved jobs').to.eql(2)

    const sources = [ firstSourceId, secondSourceId ]

    expect(sources.includes(requireSSN.sourceId)).to.eql(true)
    expect(sources.includes(noRequireSSN.sourceId)).to.eql(true)
  })

  it('does not wreck havock!', async () => {
    const res = await req({}, '/jobs?requireSsn=true')

    console.log(res)
  })

  it('handles require (set to true) as expected', async () => {
    const { results: [ { requireSsn } ] } = await req({}, '/jobs?requireSsn=true')
    expect(requireSsn, 'document is as expected').to.eql(true)
  })

  it('handles require (set to 1) as expected', async () => {
    const { results: [ { requireSsn } ] } = await req({}, '/jobs?requireSsn=1')
    expect(requireSsn, 'document is as expected').to.eql(true)
  })

  it('handles require (set to false) as expected', async () => {
    const { results: [ { requireSsn } ] } = await req({}, '/jobs?requireSsn=false&debug=true')
    expect(requireSsn, 'document is as expected').to.eql(false)
  })

  it('handles require (set to 0) as expected', async () => {
    const { results: [ { requireSsn } ] } = await req({}, '/jobs?requireSsn=0&debug=true')
    expect(requireSsn, 'document is as expected').to.eql(false)
  })

  after(async () => {
    await truncateElastic()
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
