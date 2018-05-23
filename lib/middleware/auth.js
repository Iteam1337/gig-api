const { validateClient } = require('../services/auth')

async function authorize (req, res, next) {
  try {
    const { 'x-client-id': clientId, 'x-client-secret': clientSecret } = req.headers

    await validateClient(clientId, clientSecret)

    return next()
  } catch ({ message }) {
    res.send(403, { message })
  }
}

module.exports = {
  authorize
}