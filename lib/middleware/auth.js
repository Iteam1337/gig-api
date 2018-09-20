const { validateClientAndReturnInfo } = require('../services/auth')

async function authorize (req, res, next) {
  try {
    let { 'x-client-id': clientId, 'x-client-secret': clientSecret } = req.headers

    if (!clientId && !clientSecret) {
      clientId = req.headers['client-id']
      clientSecret = req.headers['client-secret']
    }

    const client = await validateClientAndReturnInfo(clientId, clientSecret)

    console.log({ client })

    return next()
  } catch ({ message }) {
    res.send(403, { message })
  }
}

module.exports = {
  authorize
}
