const { expect } = require('chai')
const request = require('request-promise')
const { port } = require(`${process.cwd()}/lib/config`)

describe('gets the root', () => {
  it('works?', async () => {
    const response = await request({
      uri: `http://localhost:${port}`,
      headers: {},
      json: true
    })

    expect(response).to.eql({ data: { message: 'Gig API' } })
  })
})
