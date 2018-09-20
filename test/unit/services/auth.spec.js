const { expect } = require('chai')
const { stub, match } = require('sinon')
const proxyquire = require('proxyquire')

describe('services/auth', () => {
  let auth, db
  beforeEach(() => {
    db = {
      manyOrNone: stub().resolves()
    }

    auth = proxyquire(`${process.cwd()}/lib/services/auth`, {
      '../adapters/db': db
    })
  })

  describe('initialization', () => {
    it('#validateClientAndReturnInfo', async () => {
      const id = 'foo'
      const secret = 'bar'

      db.manyOrNone
        .withArgs(match(/SELECT id, secret FROM allowed_clients/i), [id, secret])
        .resolves([{
          id,
          secret
        }])

      const response = await auth.validateClientAndReturnInfo(id, secret)

      expect(response).to.eql(true)
    })
  })
})
