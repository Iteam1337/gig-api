const { expect } = require('chai')
const { stub, match } = require('sinon')
const proxyquire = require('proxyquire')

describe('services/auth', () => {
  let auth, db
  beforeEach(() => {
    db = {
      oneOrNone: stub().resolves()
    }

    auth = proxyquire(`${process.cwd()}/lib/services/auth`, {
      '../adapters/db': db
    })
  })

  describe('initialization', () => {
    it('#validateClientAndReturn', async () => {
      const clientId = 'foo'
      const secret = 'bar'

      db.oneOrNone
        .withArgs(match(/SELECT name FROM allowed_clients/i), [clientId, secret])
        .resolves({
          name: 'example AB'
        })

      const response = await auth.validateClientAndReturn(clientId, secret)

      expect(response).to.eql({
        clientName: 'example AB',
        clientId
      })
    })
  })
})
