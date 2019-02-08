const mysql = require('mysql')
const app = require('express')()
// const routes = require('./routes')

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'pool'
})

// connection.connect()

/* connection.query('SELECT * FROM blocks WHERE height = 1200 LIMIT 1', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results);
})

connection.end() */

export const PORT = 3009

app.listen(PORT, () => {
  console.log('listening on port ' + PORT)
  var date = new Date()
  var current_hour = date.getHours()
  console.log('Time is: ', date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + 'howdyo2')
})