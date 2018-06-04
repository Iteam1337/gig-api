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
    debug: false,
    sites: {
      gigstr: {
        id: '85d5cfcb-37bd-4a54-9410-2aa1cc52ea6d',
        secret: 'b59dc3e3-ddd1-4a8f-bae9-a01cd48ef386',
        name: 'gigstr'
      },
      justarrived: {
        id: '7d43eecd-515a-4b79-b446-862756848137',
        secret: '23cb4e12-444a-463b-b218-c1fd1ff5d260',
        name: 'justarrived'
      },
      taskrunner: {
        id: '62b1cf9b-65dc-4f0a-bb82-e8edbc9b3ba6',
        secret: 'b320b8dd-e0be-42cb-a158-48a54d7d30bd',
        name: 'taskrunner'
      }
    }
  })

module.exports = {
  database: config.get('database'),
  debug: config.get('debug'),
  sites: config.get('sites')
}
