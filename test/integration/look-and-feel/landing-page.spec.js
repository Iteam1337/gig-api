const { expect } = require('chai')
const { request } = require('../helpers')

describe('landing-page', () => {
  it('gets the root-page', async () => {
    const response = await request({ path: '/' })

    expect(response).to.eql({ data: { message: 'Gig API' } })
  })
})
