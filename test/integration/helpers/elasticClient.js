const { Client } = require('elasticsearch')

const { elastic: { host, indexPrefix } } = require('../config')
const client = Object.assign(new Client({ host }), { indexPrefix })
const indices = [['jobs', 'job']].map(([ index, types ]) => [ `${indexPrefix}${index}`, types ])

module.exports = {
  indices,
  client,
  truncate: async () => {
    await Promise.all(indices.map(async ([ index, types ]) =>
      new Promise(resolve => {
        let tries = 5

        async function truncate () {
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
        }

        async function waitForCompletion () {
          const { count } = await client.count({ index })

          if (!count || --tries <= 0) {
            return true
          }

          const stats = await client.indices.stats({ index, types })

          const { total } = stats.indices[index]

          if (total.count === 0) {
            return true
          }

          return false
        }

        async function run () {
          await truncate()

          const done = await waitForCompletion()

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
