const camelcaseKeys = require('camelcase-keys')

const db = require('../../adapters/db')
const elasticClient = require('../../adapters/elastic')
const checkEnum = require('../../helpers/checkEnum')
const { ltreeStringToArray, toFloat, splitMap } = require('../../helpers/format')

function validateInput (query = {}) {
  function getOrder (string = '') {
    return checkEnum(string, ['relevance', 'recentlyposted', 'distance', 'startdate', 'duration'])
  }

  function getSort (string = '') {
    return checkEnum(string, ['asc', 'desc'], 'asc').toUpperCase()
  }

  const params = {
    page: parseInt(query.page) || 1,
    pageLimit: parseInt(query.pageLimit) || 10,
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
          longitude: hit._source.position.lon
        }
      )

      delete result.position

      return result
    })
    .map(camelcaseKeys)
    .map(result => {
      const score = {
        experience: result.experienceScore,
        skill: result.skillScore,
        education: result.educationScore,
        career: result.careerScore,
        languageSkills: result.languageSkillsScore,
        language: result.languageScore,
        distance: result.distanceScore
      }

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

      if ((Object.keys(score).some(key => score[key] !== undefined))) {
        data.score = score
      }

      return data
    })
}

async function getJobs (query) {
  const { total, results, totalPages, currentPage } = await getJobsELASTICO(query)

  return {
    total,
    results,
    totalPages,
    currentPage
  }
}

async function getJob (id) {
  return db
    .oneOrNone(`SELECT * FROM jobs WHERE id = $1;`, [id])
    .then(formatResults)
}

function wildcard (fields = null, fieldName = '') {
  if (!Array.isArray(fields) || !fields.length) {
    return null
  }

  return [].concat(...fields
    .map(field => {
      const split = field.split('.')
      const max = split.length
      return split
        .map((_n, i) =>
          `${split.slice(0, i + 1).join('.')}${'.*'.repeat(max - (i + 1))}`)
        .map((query, i) => ({
          function_score: {
            random_score: {
              seed: 10 * (i + 1),
              field: '_seq_no'
            },
            query: {
              bool: {
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
        }))
    }))
}

function positionQueryAndSort ({ latitude, longitude, latLongSearch }) {
  if (!latLongSearch) {
    return [null, null]
  }

  const sort = {
    _geo_distance: {
      position: {
        lat: latitude,
        lon: longitude
      },
      order: 'asc'
    }
  }

  const query = [{
    function_score: {
      random_score: {
        seed: 10,
        field: '_seq_no'
      },
      query: {
        bool: {
          must: {
            match_all: {}
          },
          filter: {
            geo_distance: {
              distance: '50km',
              position: {
                lat: latitude,
                lon: longitude
              }
            }
          }
        }
      }
    }
  }]

  return [query, sort]
}

async function getJobsELASTICO (query) {
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
    language,
    languageSkills,
    skills,
    latLongSearch,
    offset
  } = validateInput(query)

  const [
    positionQuery,
    positionSort
  ] = positionQueryAndSort({ latLongSearch, latitude, longitude })

  const wildcards = {
    experience: wildcard(experience, 'experience'),
    skills: wildcard(skills, 'skills'),
    education: wildcard(education, 'education'),
    languageSkills: wildcard(languageSkills, 'languageSkills')
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

  const wildCardSort = Object.keys(wildcards)
    .map(key => wildcards[key] ? { [key]: 'asc' } : null)
    .filter(e => e)

  let sortOrder = orderBy === 'relevance'
    ? [ '_score' ]
    : [ positionSort, ...wildCardSort]

  sortOrder = []
    .concat(...sortOrder.filter(e => e))

  const elasticQuery = {
    from: page - 1,
    size: pageLimit,
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

  const res = await elasticClient.search({
    index: `${elasticClient.indexPrefix}jobs`,
    type: 'job',
    body: elasticQuery,
    explain: true
  })

  const { hits: { total, hits = [] } = { total: 0, hits: [] } } = res

  const totalByLimit = total / pageLimit
  const totalPages = Math.ceil(totalByLimit > 1 ? totalByLimit : 1)

  function detailToString (detail) {
    return `{
      "value": "${detail.value}",
      "description": "${detail.description}",
      "details": [${detail.details.map(d => detailToString(d))}]
    }`
  }

  if (latLongSearch && wildCardSort.length > 0) {
    console.log({ latitude, longitude, wildCardSort })
    console.log(hits.map(hit => {
      return {
        id: hit._id,
        score: hit._score,
        sourceId: hit._source.source_id,
        experience: (hit._source.experience || []).join(','),
        latitude: hit._source.position.lat,
        longitude: hit._source.position.lon,
        explanation: `${detailToString(hit._explanation)}`.replace(/\n\s{0,}/g, '')
      }
    }))
  }

  return {
    total,
    results: formatResults(hits),
    totalPages,
    currentPage: page
  }
}

module.exports = {
  getJob,
  getJobs,
  getJobsELASTICO
}
