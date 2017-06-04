const Primus = require('primus')

module.exports = (options) => {
  const {server} = options
  const primus = new Primus(server, {
    transformer: 'websockets'
  })
  return (createHandlers) => {
    primus.on('connection', (spark) => {
      const connection = {
        id: spark.id,
        send: spark.write.bind(spark)
      }
      const handlers = createHandlers(connection)
      spark.on('data', (data) => {
        const handler = handlers[data.type]
        if (handler) {
          handler(data.payload)
        }
      })
    })
  }
}
