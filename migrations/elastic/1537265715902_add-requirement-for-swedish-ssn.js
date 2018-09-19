const indexSuffix = 'jobs'
const type = 'job'

exports.up = async client => {
  const index = `${client.indexPrefix}${indexSuffix}`

  return client.indices.putMapping({
    index,
    type,
    body: {
      [type]: {
        properties: {
          require_ssn: { type: 'boolean', null_value: false }
        }
      }
    }
  })
}

exports.down = async client => {
  const index = `${client.indexPrefix}${indexSuffix}`

  const { [index]: { mappings } } = await client.indices.getMapping({ index})
  const { [index]: { settings: { index: { mapper } } } } = await client.indices.getSettings({ index })

  const { hits: { hits } } = await client.search({
    index,
    type,
    size: 10000, // max-size.
    body: { query: { match_all: {} } }
  })

  await client.indices.delete({ index })

  delete mappings[type].properties.require_ssn // remove part added by migration
  await client.indices.create({
    index,
    body: {
      settings: { index: { mapper } },
      mappings
    }
  })

  const body = [].concat.apply([], hits.map(({ _id, _source: doc }) => {
    delete doc.require_ssn // remove part added by migration

    return [
      { index: { _index: index, _type: type, _id } },
      doc
    ]
  }))

  await client.bulk({
    refresh: 'wait_for',
    body
  })
}
