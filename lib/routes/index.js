const { insertJobs, getJobs, getJob, deleteJob } = require('./jobs')
const { getPlatforms, getPlatform } = require('./platforms')
const { searchTaxonomy } = require('./taxonomy')
const { authorize } = require('../middleware/auth')

function indexHandler ({ method }, res, next) {
  if (method !== 'GET') return res.send(303)

  res.send({
    data: {
      message: 'Gig API'
    }
  })

  return next()
}

exports.add = app => {
  app.get('/hey', (req, res, next) => {
    throw new Error('hey!')
  })
  app.del('/', indexHandler)
  app.get('/', indexHandler)
  app.patch('/', indexHandler)
  app.post('/', indexHandler)
  app.put('/', indexHandler)

  app.get('/job/:id', getJob)
  app.del('/job/:id', authorize, deleteJob)

  app.post('/jobs', authorize, insertJobs)
  app.get('/jobs', getJobs)

  // platforms
  app.get('/platform/:id', getPlatform)
  app.get('/platforms', getPlatforms)

  // taxonomy
  app.get('/taxonomy', searchTaxonomy)
}
