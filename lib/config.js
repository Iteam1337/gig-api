const nconf = require('nconf')
  .env({
    separator: '__',
    lowerCase: true
  })
  .file({
    file: 'config.json',
    dir: '../',
    search: true
  })

nconf.defaults({
  port: 4004,
  environment: 'develop',
  database: {
    user: 'user',
    password: 'password',
    database: 'gig',
    host: 'localhost',
    port: 5432,
    timeout: 30000
  },
  graphql: {
    jobskills: 'https://api.jobskills.se/graphql'
  }
})

module.exports = {
  port: nconf.get('port'),
  database: nconf.get('database'),
  graphql: nconf.get('graphql')
}
