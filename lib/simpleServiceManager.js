module.exports = (options) => {
  const {serverUrl} = options
  const serviceById = {}
  let nextServiceId = 0
  return {
    createService (connection, serviceName) {
      const serviceId = `${serviceName}-${++nextServiceId}`
      const service = {
        connection,
        nextRequestId: 0,
        requestById: {},
        id: serviceId,
        url: `${serverUrl}/${serviceId}`
      }
      serviceById[service.id] = service
      return Promise.resolve(service)
    },
    getService (serviceId) {
      return Promise.resolve(serviceById[serviceId])
    },
    logService (service) {
      const {id, url, connection: {id: connectionId}} = service
      return {
        id,
        url
      }
    },
    createRequest (service, callback) {
      const requestId = `${service.id}-request-${++service.nextRequestId}`
      const request = {
        id: requestId,
        serviceId: service.id,
        reply (response) {
          delete service.requestById[requestId]
          callback(response)
        }
      }
      service.requestById[request.id] = request
      return Promise.resolve(request)
    },
    getRequest (service, requestId) {
      return Promise.resolve(service.requestById[requestId])
    },
    logRequest (request) {
      const {id, serviceId} = request
      return {
        id,
        serviceId
      }
    },
    parseInfo (req) {
      const {parseArg} = this
      const [, serviceId, ...modulePathParts] = req.path.split('/')
      const modulePath = modulePathParts.join('/')
      const queryString = req.url.substring(req.path.length + 1)
      const queryKeys = queryString.split('&')
        .map((pair) => pair.substring(0, pair.indexOf('=')))
      const args = queryKeys.map((key) => parseArg(key, req.query[key]))
      return {
        serviceId,
        modulePath,
        args
      }
    },
    parseArg (key, value) {
      return isNaN(value) ? value : +value
    }
  }
}
