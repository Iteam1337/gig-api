const platformService = require('../services/platforms')

async function getPlatforms ({ query }, res, next) {
  try {
    const results = await platformService.getPlatforms(query)
    res.send(results)
  } catch (error) {
    next(error)
  }
}

async function getPlatform ({ params: { id = '0' } }, res, next) {
  console.log('id', id)
  try {
    const [platform] = await platformService.getPlatform(id)

    console.log(platform)
    res.send(platform)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getPlatforms,
  getPlatform
}
