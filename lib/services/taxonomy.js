const graphQlClient = require('../adapters/graphql')

async function searchTaxonomy ({ language = 'en', query = '' }) {
  const graphQlQuery = `
    {
      searchCompetences(language: "${language}", query: "${query}") {
        name
        path
      }
  } `

  return graphQlClient.request(graphQlQuery)
}

module.exports = {
  searchTaxonomy
}
