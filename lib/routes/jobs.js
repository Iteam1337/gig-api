const jobService = require('../services/jobs')

async function insertJobs (req, res, next) {
  await jobService.insertJobs(req.body)

  res.send({ message: 'ok' })
}

async function getJobs (req, res, next) {
  const { page, pageLimit } = req.query

  console.log({page, pageLimit, query: req.query})
  try {
    const results = await jobService.getJobs(parseInt(page), parseInt(pageLimit))
    res.send({ results })
  } catch (error) {
    console.error(error)
    res.send({ error })
  }
}

module.exports = {
  insertJobs,
  getJobs
}
