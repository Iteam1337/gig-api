const jobService = require('../services/jobs')

async function insertJobs (req, res, next) {
  try {
    await jobService.insertJobs(req.body)
    res.send({ message: 'ok' })
  } catch (error) {
    next(error)
  }
}

async function getJobs ({ query: { page = 1, pageLimit = 10 } }, res, next) {
  try {
    const results = await jobService.getJobs(parseInt(page), parseInt(pageLimit))
    res.send({ results })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  insertJobs,
  getJobs
}
