const { stub, match } = require('sinon')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

describe('lib/services/jobs/del', () => {
  let service, elasticClient, db
  beforeEach(() => {
    elasticClient = {
      delete: stub(),
      exists: stub().returns(true)
    }
    db = {
      del: stub()
    }
    service = proxyquire(`${process.cwd()}/lib/services/jobs/del`, {
      '../../adapters/elastic': elasticClient,
      '../../adapters/db': db
    })
  })

  describe('#deleteJob', () => {
    it('calls the service and resolves the request', async () => {
      const id = 1

      const response = await service.deleteJob(id)

      expect(response, 'response').to.eql(id)

      expect(elasticClient.delete, 'elasticClient.delete').calledOnce.calledWithMatch({
        id,
        index: match.string,
        type: match.string
      })

      expect(db.del, 'db.del').calledOnce.calledWith('jobs', { id })
    })

    it('does nothing if job does not exist in elastic', async () => {
      elasticClient.exists.returns(false)

      await service.deleteJob(1)

      expect(elasticClient.delete, 'elasticClient.delete').not.called
      expect(db.del, 'db.del').not.called
    })
  })
})
