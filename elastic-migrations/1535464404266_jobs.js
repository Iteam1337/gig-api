const index = 'jobs'

exports.up = async client => {
  const exists = await client.indices.exists({ index })

  if (exists) {
    await client.indices.delete({ index })
  }

  return client.indices.create({
    index: 'jobs',
    body: {
      settings: {
        index: {
          'mapper.dynamic': false
        }
      },
      mappings: {
        job: {
          dynamic: 'strict',
          properties: {
            id: { type: 'text' },
            company: { type: 'text' },
            title: { type: 'text' },
            preamble: { type: 'text' },
            text: { type: 'text' },
            created_at: { type: 'date' },
            link: { type: 'text' },
            contract: { type: 'text' },
            start_date: { type: 'date' },
            end_date: { type: 'date' },
            listed_date: { type: 'date' },
            source: { type: 'text' },
            entry_by: { type: 'text' },
            source_id: { type: 'text' },
            position: { type: 'geo_point' },
            address: { type: 'text' },
            type: { type: 'text' },
            pay: { type: 'float' },
            payment_type: { type: 'text' },
            currency: { type: 'text' },
            language: { type: 'text' },
            experience: { type: 'text' },
            skills: { type: 'text' },
            education: { type: 'text' },
            language_skills: { type: 'text' }
          }
        }
      }
    }
  })
}

exports.down = async client => {
  const exists = await client.indices.exists({ index })

  if (!exists) {
    return
  }

  return client.indices.delete({ index })
}
