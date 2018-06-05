const db = require('../adapters/db')
const camelcaseKeys = require('camelcase-keys')
const snakecaseKeys = require('snakecase-keys')
const Job = require('../models/Job')
const checkEnum = require('../helpers/checkEnum')
const { ltreeStringToArray, toFloat, splitMap } = require('../helpers/format')

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
  function relevanceOrder ({ defaultValue = 'created_at', computed = [] } = {}) {
    computed = Array.isArray(computed) ? computed : []

    if (experience) { // Yrkeserfarenhet
      computed.push({
        order: `experience ~ '${experience.join('|')}'`,
        as: 'experience_rank'
      })
    }

    if (skills) { // Kompetenser
      computed.push({
        order: `skills ~ '${skills.join('|')}'`,
        as: 'skill_rank'
      })
    }

    if (education) { // Utbildning
      computed.push({
        order: `education ~ '${education.join('|')}'`,
        as: 'education_rank'
      })
    }

    if (career) { // Yrkesönskemål
      computed.push({
        order: `experience ~ '${career.join('|')}'`,
        as: 'experience_rank'
      })
    }

    if (languageSkills) { // Språkkunskaper
      computed.push({
        order: `language_skills ~ '${languageSkills.join('|')}'`,
        as: 'language_skills_rank'
      })
    }

    if (language) {
      computed.push({
        order: `language = '${language}'`,
        as: 'language_rank'
      })
    }

    if (!computed.length) {
      computed.push({
        as: defaultValue
      })
    }

    return computed
      .reduce((array, object) => {
        let { order, as: key } = object
        let [ orderString, asString ] = array

        if (!order && !key) {
          return array
        }

        if (order) {
          key = key || `${order.split(' ')[0]}_rank`
          array[0] = `${orderString}\n    , RANK() OVER (ORDER BY ${order}) AS ${key}`
        }

        if (key) {
          array[1] = asString ? `${asString} + ${key}` : `${key}`
        }

        return array
      }, [ '', '' ])
  }

  function getOrderBy () {
    if (latLongSearch) {
      if (orderBy === 'relevance') {
        return relevanceOrder({ defaultValue: 'distance_rank', computed: [ { as: 'distance_rank' } ] })
      }

      return 'distance_rank'
    }

    switch (orderBy) {
      case 'relevance':
        return relevanceOrder()
      case 'recentlyposted':
        return 'listed_date'
      case 'startdate':
        return `start_date <-> now()`
      case 'duration':
        return 'duration'
      default:
        return 'created_at'
    }
  }


  const order = getOrderBy()
  const rank = Array.isArray(order) ? order[0] : ''
  const orderByString = Array.isArray(order) ? order[1] : order

  const sql = `
  ;WITH computed AS (
    SELECT
      *${latLongSearch ? `
    , distance
    , RANK() OVER (ORDER BY distance) AS distance_rank` : ''}${rank}
    FROM
      jobs${latLongSearch ? `
    , earth_distance(ll_to_earth($3, $4), ll_to_earth(latitude, longitude)) AS distance` : ''}${orderBy === 'duration' ? `
    , date_part('day', end_date - start_date) AS duration` : ''}
    WHERE
      end_date > now())
  SELECT
    *
  FROM
    computed
  ORDER BY
    ${orderByString} ${sort}
  OFFSET $1
  LIMIT $2;
  `

  return sql
}

function formatResults (results = []) {
  results = Array.isArray(results) ? results : [results]

  return results
    .map(camelcaseKeys)
    .map(result => {
      if (!result) {
        return result
      }

      result.experience = ltreeStringToArray(result.experience)
      result.skills = ltreeStringToArray(result.skills)
      result.education = ltreeStringToArray(result.education)
      result.languageSkills = ltreeStringToArray(result.languageSkills)
      result.pay = toFloat(result.pay)
      result.latitude = toFloat(result.latitude)
      result.longitude = toFloat(result.longitude)

      return result
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

async function insertJob (job) {
  try {
    job = new Job(job)
    delete job.id
  } catch (error) {
    return job || error
  }

  const { sourceId, source } = job

  const sql = `SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2;`
  const exists = await db.manyOrNone(sql, [sourceId, source])

  if (exists.length > 0) {
    return exists[0]
  }

  return db.insert('jobs', snakecaseKeys(job))
}

async function insertJobs (jobs) {
  jobs = Array.isArray(jobs) ? jobs : [jobs]

  const insert = await Promise.all(jobs.map(insertJob))

  let successful = 0
  let failed = 0

  const results = insert.reduce((object, result, index) => {
    if (!result || !result.id) {
      ++failed
      object.failed.push(jobs[index])
    } else {
      ++successful
      object.successful.push(result.id)
    }
    return object
  }, { failed: [], successful: [] })

  return {
    results,
    total: jobs.length,
    successful,
    failed
  }
}

module.exports = {
  getJob,
  getJobs,
  insertJobs,
  insertJob
}
