const express = require('express')
const http = require('http')
const {createLogger} = require('bunyan')

const slrunMiddleware = require('./')
const websocketMessageServer = require('./websocketMessageServer')
const simpleServiceManager = require('./simpleServiceManager')

const SERVER_PORT = 3000
const SERVER_URL = `http://localhost:${SERVER_PORT}`

const log = createLogger({
  name: 'dev-server',
  src: true
})
const app = express()
const server = http.createServer(app)


const messageServer = websocketMessageServer({
  server
})
const serviceManager = simpleServiceManager({
  serverUrl: SERVER_URL
})
app.use(slrunMiddleware({
  messageServer,
  serviceManager
}))

server.listen(SERVER_PORT, () => {
  log.info({
    url: SERVER_URL
  }, 'started dev server')
})
