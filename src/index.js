const app = require('express')()
const db = require('./config/database.js')

export const PORT = 3009

app.listen(PORT, () => {
  console.log('listening on port ' + PORT)
  var date = new Date()
  var current_hour = date.getHours()
  console.log('Time is: ', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds())
})

db.authenticate()
  .then(() => {
    console.log('database connected')
  })
  .catch((e) => {
    console.log('Error:', e)
  })

const networkRouter = require('./routes/networkRoutes.js')
const poolRouter = require('./routes/poolRoutes.js')

// just list all routers
app.use('/grin', networkRouter)
app.use('/pool', poolRouter)

