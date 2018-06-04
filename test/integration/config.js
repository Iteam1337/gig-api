const nconf = require('nconf')

const config = nconf
  .env({
    separator: '__',
    lowerCase: true
  })
  .file({
    file: 'config-integration.json',
    dir: `${process.cwd()}`,
    search: true
  })
  .defaults({
    database: {
      user: 'user',
      password: 'password',
      database: 'gig-integration',
      host: 'localhost',
      port: 5432
    },
    debug: false
  })

module.exports = {
  database: config.get('database')
}
