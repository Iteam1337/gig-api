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
    return checkEnum(string, ['asc', 'desc'], 'asc')
  }

  const params = {
    page: parseInt(query.page) || 0,
    pageLimit: parseInt(query.pageLimit) || 10,
    longitude: parseFloat(query.longitude) || 0.0,
    latitude: parseFloat(query.latitude) || 0.0,
    orderBy: getOrder(query.orderBy),
    sort: getSort(query.sort),
    experience: typeof query.experience === 'string' ? query.experience.split(',') : null,
    career: typeof query.career === 'string' ? query.career.split(',') : null,
    education: typeof query.education === 'string' ? query.education.split(',') : null,
    language: typeof query.language === 'string' ? query.language : null,
    languageSkills: typeof query.languageSkills === 'string' ? query.languageSkills.split(',') : null,
    skills: typeof query.skills === 'string' ? query.skills.split(',') : null,
    ref: typeof query.ref === 'string' ? query.ref : null
  }

  params.latLongSearch = !!(params.latitude && params.longitude)
  params.offset = (params.page - 1) * params.pageLimit

  return params
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
    ref,
    latLongSearch,
    offset
  } = validateInput(query)

  const sql = latLongSearch ? `
  SELECT
    *,
    earth_distance(
      ll_to_earth($3, $4),
      ll_to_earth(jobs.latitude, jobs.longitude)
    ) AS distance
  FROM jobs
  WHERE
    end_date > now()
  ORDER BY
    distance ${sort},
    jobs.created_at ${sort}
  OFFSET $1
  LIMIT $2
  ` : `
  SELECT
    * FROM jobs
  WHERE
    end_date > now()
  ORDER BY
    created_at ${sort}
  OFFSET $1
  LIMIT $2
  `

  const sqlParams = [offset, pageLimit]

  if (latLongSearch) {
    sqlParams.push(latitude, longitude)
  }

  const results = await db
    .manyOrNone(sql, sqlParams)
    .then(camelcaseKeys)

  const { total } = await db.one('SELECT COUNT(1) AS total FROM jobs WHERE end_date > now();')

  const totalByLimit = total / pageLimit
  const totalPages = totalByLimit > 1 ? totalByLimit : 1

  return {
    results,
    total: parseInt(total),
    totalPages,
    currentPage: page
  }
}

async function getJob (id) {
  return db.manyOrNone('SELECT * FROM JOBS where id = $1', [id])
}

async function insertJob (job) {
  const {
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
    payment_type,
    currency,
    category,
    startDate,
    endDate,
    listedDate,
    source,
    sourceId,
    entryBy,
    longitude,
    latitude,
    address
  } = job

  const sql = 'SELECT 1 FROM jobs WHERE source_id = $1 AND source = $2'
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
    payment_type,
    currency,
    category,
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
