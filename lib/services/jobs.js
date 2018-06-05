const { db, dbHelpers } = require('../adapters/db')
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
  function relevanceOrder ({ defaultValue = 'created_at', initialValue } = {}) {
    const order = []

    if (initialValue) {
      order.push(initialValue)
    }

    if (experience) { // Yrkeserfarenhet
      order.push(`experience ~ '${experience.join('|')}'`)
    }

    if (skills) { // Kompetenser
      order.push(`skills ~ '${skills.join('|')}'`)
    }

    if (education) { // Utbildning
      order.push(`education ~ '${education.join('|')}'`)
    }

    if (career) { // Yrkesönskemål
      order.push(`experience ~ '${career.join('|')}'`)
    }

    if (languageSkills) { // Språkkunskaper
      order.push(`language_skills ~ '${languageSkills.join('|')}'`)
    }

    if (language) {
      order.push(`language = '${language}'`)
    }

    if (!order.length) {
      order.push(defaultValue)
    }

    return order
      .map((string, index) =>
        `${string}${index !== (order.length - 1) ? ` ${sort}` : ''}`)
      .join('\n    , ')
  }

  function getOrderBy () {
    if (latLongSearch && ['relevance', 'distance'].includes(orderBy)) {
      return relevanceOrder({ defaultValue: 'distance', initialValue: 'distance' })
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

  const sql = `
  SELECT
    * FROM jobs${
    latLongSearch
      ? `
    , earth_distance(
      ll_to_earth($3, $4),
      ll_to_earth(jobs.latitude, jobs.longitude)
    ) AS distance`
      : orderBy === 'duration'
        ? `
    , date_part('day', end_date - start_date) AS duration`
        : ''
  }
  WHERE
    end_date > now()
  ORDER BY
    ${order} ${sort}
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
    .any(sql, sqlParams)
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
  console.log(JSON.stringify(job, null, 2))
    return job || error
  }

  const { sourceId, source } = job

  const sql = `SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2;`
  const exists = await db.any(sql, [sourceId, source])

  if (exists.length > 0) {
    return exists[0]
  }
  const insertSql = dbHelpers.insert(snakecaseKeys(job), null, 'jobs')

  console.log(insertSql)

  return db.any(insertSql)
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
