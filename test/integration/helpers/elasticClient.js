const { Client } = require('elasticsearch')

const { elastic: { host, indexPrefix } } = require('../config')
const client = Object.assign(new Client({ host }), { indexPrefix })
const indices = ['jobs'].map(index => `${indexPrefix}${index}`)

module.exports = {
  client,
  truncate: async () => {
    await Promise.all(indices.map(async index =>
      new Promise(resolve => {
        let tries = 5

        async function truncate () {
          const { count } = await client.count({ index })

          if (!count || --tries <= 0) {
            return true
          }

          try {
            await client.deleteByQuery({
              index,
              waitForCompletion: true,
              conflicts: 'proceed',
              body: {
                query: {
                  match_all: {}
                }
              },
              size: -1
            })
          } catch (error) {
            console.error(error)
          }

          return false
        }

        async function run () {
          const done = await truncate()
          if (done) {
            return resolve()
          }

          setTimeout(() => run(), 1000)
        }

        run()
      })
    ))
  }
}
