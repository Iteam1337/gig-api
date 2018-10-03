const { stub } = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

describe('lib/routes/jobs', () => {
  let jobRoute, jobService
  beforeEach(() => {
    jobService = {
      insertJobs: stub().resolves(),
      getJobs: stub().resolves(),
      getJob: stub().resolves(),
      deleteJob: stub().returnsArg(0)
    }

    jobRoute = proxyquire(`${process.cwd()}/lib/routes/jobs`, {
      '../services/jobs': jobService
    })
  })

  describe('#deleteJob', () => {
    it('calls the service and resolves the request', async () => {
      const req = {
        params: {
          id: 1
        }
      }

      const res = {
        send: stub()
      }

      const next = stub()

      await jobRoute.deleteJob(req, res, next)

      expect(res.send).calledOnce.calledWith(1)
    })
  })
})
