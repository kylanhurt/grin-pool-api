const app = require('express')()
const bodyParser = require('body-parser')

export const PORT = 3009

app.listen(PORT, () => {
  console.log('listening on port ' + PORT)
  var date = new Date()
  var current_hour = date.getHours()
  console.log('Time is: ', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds())
})

const networkRouter = require('./routes/networkRoutes.js')
const poolRouter = require('./routes/poolRoutes.js')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true}))


// just list all routers
app.use('/grin', networkRouter)
app.use('/pool', poolRouter)
