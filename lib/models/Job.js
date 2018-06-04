const striptags = require('striptags')
const checkEnum = require('../helpers/checkEnum')
module.exports = class Job {
  static language (string = '') {
    return checkEnum(string, ['en', 'sv', 'ar', 'fa', 'so', 'ti'])
  }

  static employment (string = '') {
    return checkEnum(string, ['gig', 'employment'])
  }

  static payment (string = '') {
    return checkEnum(string, ['hourly', 'fixed'])
  }

  static ltreeArray (value = '') {
    if (!Array.isArray(value) && typeof value !== 'string') {
      return null
    }

    return (Array.isArray(value) ? value : value.split(','))
      .map(item => `${item}`)
      .filter(item => item.search(/[^\d\.]/) === -1)
  }

  constructor ({
    id = null,
    sourceId = '',
    type = '',
    company = '',
    title = '',
    preamble = '',
    text = '',
    createdAt = null,
    language = '',
    link = '',
    contact = '',
    currency = '',
    pay = null,
    paymentType = null,
    startDate = null,
    endDate = null,
    listedDate = null,
    source = '',
    entryBy = '',
    latitude = 0.0,
    longitude = 0.0,
    address = '',

    experience = null,
    skills = null,
    education = null,
    languageSkills = null
  }) {
    this.id = id
    this.type = Job.employment(type)
    this.company = typeof company === 'string' ? company : null
    this.title = typeof title === 'string' ? title : null
    this.preamble = striptags(preamble)
    this.text = striptags(text)
    this.createdAt = Date.parse(createdAt) > 0 ? createdAt : null
    this.language = Job.language(language)
    this.link = `${link}`
    this.contact = `${contact}`
    this.pay = Number(pay) > 0 ? Number(pay) : null
    this.paymentType = Job.payment(paymentType)
    this.currency = typeof currency === 'string' ? currency : null
    this.startDate = Date.parse(startDate) > 0 ? startDate : null
    this.endDate = Date.parse(endDate) > 0 ? endDate : null
    this.listedDate = Date.parse(listedDate) > 0 ? listedDate : null
    this.source = `${source}`
    this.sourceId = `${sourceId}`
    this.entryBy = `${entryBy}`
    this.longitude = Number(longitude) > 0 ? Number(longitude) : 0.0
    this.latitude = Number(latitude) > 0 ? Number(latitude) : 0.0
    this.address = `${address}`
    this.experience = Job.ltreeArray(experience)
    this.skills = Job.ltreeArray(skills)
    this.education = Job.ltreeArray(education)
    this.languageSkills = Job.ltreeArray(languageSkills)

    if (this.invalid()) {
      throw new Error('not valid')
    }
  }

  invalid () {
    if (
      this.type === null ||
      this.company === null ||
      this.title === null ||
      !this.preamble.strip() ||
      !this.text.strip() ||
      this.createdAt === null ||
      this.language === null ||
      !this.link.strip() ||
      !this.contact.strip() ||
      this.startDate === null ||
      this.endDate === null ||
      !this.sourceId.strip() ||
      this.latitude === 0.0 ||
      this.longitude === 0.0
    ) {
      return true
    }

    return false
  }
}
