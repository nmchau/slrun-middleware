const {createLogger} = require('bunyan')

module.exports = (options) => {
  const {messageServer, serviceManager} = options
  messageServer((connection) => {
    const log = createLogger({
      name: 'slrun-middleware',
      src: true,
      connection: connection.id
    })
    return {
      ['CREATE_SERVICE']({serviceName}) {
        return serviceManager.createService(connection, serviceName)
        .then((service) => {
          const {id, url} = service
          log.info({
            service: serviceManager.logService(service)
          }, 'created service')
          connection.send({
            type: 'CREATE_SERVICE_SUCCESS',
            payload: {
              id,
              url
            }
          })
        })
      },
      ['RUN_SERVICE_SUCCESS']({serviceId, requestId, response}) {
        serviceManager.getService(serviceId)
        .then((service) => {
          if (!service) {
            return
          }
          return serviceManager.getRequest(service, requestId)
          .then((request) => {
            if (request) {
              log.info({
                request: serviceManager.logRequest(request)
              }, 'handled request')
              request.reply(response)
            }
          })
        })
      }
    }
  })
  return (req, res, next) => {
    const {serviceId, modulePath, args} = serviceManager.parseInfo(req)
    serviceManager.getService(serviceId)
    .then((service) => {
      if (!service) {
        next()
        return
      }
      return serviceManager.createRequest(service, (response) => {
        res.json(response)
        next()
      })
      .then((request) => {
        service.connection.send({
          type: 'RUN_SERVICE',
          payload: {
            serviceId,
            requestId: request.id,
            reqInfo: {
              method: req.method,
              url: req.url
            },
            modulePath,
            args
          }
        })
      })
    })
  }
}
