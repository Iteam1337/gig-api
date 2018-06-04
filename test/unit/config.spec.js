const { expect } = require('chai')
const { stub, spy, match } = require('sinon')
const proxyquire = require('proxyquire')

describe('config', () => {
  let nconf
  beforeEach(() => {
    nconf = {
      env: stub().returnsThis(),
      file: stub().returnsThis(),
      defaults: spy(),
      get: stub().returns(null)
    }

    proxyquire(`${process.cwd()}/lib/config`, {
      nconf
    })
  })

  describe('initialization', () => {
    it('starts', () => {
      expect(nconf.get).calledWith(match.string)
    })
  })
})
