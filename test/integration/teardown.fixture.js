const { Client } = require('pg')

const {
  database: {
    user,
    password,
    host,
    port,
    database
  }
} = require('./config')

const client = new Client(`postgres://${user}:${password}@${host}:${port}/postgres`)

describe('teardown', () => {
  it('drops the db', async () => {
    await client.connect()
    await client
      .query(`DROP DATABASE "${database}";`)
      .catch(error => Promise.reject(error))
    return client.end()
  })

  it('kills global.API', async () => {
    function wait () {
      let maxRetries = 10
      return new Promise((resolve, reject) => {
        function checkAlive () {
          if (global.API.killed) {
            return resolve()
          }

          if (maxRetries <= 0) {
            return reject()
          }

          setTimeout(() => {
            checkAlive(maxRetries - 1)
          }, 1000)
        }

        checkAlive()
      })
    }

    global.API.stdin.end()
    global.API.kill('SIGHUP')

    await wait()

    return true
  })
})
