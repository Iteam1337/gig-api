const _bodybuilder = require('bodybuilder')
const { indexPrefix } = require('./elastic')

const body = (options = {}, { index = 'jobs', type = 'job'} = {}) => {
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

function onOff (...args) {
  return args.reduce((returnVal, arg) =>
    typeof arg !== 'undefined' ? arg : returnVal, undefined)
}

const functionScore = ({ boost: { mode = 'sum', min, max, boost }, filter = {} }) => {
  min = onOff(min, max, boost)
  max = onOff(max, min, boost)
  boost = onOff(boost, min, max)

  return {
    function_score: {
      boost_mode: mode,
      max_boost: max,
      boost: boost,
      min_score: min,
      query: {
        bool: {
          must: {
            match_all: {}
          },
          filter
        }
      }
    }
  }
}

module.exports = {
  raw,
  body,
  functionScore
}
