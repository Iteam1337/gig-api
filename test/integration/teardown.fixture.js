const { database: { database } } = require('./config')
const client = require('./helpers/psql')('postgres')

describe('teardown', () => {
  it('drops the db', async () => {
    await client.connect()

    await client
      .query(`
        SELECT
          pg_terminate_backend (pg_stat_activity.pid)
        FROM
          pg_stat_activity
        WHERE
          pg_stat_activity.datname = '${database}';`)

    await client.query(`DROP DATABASE "${database}";`)

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
