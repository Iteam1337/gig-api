const db = require('../adapters/db')
const camelcaseKeys = require('camelcase-keys')
const snakecaseKeys = require('snakecase-keys')

function validateInput (query = {}) {
  function checkEnum (string = '', list = [], defaultValue = '') {
    if (typeof string !== 'string') {
      return defaultValue
    }

    string = string.toLowerCase()

    if (list.includes(string)) {
      return string
    }

    return defaultValue
  }


  function getOrder (string = '') {
    return checkEnum(string, ['relevance', 'recentlyposted', 'distance', 'startdate', 'duration'], 'relevance')
  }

  function getSort (string = '') {
    return checkEnum(string, ['asc', 'desc'], 'asc').toUpperCase()
  }

  function splitMap (string, defaultValue = null) {
    if (typeof string !== 'string') {
      return defaultValue
    }
    return string.split(',')
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

    if (!order) {
      order = [defaultValue]
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
    start_date >= now() AND end_date > now()
  ORDER BY
    ${order} ${sort}
  OFFSET $1
  LIMIT $2;
  `

  return sql
}

function formatResults (results = []) {
  return (results || [])
    .map(camelcaseKeys)
    .map(result => {
      if (!result) {
        return result
      }

      if (result.experience) {
        result.experience = result.experience.replace(/\{|\}/g, '').split(',')
      }

      if (result.skills) {
        result.skills = result.skills.replace(/\{|\}/g, '').split(',')
      }

      if (result.education) {
        result.education = result.education.replace(/\{|\}/g, '').split(',')
      }

      if (result.languageSkills) {
        result.languageSkills = result.languageSkills.replace(/\{|\}/g, '').split(',')
      }

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

  console.log(sql
    .replace(/\$1/g, `'${offset}'`)
    .replace(/\$2/g, `'${pageLimit}'`)
    .replace(/\$3/g, `'${latitude}'`)
    .replace(/\$4/g, `'${longitude}'`)
  )

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
    .manyOrNone('SELECT * FROM JOBS where id = $1;', [id])
    .then(formatResults)
}

async function insertJob ({
  type,
  company,
  title,
  preamble,
  text,
  createdAt,
  language,
  link,
  contact,
  pay,
  paymentType,
  currency,
  experience,
  skills,
  education,
  languageSkills,
  startDate,
  endDate,
  listedDate,
  source,
  sourceId,
  entryBy,
  longitude,
  latitude,
  address
}) {
  const sql = 'SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2;'
  const exists = await db.manyOrNone(sql, [sourceId, source])

  if (exists.length > 0) {
    return
  }

  return db.insert('jobs', snakecaseKeys({
    type,
    company,
    title,
    preamble,
    text,
    createdAt,
    language,
    link,
    contact,
    pay,
    paymentType,
    currency,
    experience,
    skills,
    education,
    languageSkills,
    startDate,
    endDate,
    listedDate,
    source,
    sourceId,
    entryBy,
    longitude,
    latitude,
    address
  }))
}

async function insertJobs (jobs) {
  await Promise.all(jobs.map(insertJob))

  return { message: 'ok' }
}

module.exports = {
  getJob,
  getJobs,
  insertJobs,
  insertJob
}
