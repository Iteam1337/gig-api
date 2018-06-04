const { expect } = require('chai')
const { useFakeTimers } = require('sinon')
const request = require('../../helpers/request')
const {
  sites: {
    gigstr: site
  }
} = require('../../config')

describe('jobs/insert', () => {
  let job, jobID
  beforeEach(() => {

    let now = useFakeTimers(Date.now())
    let then = useFakeTimers(Date.now())

    then.tick('48:00:00')

    job = {
      sourceId: 'a0z9',
      type: 'gig',
      company: site.name,
      title: 'foo',
      preamble: 'bar',
      text: 'bar',
      createdAt: new Date(now.now).toISOString(),
      language: 'sv',
      link: 'http://foo.bar',
      contact: 'mail@dennispettersson.se',
      currency: 'SEK',
      pay: 100,
      paymentType: 'hourly',
      startDate: new Date(now.now).toISOString(),
      endDate: new Date(then.now).toISOString(),
      listedDate: new Date(now.now).toISOString(),
      source: site.name,
      entryBy: 'integration',
      latitude: 59.3454567,
      longitude: 18.060362,
      address: 'Östermalmsgatan 26A, 114 26 Stockholm',
      experience: null,
      skills: null,
      education: null,
      languageSkills: null
    }
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

  it('saves a gig if token is sent', async () => {
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

  it('can get the job!', async () => {
    const { total, totalPages, currentPage, results } = await request({
      path: '/jobs'
    })

    expect([total, totalPages, currentPage]).to.eql([1, 1, 1])

    const [ result ] = results

    expect(result).to.eql(Object.assign({}, job, { id: jobID }))
  })
})
