const { insertJobs, getJobs, getJob } = require('./jobs')
const { getPlatforms, getPlatform } = require('./platforms')
const { searchTaxonomy } = require('./taxonomy')
const { authorize } = require('../middleware/auth')

function indexHandler ({ method }, res, next) {
  if (method !== 'GET') res.send(303)

  res.send({
    data: {
      message: 'Gig API'
    }
  })

  return next()
}

exports.add = app => {
   app.del('/', indexHandler)
   app.get('/', indexHandler)
   app.patch('/', indexHandler)
   app.post('/', indexHandler)
   app.put('/', indexHandler)

  // jobs
  app.post('/jobs', authorize, insertJobs)
  // no-nauth
  app.get('/jobs', getJobs)
  app.get('/jobs/:id', getJob)

  // job
  app.get('/job/:id', getJob)

  // platforms
  app.get('/platforms', getPlatforms)
  app.get('/platforms/:id', getPlatform)

  // taxonomy
  app.get('/taxonomy', searchTaxonomy)
}
