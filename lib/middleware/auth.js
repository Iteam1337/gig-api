const { validateClientAndReturn } = require('../services/auth')

async function authorize (req, res, next) {
  try {
    const { headers } = req

    const clientId = headers['x-client-id'] || headers['client-id']
    const clientSecret = headers['x-client-secret'] || headers['client-secret']

    const client = await validateClientAndReturn(clientId, clientSecret)

    req.auth = {
      client
    }

    return next()
  } catch ({ message }) {
    res.send(403, { message })
  }
}

module.exports = {
  authorize
}
