const rp = require('request-promise')
const { port } = require(`${process.cwd()}/lib/config`)

module.exports = {
  request: async ({ path = '/', headers = {} } = {}) =>
    await rp({
      uri: `http://localhost:${port}${path}`,
      headers,
      json: true
    })
}
