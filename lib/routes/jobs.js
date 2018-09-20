const jobService = require('../services/jobs')

async function insertJobs (req, res, next) {
  try {
    const results = await jobService.insertJobs(req.body)
    res.send(results)
  } catch (error) {
    next(error)
  }
}

async function getJobs ({ query }, res, next) {
  try {
    const results = await jobService.getJobs(query)
    res.send(results)
  } catch (error) {
    next(error)
  }
}

async function getJob ({ params: { id = '0' } }, res, next) {
  try {
    const [job] = await jobService.getJob(id)
    res.send(job)
  } catch (error) {
    next(error)
  }
}

async function deleteJob ({ params: { id = '0' } }, res, next) {
  try {
    const result = await jobService.deleteJob(id)
    res.send(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  insertJobs,
  getJobs,
  getJob,
  deleteJob
}
