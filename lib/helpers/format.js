function ltreeStringToArray (string) {
  if (typeof string !== 'string') {
    return string
  }

  return string.replace(/\{|\}/g, '').split(',')
}

function toFloat (string) {
  return parseFloat(string) || string
}

function splitMap (string, defaultValue = null) {
  if (typeof string !== 'string') {
    return defaultValue
  }

  const array = string.split(',').filter(a => a)

  if (!array.length) {
    return defaultValue
  }

  return array
}

module.exports = {
  ltreeStringToArray,
  toFloat,
  splitMap
}
