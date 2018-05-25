const jobService = require('../services/jobs')

async function insertJobs (req, res, next) {
  await jobService.insertJobs(req.body)

  res.send({ message: 'ok' })
}

async function getJobs (req, res, next) {
  const { page, pageLimit } = req.query
  const results = await jobService.getJobs(parseInt(page), parseInt(pageLimit))
  res.send({ results })

}

module.exports = {
  insertJobs,
  getJobs
}