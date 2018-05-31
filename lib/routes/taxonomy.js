const taxonomyService = require('../services/taxonomy')

async function searchTaxonomy (req, res, next) {
  const { language, query } = req.query
  try {
    const data = await taxonomyService.searchTaxonomy({ language, query })
    res.send({ data })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  searchTaxonomy
}
