const { database: { database }, elastic: { indexPrefix } } = require('./config')
const client = require('./helpers/psql')('postgres')
const request = require('./helpers/request')
const elasticClient = require('./helpers/elasticClient')

function wait () {
  let maxRetries = 10
  return new Promise((resolve, reject) => {
    async function checkAlive () {
      if (global.API.killed) {
        try {
          await request({ path: '/' })
          await global.API.stdin.end()
          await global.API.kill('SIGHUP')
        } catch (error) {
          return resolve()
        }
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

  xit('removes all indices', async () => {
    const indices = ['migrations', 'jobs']

    await Promise.all(indices.map(async name => {
      const index = `${indexPrefix}${name}`

      const exists = await elasticClient.indices.exists({ index })

      if (exists) {
        await elasticClient.indices.delete({ index })
      }
    }))
  })

  it('kills global.API', async () => {
    await global.API.stdin.end()
    await global.API.kill('SIGHUP')

    await wait()
    return true
  })
})
