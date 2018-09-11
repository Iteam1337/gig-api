const { expect } = require('chai')
const proxyquire = require('proxyquire')

describe('adapters/elasticQuery', () => {
  let elasticQuery, elasticAdapter
  beforeEach(() => {
    elasticAdapter = {
      indexPrefix: 'foo'
    }

    elasticQuery = proxyquire(`${process.cwd()}/lib/adapters/elasticQuery`, {
      './elastic': elasticAdapter
    })
  })

  describe('initialization', () => {
    it('starts', () => {
      expect(elasticQuery).include.keys('functionScore')
    })
  })

  describe('#functionScore', () => {
    it('returns the "overly complex" object', () => {
      const score = 1
      const filter = {
        distance: '10km',
        position: {
          lat: 0.0,
          lon: 10.0
        }
      }

      const query = elasticQuery.functionScore({ boost: { min: score }, filter })

      expect(query).to.eql({
        function_score: {
          boost_mode: 'sum',
          max_boost: score,
          boost: score,
          min_score: score,
          query: {
            bool: {
              must: {
                match_all: {}
              },
              filter
            }
          }
        }
      })
    })
  })
})
