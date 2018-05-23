const jobService = require('../services/jobs')

function addJobs (req, res, next) {
  console.log(req.body)
  res.send({ clientId: 'tja' })
}

module.exports = {
  addJobs
}