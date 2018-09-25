const moment = require('moment')
const uuid = require('uuid/v4')

module.exports = ({
  from,
  company = '',
  source = '',
  language = 'sv',
  text = 'bar',
  title = 'foo',
  type = 'gig',
  sourceId = null,
  experience = null,
  skills = null,
  education = null,
  languageSkills = null,
  latitude = 59.3454567,
  longitude = 18.060362,
  currency = 'SEK',
  pay = 100,
  paymentType = 'hourly',
  address = 'Östermalmsgatan 26A, 114 26 Stockholm'
}) => {
  from = moment(from && from.now ? from.now : Date.now())

  const to = moment(from.now).add(48, 'hours').toISOString()

  from = from.toISOString()

  return {
    sourceId: sourceId || uuid(),
    type,
    company,
    title,
    preamble: text,
    text,
    language,
    currency,
    pay,
    paymentType,
    source,
    latitude,
    longitude,
    address,
    experience,
    skills,
    education,
    languageSkills,
    createdAt: from,
    startDate: from,
    endDate: to,
    listedDate: from,
    link: 'http://foo.bar',
    contact: 'mail@dennispettersson.se',
    entryBy: 'integration'
  }
}
