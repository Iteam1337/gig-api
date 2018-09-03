const camelcaseKeys = require('camelcase-keys')

const db = require('../../adapters/db')
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

function getJobsSql ({ sort, latLongSearch, orderBy, experience, career, education, language, languageSkills, skills }) {
  function getScore ({ defaultOrder = 'created_at', defaultScore = '', computed = [] } = {}) {
    computed = Array.isArray(computed) ? computed : []

    if (experience) { // Yrkeserfarenhet
      computed.push({ score: `experience ? '{${experience.join(',')}}'`, orderBy: 'experience_score' })
    }

    if (skills) { // Kompetenser
      computed.push({ score: `skills ? '{${skills.join(',')}}'`, orderBy: 'skill_score' })
    }

    if (education) { // Utbildning
      computed.push({ score: `education ? '{${education.join(',')}}'`, orderBy: 'education_score' })
    }

    if (career) { // Yrkesönskemål
      computed.push({ score: `experience ? '{${career.join(',')}}'`, orderBy: 'career_score' })
    }

    if (languageSkills) { // Språkkunskaper
      computed.push({ score: `language_skills ? '{${languageSkills.join(',')}}'`, orderBy: 'language_skills_score' })
    }

    if (language) {
      computed.push({ score: `language = '${language}'`, orderBy: 'language_score' })
    }

    if (!computed.length) {
      return [defaultOrder, defaultScore]
    }

    return computed.reduce((array, { score, orderBy }) => {
      const [ orderByString, scoreString ] = array

      if (!score && !orderBy) {
        return array
      }

      if (score) {
        orderBy = orderBy || `${score.split(' ')[0]}_score`
        array[1] = `${scoreString}\n  , CASE WHEN (${score}) THEN 0 ELSE 1 END AS ${orderBy.replace(/[^a-z_]/gi, '')}`
      }

      if (orderBy) {
        array[0] = orderByString.trim() ? `${orderByString} + ${orderBy}` : `${orderBy}`
      }

      return array
    }, [ '', '' ])
  }

  function getOrderByAndScore () {
    if (latLongSearch) {
      if (orderBy !== 'relevance') {
        return ['distance_score', '']
      }

      return getScore({ defaultValue: 'distance_score', computed: [ { orderBy: 'distance_score' } ] })
    }

    switch (orderBy) {
    case 'relevance':
      return getScore()
    case 'recentlyposted':
      return ['listed_date', '']
    case 'startdate':
      return ['start_date <-> now()', '']
    case 'duration':
      return ['duration', '']
    default:
      return ['created_at', '']
    }
  }

  const [ orderByString, score ] = getOrderByAndScore()

  const latLongSelect = latLongSearch ? `\n  , distance\n  , RANK() OVER (ORDER BY distance) AS distance_score` : ''
  const latLongFrom = latLongSearch ? `\n  , earth_distance(ll_to_earth($3, $4), ll_to_earth(latitude, longitude)) AS distance` : ''
  const durationFrom = orderBy === 'duration' ? `\n  , date_part('day', end_date - start_date) AS duration` : ''

  return `
;WITH computed AS (
  SELECT
    *${latLongSelect}${score}
  FROM
    jobs${latLongFrom}${durationFrom}
  WHERE
    end_date > now())
SELECT
  *
FROM
  computed
ORDER BY
  ${orderByString} ${sort}
OFFSET $1
LIMIT $2;`
}

function formatResults (results = []) {
  return (Array.isArray(results) ? results : [results])
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

  const sql = getJobsSql({ sort, latLongSearch, orderBy, experience, career, education, language, languageSkills, skills })

  const sqlParams = [offset, pageLimit, latitude, longitude]

  // console.log(sqlParams.reduce((string, key, index) =>
  //   string.replace(new RegExp(`\\$${index + 1}`, 'g'), `'${key}'`), sql))

  const results = await db
    .manyOrNone(sql, sqlParams)
    .then(formatResults)

  let { total } = await db.one('SELECT COUNT(1) AS total FROM jobs WHERE end_date > now();')

  total = parseInt(total) || 0

  const totalByLimit = total / pageLimit
  const totalPages = Math.ceil(totalByLimit > 1 ? totalByLimit : 1)

  return {
    results,
    total,
    totalPages,
    currentPage: page
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
        .map(query => ({
          bool: {
            filter: {
              query_string: {
                default_field: fieldName,
                analyze_wildcard: false,
                query
              }
            }
          }
        }))
    }))
}

function position ({ latitude, longitude, latLongSearch }) {
  return latLongSearch ? [{
    bool: {
      filter: {
        geo_distance: {
          distance: '20km',
          position: {
            lat: latitude,
            lon: longitude
          }
        }
      }
    }
  }] : null
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

  const should = []
    .concat(...[
      wildcard(experience, 'experience'),
      wildcard(skills, 'skills'),
      wildcard(education, 'education'),
      wildcard(languageSkills, 'languageSkills')
    ].filter(e => e))

  const must = []
    .concat(...[
      position({ latLongSearch, latitude, longitude }),
      [{ range: { end_date: { gt: 'now/d' } } }]
    ].filter(e => e))

  const elasticQuery = {
    from: page - 1,
    size: pageLimit,
    query: {
      bool: {
        // minimum_should_match: []
        // must_not: []
        must: must.length ? must : undefined,
        should: should.length ? should : undefined
      }
    }
  }

  return {
    elasticQuery,
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
  }
}

module.exports = {
  getJob,
  getJobs,
  getJobsELASTICO
}
