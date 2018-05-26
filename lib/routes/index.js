const { insertJobs, getJobs } = require('./jobs')
const { authorize } = require('../middleware/auth')

function indexHandler({ method }, res, next) {
  if (method !== 'GET') res.send(303)

  res.send({
    data: {
      message: 'Gig API'
    }
  })
  return next()
}




exports.add = (app) => {
  app.del('/', indexHandler)
  app.get('/', indexHandler)
  app.patch('/', indexHandler)
  app.post('/', indexHandler)
  app.put('/', indexHandler)

  // jobs
  app.post('/jobs', authorize, insertJobs)
  app.get('/jobs', getJobs)
}