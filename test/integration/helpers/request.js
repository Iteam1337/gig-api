const rp = require('request-promise')
const { port } = require('../config')

module.exports = async ({ path = '/', headers = {}, options = {} } = {}) => {
  const data = Object.assign(options, {
    uri: `http://localhost:${port}${path}`,
    headers,
    json: true
  })

  return rp(data)
}
