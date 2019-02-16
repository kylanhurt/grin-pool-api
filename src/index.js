const app = require('express')()
const bodyParser = require('body-parser')
import { jwt } from 'jsonwebtoken'
const networkRouter = require('./routes/networkRoutes.js')
const poolRouter = require('./routes/poolRoutes.js')
const workerRouter = require('./routes/workerRoutes.js')

export const secretKey = 'xxxxyyyyyzzzzz'
export const PORT = 3009
export const tokens = {

}
app.listen(PORT, () => {
  console.log('listening on port ' + PORT)
  var date = new Date()
  var current_hour = date.getHours()
  console.log('Time is: ', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds())
})

app.get('/test/token', (req, res) => {
  res.json({ message: 'post created'})
})

app.use('/worker', (req, res, next) => {
  console.log('verifying token')
  // get auth header value
  const bearerHeader = req.headers['authorization']
  console.log('bearerHeader is: ', bearerHeader)
  const authorization = req.headers.authorization
  console.log('authorization is: ', authorization)
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else {
    console.log('protected /worker request has no authorization')
    res.status(403).end()
  }
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))


// just list all routers
app.use('/grin', networkRouter)
app.use('/pool', poolRouter)
app.use('/worker', workerRouter)