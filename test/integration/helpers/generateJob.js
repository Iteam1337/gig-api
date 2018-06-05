const { useFakeTimers } = require('sinon')
const uuid = require('uuid/v4')

module.exports = ({
  from,
  company = '',
  source = '',
  language = 'sv',
  text = 'bar',
  title = 'foo',
  type = 'gig',
  sourceId = uuid(),
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
  from = useFakeTimers(from && from.now || Date.now())

  const to = useFakeTimers(Date.now(from.now))

  to.tick('48:00:00')

  return {
    sourceId,
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
    createdAt: new Date(from.now).toISOString(),
    startDate: new Date(from.now).toISOString(),
    endDate: new Date(to.now).toISOString(),
    listedDate: new Date(from.now).toISOString(),
    link: 'http://foo.bar',
    contact: 'mail@dennispettersson.se',
    entryBy: 'integration'
  }
}
