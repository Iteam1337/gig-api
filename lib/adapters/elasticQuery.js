const _bodybuilder = require('bodybuilder')
const { indexPrefix } = require('./elastic')

const bodybuilder = (options = {}, { index = 'jobs', type = 'job'} = {}) => {
  if (index.startsWith(indexPrefix) === false) {
    index = `${indexPrefix}${index}`
  }

  const head = {
    index,
    type
  }

  if (options) {
    Object.assign(head, options)
  }

  const body = _bodybuilder()
  const __build = body.build

  return Object.assign(body, {
    build: () => Object.assign(head, {
      body: __build.call(body)
    })
  })
}

const raw = (options = {}, { index = 'jobs', type = 'job' } = {}) => {
  if (index.startsWith(indexPrefix) === false) {
    index = `${indexPrefix}${index}`
  }

  const head = {
    index,
    type
  }

  return Object.assign(head, options)
}

module.exports = {
  raw,
  bodybuilder
}
