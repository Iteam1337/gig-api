const { spawn } = require('child_process')
const { existsSync } = require('fs')
const chalk = require('chalk')

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
  defaults,
  elastic: {
    host: elasticHost,
    indexPrefix
  }
} = require('./config')

const [log, err] = [chalk.keyword('grey'), chalk.keyword('white')]
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
      }, defaults)
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

  it('system (POSTGRES) migrations', () =>
    migrate({
      args: [
        'up',
        '-m',
        './migrations/postgres'
      ]
    }))

  it('integration (POSTGRES) migrations', () =>
    migrate({
      args: [
        'up',
        '-m',
        './test/integration/migrations/postgres',
        '-t',
        'pgmigrations-integrations'
      ],
      ignoreIfNotExist: 'test/integration/migrations/postgres'
    }))

  it('creates the elastic indices', async () =>
    new Promise((resolve, reject) => {
      const migrate = spawn('bin/elastic-migrate', ['up', 'integration'], {
        cwd: process.cwd(),
        env: Object.assign({}, process.env, defaults)
      })

      if (debug) {
        migrate.stdout.on('data', data => console.log(`${data}`))
        migrate.stderr.on('data', data => console.error(`${data}`))
      }

      migrate.on('close', exitCode =>
        exitCode !== 0 ? reject(exitCode) : resolve(exitCode))
    }))

  it('starts global.API', () => {
    const env = Object.assign({}, process.env, defaults)

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
