const restify = require('restify')
const { MethodNotAllowedError } = require('restify-errors')
const cors = require('cors')

const routes = require('./routes')
const { port } = require('./config')

const internalError = require('./middleware/internalError')

const app = restify.createServer({})

app.pre(cors((_req, callback) => callback(null, { origin: true })))

app.pre(restify.pre.sanitizePath())
app.use(restify.plugins.bodyParser())
app.use(restify.plugins.queryParser())

routes.add(app)

app.on('MethodNotAllowed', (req, res) => {
  if (req.method.toUpperCase() !== 'OPTIONS') {
    return res.send(new MethodNotAllowedError())
  }

  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.send(204)
})

app.on('restifyError', (_req, res, error, next) => {
  const { status = 0, message, stack } = error

  console.error({
    status,
    message,
    stack
  })

  const internal = status === 0 || status >= 500 ? internalError(status) : null

  if (internal) {
    return res.send(internal)
  }

  res.send(status)
})

app.listen(port, () => {
  console.log('listening on port', port)
})
