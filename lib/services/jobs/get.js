const camelcaseKeys = require('camelcase-keys')

const db = require('../../adapters/db')
const elasticClient = require('../../adapters/elastic')
const checkEnum = require('../../helpers/checkEnum')
const { ltreeStringToArray, toFloat, splitMap } = require('../../helpers/format')

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
    skills: splitMap(query.skills)
  }

  params.latLongSearch = !!(params.latitude && params.longitude)
  params.offset = Math.max((params.page - 1) * params.pageLimit, 0)

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
    .map(result => {
      const data = {
        id: result.id,
        type: result.type,
        company: result.company,
        title: result.title,
        preamble: result.preamble,
        text: result.text,
        createdAt: result.createdAt,
        link: result.link,
        contact: result.contact,
        startDate: result.startDate,
        endDate: result.endDate,
        listedDate: result.listedDate,
        source: result.source,
        entryBy: result.entryBy,
        sourceId: result.sourceId,
        address: result.address,
        paymentType: result.paymentType,
        currency: result.currency,
        language: result.language,
        latitude: toFloat(result.latitude),
        longitude: toFloat(result.longitude),
        pay: toFloat(result.pay),
        experience: ltreeStringToArray(result.experience),
        skills: ltreeStringToArray(result.skills),
        education: ltreeStringToArray(result.education),
        languageSkills: ltreeStringToArray(result.languageSkills),
        distance: result.distance
      }

      return data
    })
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
        .map((query, index) => {
          const i = index + 1
          const score = (maxScoreSplit / part) * i

          return {
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
                  filter: {
                    query_string: {
                      default_field: fieldName,
                      analyze_wildcard: false,
                      query
                    }
                  }
                }
              }
            }
          }
        })
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

  const distances = [
    0.01,
    2,
    5,
    15,
    20,
    30
  ]

  const parts = distances.reduce((n, _v, i) => n + (i + 1), 0)
  const query = distances.reverse().map((distance, index) => {
    const score = (maxScore / parts) * (index + 1)
    return {
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
            filter: {
              geo_distance: {
                distance: `${distance}km`,
                position: {
                  lat: latitude,
                  lon: longitude
                }
              }
            }
          }
        }
      }
    }
  })

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
    offset
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

  const should = []
    .concat(...[
      ...Object.values(wildcards),
      positionQuery
    ].filter(e => e))

  const must = []
    .concat(...[
      [{ range: { end_date: { gt: 'now/d' } } }] // force documents to not be expired
    ].filter(e => e))

  let sortOrder = orderBy === 'relevance'
    ? [ { _score: sort === 'asc' ? 'desc' : 'asc' } ] // it's the other way around!
    : [
        positionSort,
        ...Object
          .keys(wildcards)
          .map(key => wildcards[key] ? { [key]: sort } : null)
          .filter(e => e)
      ]

  sortOrder = []
    .concat(...sortOrder.filter(e => e))

  const elasticQuery = {
    from: offset,
    size: pageLimit,
    explain: true,
    query: {
      bool: {
        minimum_should_match: [],
        must_not: [],
        must: must.length ? must : undefined,
        should: should.length ? should : undefined
      }
    },
    sort: sortOrder.length ? sortOrder : undefined
  }

  const {
    hits: { total, hits = [] } = { total: 0, hits: [] }
  } = await elasticClient.search({
    index: `${elasticClient.indexPrefix}jobs`,
    type: 'job',
    body: elasticQuery
  })

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
  return db
    .oneOrNone(`SELECT * FROM jobs WHERE id = $1;`, [id])
    .then(formatResults)
}

module.exports = {
  getJob,
  getJobs
}
