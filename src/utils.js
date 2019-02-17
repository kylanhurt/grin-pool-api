const mysql = require('mysql')
const pbkdf2 = require('pbkdf2')
const crypto = require('crypto')
import { tokens, secretKey } from './index.js'
const jwt = require('jsonwebtoken')
const config = require('config')

export const getConnection = () => {
  const pool = mysql.createPool({
    connectionLimit: 100,
    host     : config.dbHost,
    user     : 'root',
    password : 'root',
    database : 'pool'
  })
  console.log('pool.config.connectionLimit: ', pool.config.connectionLimit) // passed in max size of the pool
  console.log('pool._freeConnections.length: ', pool._freeConnections.length) // number of free connections awaiting use
  console.log('pool._allConnections.length: ', pool._allConnections.length) // number of connections currently created, including ones in use
  console.log('pool._acquiringConnections.length: ', pool._acquiringConnections.length)
  return pool
}

export const checkAuth = (req, res, next) => {
  try {
    console.log('req.token is: ', req.token)
    const decoded = jwt.verify(req.token, secretKey)
    console.log('checkAuth decoded is: ', decoded)    
    req.userData = decoded
    if (decoded.id !== parseInt(req.params.id)) {
      console.log('ids do not match')
      res.json({ message: 'Cannot access that user data' }).end()
      return
    }
    next()
  } catch (e) {
    console.log('checkAuth rejects: ', e)
    return res.status(401).json({ message: e })
  }
}

export const mergeBlocks = (results) => {
  const output = []
  results.forEach((resultsRow) => {
    const index = output.findIndex(outputRow => outputRow.height === resultsRow.height)
    // if it's a new row for the block
    if (index === -1) {
      output.push({
        ...resultsRow,
        gps: [
          {
            edge_bits: resultsRow.edge_bits,
            gps: resultsRow.gps
          }
        ]
      })
    } else {
      // console.log('in else clause, output is: ', output, ' and index is: ', index)
      output[index].gps.push({
        edge_bits: resultsRow.edge_bits,
        gps: resultsRow.gps
      })
    }
  })
  return output
}

export const filterFields = (fields, results) => {
  const fieldsList = fields.split(',')
  if (fieldsList.length > 0) {
    const filteredResults = results.map((item) => {
      let filteredItem = {}
      fieldsList.forEach(field => {
        filteredItem[field] = item[field]
      })
      return filteredItem
    })
    return filteredResults
  }
}

export const limitRange = (range) => {
  const maxRange = 120
  const defaultRange = 120
  let reducedRange = defaultRange
  if (range) reducedRange = range
  if (range > maxRange) reducedRange = maxRange
  return reducedRange
}

export const hashPassword = (username, password) => {
  return new Promise ((resolve, reject) => {
    const connection = getConnection()
    const rounds = 656000
    const query = `SELECT * FROM users WHERE username = '${username}'`
    console.log('(hash) hashPassword query is: ', query)
      connection.query(query, (err, results) => {
        if (err) reject(err)
        console.log('(hash) results are : ', results)
        if (results.length !== 1) reject('Erroneous DB results')
        console.log('results : ', results)
        const fullPassword = results[0].extra1
        console.log('(hash) fullPassword is: ', fullPassword)
        const salt = fullPassword.split('$')[3]
        console.log('(hash) salt is: ', salt)
        const derivedKey = crypto.pbkdf2Sync(password, salt, 656000, 64, 'sha512')
        console.log('(hash) derivedKey is: ', derivedKey)      
        const modifiedPassword = derivedKey.toString('base64').toString().replace(/\=/g,'')
        const fullHashedPassword = `$6$rounds=${rounds}$${salt}$${modifiedPassword}`
        console.log('(hash) reencrypted modifiedPassword is: ', modifiedPassword)
        resolve({ modifiedPassword, fullHashedPassword })
      })
  })
}