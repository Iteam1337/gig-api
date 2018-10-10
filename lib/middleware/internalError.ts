const restifyErrors = require('restify-errors')

export function internalError (status: Number = 500, message: String = ''): any  {
  switch (status) {
    case 500:
      return new restifyErrors.InternalServerError(message)
    case 501:
      return new restifyErrors.NotImplementedError(message)
    case 502:
      return new restifyErrors.BadGatewayError(message)
    case 503:
      return new restifyErrors.ServiceUnavailableError(message)
    case 504:
      return new restifyErrors.GatewayTimeoutError(message)
    case 505:
      return new restifyErrors.HttpVersionNotSupportedError(message)
    default:
      return new restifyErrors.InternalError(message)
  }
}
