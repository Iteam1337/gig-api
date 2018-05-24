const jobService = require('../services/jobs')

async function insertJobs (req, res, next) {
  await jobService.insertJobs(req.body)

  res.send({ message: 'ok' })
}

async function getJobs (req, res, next) {
  const data = await jobService.getJobs()
  res.send({ results: data })

}

module.exports = {
  insertJobs,
  getJobs
}