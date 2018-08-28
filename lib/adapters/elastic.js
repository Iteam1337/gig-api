const { Client } = require('elasticsearch')
const { elastic: { host } } = require('../config')

module.exports = new Client({
  host
})
