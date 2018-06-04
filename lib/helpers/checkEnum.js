module.exports =  function checkEnum (string = '', list = [], defaultValue = null) {
  if (typeof string !== 'string') {
    return defaultValue
  }

  string = string.toLowerCase()

  if (list.includes(string)) {
    return string
  }

  return defaultValue
}
