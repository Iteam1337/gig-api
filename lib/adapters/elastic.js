const { Client } = require('elasticsearch')

const { elastic: { host, indexPrefix } } = require('../config')

module.exports = Object.assign(new Client({ host }), { indexPrefix })
