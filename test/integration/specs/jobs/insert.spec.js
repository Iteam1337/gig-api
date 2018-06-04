const { expect } = require('chai')
const request = require('../../helpers/request')
const {
  sites: {
    gigstr
  }
} = require('../../config')

describe('jobs/insert', () => {
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
        'client-id': gigstr.id,
        'client-secret': gigstr.secret
      },
      options: {
        method: 'POST',
        body: {
          some: 'payload'
        }
      }
    })

    expect(response).to.eql({ foo: 'bar' })
  })
})
