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

const jobsJSON = require('./jobs.fixture.json')

function post (body = []) {
  return request({
    path: '/jobs',
    headers: {
      'client-id': site.id,
      'client-secret': site.secret
    },
    options: {
      method: 'POST',
      body
    }
  })
}

describe('jobs/insertMultiple', () => {
  let now, client

  before(async () => {
    client = psql()
    await client.connect()
    await truncateElastic()
    now = moment().toISOString()
  })

  context('test insert', () => {
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

      const response = await post(jobs)

      expect(response.total).to.eql(12)

      await truncateElastic()
      await client.query(`TRUNCATE jobs CASCADE;`)
    })
  })

  context('test query', () => {
    let jobs, expected
    before(async () => {
      jobs = jobsJSON.map(object => {
        return generateJob(Object.assign({}, {
          company: site.name,
          source: site.name,
          from: now
        }, object))
      })
      expected = jobs.find(job => job.address === 'Nils Ericsons Plan, Stockholm')
    })

    it('inserts multiple jobs and queries', async () => {
      const response = await post(jobs)

      expect(response.total).to.eql(jobs.length)
    })

    it('gets the job using SQL (lat|lon)', async () => {
      const { rows: [ row ] } = await client.query(`
        SELECT
          * FROM jobs
          , earth_distance(
            ll_to_earth('${expected.latitude}', '${expected.longitude}'),
            ll_to_earth(jobs.latitude, jobs.longitude)
          ) AS distance
        WHERE
          end_date > now()
        ORDER BY
          distance ASC
        OFFSET '0'
        LIMIT '1';
      `)

      const { source_id: sourceId } = row

      expect(sourceId).to.eql(expected.sourceId)
    })

    it('gets the job closest to location', async () => {
      const res = await request({
        path: `/jobs?longitude=${expected.longitude}&latitude=${expected.latitude}&pageLimit=1`
      })

      console.log(res.results, { lat: expected.latitude, lon: expected.longitude })

      const { results: [ { sourceId } ] } = res

      expect(sourceId).to.eql(expected.sourceId)
    })

    it('gets the job closest to location AND respects the experience parameter', async () => {
      const [longitude, latitude] = [18.05646, 59.32994]

      await truncateElastic()
      await client.query(`TRUNCATE jobs CASCADE;`)

      jobs.forEach((job, index) => {
        job.longitude = parseFloat(longitude + (index * 0.01)).toFixed(5)
        job.latitude = parseFloat(latitude + (index * 0.01)).toFixed(5)
      })

      await post(jobs)

      const { results } = await request({
        path: `/jobs?longitude=${longitude}&latitude=${latitude}&experience=4.4.1&orderBy=relevance&pageLimit=5`
      })

      const [ first, second, third ] = results

      expect([
        first.sourceId,
        second.sourceId,
        third.sourceId
      ]).to.eql([
        jobs[0].sourceId,
        jobs[2].sourceId,
        jobs[1].sourceId
      ])
    })
  })

  after(async () => {
    await truncateElastic()
    await client.query(`TRUNCATE jobs CASCADE;`)
    await client.end()
  })
})
