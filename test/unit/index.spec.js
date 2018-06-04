const { expect } = require('chai')
const { stub, spy } = require('sinon')
const proxyquire = require('proxyquire')

describe('index', () => {
  let restify, cors, routes, config, app
  beforeEach(() => {
    app = {
      pre: spy(),
      use: spy(),
      on: spy(),
      listen: spy()
    }
    restify = {
      createServer: stub().returns(app),
      pre: {
        sanitizePath: spy()
      },
      plugins: {
        bodyParser: spy(),
        queryParser: spy()
      },
      MethodNotAllowedError: spy()
    }
    cors = spy()
    routes = {
      add: spy()
    }
    config = {
      port: 1337
    }
    proxyquire(`${process.cwd()}/lib`, {
      restify,
      cors,
      './routes': routes,
      './config': config
    })
  })

  describe('initialization', () => {
    it('starts', () => {
      expect(app.listen).calledOnce.calledWith(1337)
    })
  })
})
