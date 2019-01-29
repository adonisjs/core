const http = require('http')
const { Request } = require('@adonisjs/request')
const { Response } = require('@adonisjs/response')
const { Router } = require('@adonisjs/router')
const { MiddlewareStore, Server, routePreProcessor } = require('..')

const middlewareStore = new MiddlewareStore()
const router = new Router((route) => routePreProcessor(route, middlewareStore))

router.get('/', async function ({ response }) {
  return { hello: 'world' }
})

router.commit()

const server = new Server(Request, Response, router, middlewareStore)
http.createServer(server.handle.bind(server)).listen(4000, () => {
  console.log('listening on http://localhost:4000')
})
