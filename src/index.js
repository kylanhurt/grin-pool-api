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
    app.use(morgan(':method :url :status :response-time ms - :res[content-length]')) //'combined' outputs the Apache style LOGs
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
    res.status(403).send('No authorization')
  }
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))

// just list all routers
app.use('/grin', networkRouter)
app.use('/pool', poolRouter)
app.use('/worker', workerRouter)

app.get('*', function(req, res, next) {
  const err = new Error('Page Not Found')
  err.statusCode = 404
  next(err);
})

// error-handling
app.use(function(err, req, res, next) {
  if (!err.statusCode) err.statusCode = 500 // If err has no specified error code, set error code to 'Internal Server Error (500)'
  //res.status(err.status || 500)
  console.log('err.statusCode is: ', err.statusCode, ' and err.message: ', err.message)
  res.status(err.statusCode).send(err.message) // All HTTP requests must have a response, so let's send back an error with its status code and message
})

app.on('uncaughtException', (err) => {
  console.log('Uncaught exception: ', JSON.toString(err))
})



module.exports = app