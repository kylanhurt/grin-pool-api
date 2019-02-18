const app = require('express')()
const bodyParser = require('body-parser')
import { jwt } from 'jsonwebtoken'
const networkRouter = require('./routes/networkRoutes.js')
const poolRouter = require('./routes/poolRoutes.js')
const workerRouter = require('./routes/workerRoutes.js')
const cors = require('cors')
const config = require('config')
const morgan = require('morgan')

export const secretKey = 'xxxxyyyyyzzzzz'
export const PORT = 3009

app.use(cors())

if(config.util.getEnv('NODE_ENV') !== 'test') {
    // use morgan to log at command line
    app.use(morgan('combined')) //'combined' outputs the Apache style LOGs
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

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
})

app.use('/worker', (req, res, next) => {
  //console.log('verifying token')
  // get auth header value
  console.log('req.url is: ', req.url)
  const bearerHeader = req.headers.authorization
  const authorization = req.headers['authorization']
  //console.log('authorization is: ', authorization)
  //console.log('bearerHeader is: ', bearerHeader)
  //.log('headers are: ', req.headers)
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    //console.log('index token verification going to next')
    next()
  } else {
    console.log('req.url is: ', req.url, ' and protected /worker request has no authorization')
    res.status(403).end()
  }
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

// just list all routers
app.use('/grin', networkRouter)
app.use('/pool', poolRouter)
app.use('/worker', workerRouter)

app.on('uncaughtException', (err) => {
  console.log('Uncaught exception: ', err)
})

module.exports = app