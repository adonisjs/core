/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Router } from '../src/Router'
import { createServer } from 'http'

process.title = 'Router example'

const router = new Router()

router.resource('posts', 'PostController')

router.shallowResource('posts.comments', 'CommentsController')
router.resource('users', 'UserController')

router.get('login', 'AuthController.loginForm')
router.post('login', 'AuthController.authenticate')

router.get('register', 'AuthController.registerForm')
router.post('register', 'AuthController.register')
router.get('home', 'HomeController.index')

router.commit()

createServer((req, res) => {
  const route = router.find(req.url!, req.method!)
  res.writeHead(200, { 'content-type': 'application/json' })
  res.write(JSON.stringify(route))
  res.end()
}).listen(3000, () => {
  console.log('Listening on http://localhost:3000')
})
