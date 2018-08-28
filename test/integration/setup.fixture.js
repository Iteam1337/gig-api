const { spawn } = require('child_process')
const { existsSync } = require('fs')
const chalk = require('chalk')

const log = chalk.keyword('grey')
const err = chalk.keyword('white')

const client = require('./helpers/psql')('postgres')

const {
  database: {
    user,
    password,
    host,
    port,
    database
  },
  debug,
  elastic: {
    host: elasticHost,
    indexPrefix
  }
} = require('./config')

const dbURL = `postgres://${user}:${password}@${host}:${port}`

function migrate ({ args = ['up'], ignoreIfNotExist = false }) {
  return new Promise((resolve, reject) => {
    if (ignoreIfNotExist && existsSync(`${process.cwd()}/${ignoreIfNotExist}`) === false) {
      return resolve()
    }

    const migrate = spawn('node_modules/.bin/node-pg-migrate', args, {
      cwd: process.cwd(),
      env: Object.assign({}, process.env, {
        DATABASE_URL: `${dbURL}/${database}`,
        DATABASE_USER: user,
        DATABASE_PASSWORD: password
      })
    })

    if (debug) {
      migrate.stdout.on('data', data => console.log(`${data}`))
      migrate.stderr.on('data', data => console.error(`${data}`))
    }

    migrate.on('close', exitCode =>
      exitCode !== 0 ? reject(exitCode) : resolve(exitCode))
  })
}

describe('setup', () => {
  it('creates the db', async () => {
    async function drop () {
      return client.query(`DROP DATABASE "${database}";`)
    }

    async function create () {
      return client.query(`CREATE DATABASE "${database}" WITH OWNER "${user}" ENCODING 'UTF8';`)
    }

    await client.connect()

    try {
      await create()
    } catch (error) {
      if (error.toString().includes('already exists') === false) {
        console.error(error)
        throw new Error(error)
      }

      await drop()
      await create()
    }

    return client.end()
  })

  it('system migrations', () =>
    migrate({ args: ['up'] }))

  it('integration migrations', () =>
    migrate({
      args: ['up', '-m', './test/integration/migrations', '-t', 'pgmigrations-integrations'],
      ignoreIfNotExist: 'test/integration/migrations'
    }))

  it('creates the elastic indices', async () => {
    return new Promise((resolve, reject) => {
      const migrate = spawn('bin/elastic-migrate', ['up', 'integration'], {
        cwd: process.cwd(),
        env: Object.assign({}, process.env, {
          elastic__host: elasticHost,
          elastic__indexPrefix: indexPrefix
        })
      })

      if (debug) {
        migrate.stdout.on('data', data => console.log(`${data}`))
        migrate.stderr.on('data', data => console.error(`${data}`))
      }

      migrate.on('close', exitCode =>
        exitCode !== 0 ? reject(exitCode) : resolve(exitCode))
    })
  })

  it('starts global.API', () => {
    const env = Object.assign({}, process.env, {
      DATABASE__USER: user,
      DATABASE__PASSWORD: password,
      DATABASE__HOST: host,
      DATABASE__PORT: port,
      DATABASE__DATABASE: database
    })

    const api = spawn('node', ['lib/index', '--integration'], {
      cwd: process.cwd(),
      env
    })

    if (debug) {
      api.on('close', (_code, signal) => console.log(`closed global.API with signal: ${signal}`))
    }

    global.API = api

    return new Promise((resolve, reject) => {
      api.stdout.on('data', data => {
        console.log(log(`\n API | ${`${data}`.replace(/\n/g, '\n      ')}`))
        if (data.includes('listening on port')) resolve(data)
      })
      api.stderr.on('data', data => {
        console.error(err(`\n API | ${`${data}`.replace(/\n/g, '\n      ')}`))
        reject(data)
      })
    })
  })
})
