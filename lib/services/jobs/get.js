const camelcaseKeys = require('camelcase-keys')

const elasticClient = require('../../adapters/elastic')
const checkEnum = require('../../helpers/checkEnum')
const { splitMap } = require('../../helpers/format')
const Job = require('../../models/Job')

const { functionScore, raw } = require('../../helpers/elasticQuery')

const SCORES = {
  wildcards: 0.6,
  position: 1.4
}

function validateInput (query = {}) {
  function getOrder (string = '') {
    return checkEnum(string, ['relevance', 'recentlyposted', 'distance', 'startdate', 'duration'])
  }

  function getSort (string = '') {
    return checkEnum(string, ['asc', 'desc'], 'asc').toLowerCase()
  }

  function stringToBool (any) {
    if (typeof any !== 'string' && typeof any !== 'boolean') {
      return null
    }

    const firstChar = `${any}`.toLowerCase()[0]
    return ['1', 't'].includes(firstChar)
  }

  const debug = query.hasOwnProperty('debug')

  const params = {
    page: parseInt(query.page, 10) || 1,
    pageLimit: parseInt(query.pageLimit, 10) || 10,
    longitude: parseFloat(query.longitude) || 0.0,
    latitude: parseFloat(query.latitude) || 0.0,
    orderBy: getOrder(query.orderBy),
    sort: getSort(query.sort),
    experience: splitMap(query.experience),
    career: splitMap(query.career),
    education: splitMap(query.education),
    language: typeof query.language === 'string' ? query.language : null,
    languageSkills: splitMap(query.languageSkills),
    skills: splitMap(query.skills),
    requireSsn: stringToBool(query.requireSsn),
    debug
  }

  params.latLongSearch = !!(params.latitude && params.longitude)
  params.offset = Math.max((params.page - 1) * params.pageLimit, 0)

  if (debug) {
    console.log(JSON.stringify({ query, params }, null, 2))
  }

  return params
}

function formatResults (results = []) {
  return (Array.isArray(results) ? results : [results])
    .map(hit => {
      if (!hit || hit.hasOwnProperty('_source') === false) {
        return hit // is not a elastic document
      }

      const result = Object.assign(
        {},
        hit._source,
        {
          id: hit._id,
          latitude: hit._source.position.lat,
          longitude: hit._source.position.lon,
          score: hit._score
        }
      )

      delete result.position

      return result
    })
    .map(camelcaseKeys)
    .map(result => new Job(result))
}

function wildcard (fields = null, fieldName = '') {
  if (!Array.isArray(fields) || !fields.length) {
    return null
  }

  const maxScore = SCORES.wildcards
  const maxScoreSplit = maxScore / fields.length

  const parts = fields
    .map(field =>
      field
        .split('.')
        .reduce((n, _v, i) => n + (i + 1), 0)
    )

  return fields
    .map((field, i) => {
      const split = field.split('.')
      const max = split.length
      const part = parts[i]
      return split
        .map((_n, i) =>
          `${split.slice(0, i + 1).join('.')}${'.*'.repeat(max - (i + 1))}`)
        .map((query, index) =>
          functionScore({
            boost: {
              boost: (maxScoreSplit / part) * (index + 1)
            },
            filter: {
              query_string: {
                default_field: fieldName,
                analyze_wildcard: false,
                query
              }
            }
          }))
    })
}

function positionQueryAndSort ({ latitude, longitude, latLongSearch, sort: order }) {
  const maxScore = SCORES.position

  if (!latLongSearch) {
    return [null, null]
  }

  const sort = {
    _geo_distance: {
      position: {
        lat: latitude,
        lon: longitude
      },
      order
    }
  }

  // distances in KM
  const distances = [
    0.01,
    2,
    5,
    15,
    20,
    30
  ]

  const parts = distances
    .reduce((n, _v, i) => n + (i + 1), 0)
  const query = distances
    .reverse()
    .map((distance, index) =>
      functionScore({
        boost: {
          boost: (maxScore / parts) * (index + 1)
        },
        filter: {
          geo_distance: {
            distance: `${distance}km`,
            position: {
              lat: latitude,
              lon: longitude
            }
          }
        }
      }))

  return [query, sort]
}

async function getJobs (query) {
  const {
    page,
    pageLimit,
    longitude,
    latitude,
    orderBy,
    sort,
    experience,
    career,
    education,
    languageSkills,
    skills,
    latLongSearch,
    offset,
    requireSsn,
    debug
  } = validateInput(query)

  const [
    positionQuery,
    positionSort
  ] = positionQueryAndSort({ latLongSearch, latitude, longitude, sort })

  const wildcards = {
    experience: wildcard(experience, 'experience'),
    skills: wildcard(skills, 'skills'),
    education: wildcard(education, 'education'),
    languageSkills: wildcard(languageSkills, 'languageSkills'),
    career: wildcard(career, 'career')
  }

  const requireSsnQuery = typeof requireSsn === 'boolean'
    ? [{ term: { require_ssn: requireSsn } }]
    : null

  const should = []
    .concat(...[
      ...Object.values(wildcards),
      positionQuery
    ].filter(e => e))

  const must = []
    .concat(...[
      [{ range: { end_date: { gte: 'now' } } }], // force documents to not be expired,
      requireSsnQuery
    ].filter(e => e))

  let sortOrder = orderBy === 'relevance'
    ? [ { _score: sort === 'asc' ? 'desc' : 'asc' } ] // it's the other way around!
    : [
        positionSort,
        ...Object
          .keys(wildcards)
          .map(key => wildcards[key] ? { [key]: sort, ignore_unmapped: true } : null)
          .filter(e => e)
      ]

  sortOrder = []
    .concat(...sortOrder.filter(e => e))

  const elasticQuery = raw({
    from: offset,
    size: pageLimit,
    explain: debug,
    body: {
      query: {
        bool: {
          minimum_should_match: [],
          must_not: [],
          must: must.length ? must : undefined,
          should: should.length ? should : undefined
        }
      },
      sort: sortOrder.length ? sortOrder : undefined
    },
  })

  let total = 0
  let hits = []

  if (debug) {
    console.log(JSON.stringify(elasticQuery, null, 2))
  }

  try {
    const result = await elasticClient.search(elasticQuery)

    if (debug) {
      console.log(JSON.stringify(result, null, 2))
    }

    hits = result.hits.hits
    total = result.hits.total
  } catch (error) {
    console.log(error && error.toJSON ? error.toJSON() : error)
  }

  const totalByLimit = total / pageLimit
  const totalPages = Math.ceil(totalByLimit > 1 ? totalByLimit : 1)

  return {
    total,
    results: formatResults(hits),
    totalPages,
    currentPage: page
  }
}

async function getJob (id) {
  const result = await elasticClient.get(raw({ id }))
  return formatResults([result])
}

module.exports = {
  getJob,
  getJobs
}
