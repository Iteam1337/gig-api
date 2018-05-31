const { GraphQLClient } = require('graphql-request')

const { graphql: { jobskills } } = require('../config')

const client = new GraphQLClient(jobskills)

module.exports = client