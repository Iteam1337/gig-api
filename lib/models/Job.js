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
      .filter(item => item.search(/[^\d.]/) === -1)
  }

  static ltreeArrayString (array) {
    if (!Array.isArray(array) || !array.length) return null
    return `{${array.join(',')}}`
  }

  constructor ({
    id = null,

    address = '',
    company = '',
    contact = '',
    createdAt = null,
    currency = '',
    education = null,
    endDate = null,
    entryBy = '',
    experience = null,
    language = '',
    languageSkills = null,
    latitude = 0.0,
    link = '',
    listedDate = null,
    longitude = 0.0,
    pay = null,
    paymentType = null,
    preamble = '',
    requireSsn = false,
    skills = null,
    source = '',
    sourceId = '',
    startDate = null,
    text = '',
    title = '',
    type = ''
  }) {
    this.id = id
    this.address = `${address}`
    this.company = typeof company === 'string' ? company : null
    this.contact = `${contact}`
    this.createdAt = Date.parse(createdAt) > 0 ? createdAt : null
    this.currency = typeof currency === 'string' ? currency : null
    this.education = Job.ltreeArrayString(Job.ltreeArray(education))
    this.endDate = Date.parse(endDate) > 0 ? endDate : null
    this.entryBy = `${entryBy}`
    this.experience = Job.ltreeArrayString(Job.ltreeArray(experience))
    this.language = Job.language(language)
    this.languageSkills = Job.ltreeArrayString(Job.ltreeArray(languageSkills))
    this.latitude = Number(latitude) > 0 ? Number(latitude) : 0.0
    this.link = `${link}`
    this.listedDate = Date.parse(listedDate) > 0 ? listedDate : null
    this.longitude = Number(longitude) > 0 ? Number(longitude) : 0.0
    this.pay = Number(pay) > 0 ? Number(pay) : null
    this.paymentType = Job.payment(paymentType)
    this.preamble = striptags(preamble)
    this.requireSsn = !!requireSsn
    this.skills = Job.ltreeArrayString(Job.ltreeArray(skills))
    this.source = `${source}`
    this.sourceId = `${sourceId}`
    this.startDate = Date.parse(startDate) > 0 ? startDate : null
    this.text = striptags(text)
    this.title = typeof title === 'string' ? title : null
    this.type = Job.employment(type)

    if (this.invalid()) {
      throw new Error('not valid')
    }
  }

  invalid () {
    if (
      this.type === null ||
      this.company === null ||
      this.title === null ||
      !this.preamble.trim() ||
      !this.text.trim() ||
      this.createdAt === null ||
      this.language === null ||
      !this.link.trim() ||
      !this.contact.trim() ||
      !this.sourceId.trim() ||
      this.latitude === 0.0 ||
      this.longitude === 0.0
    ) {
      return true
    }

    if (this.startDate === null || this.endDate === null) {
      console.log(`missing startDate | endDate`)
      return true
    }

    return false
  }
}
