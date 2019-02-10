const mysql = require('mysql')

export const getConnection = () => {
  return mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'pool'
  })
}