const poolRouter = require('express').Router()
// var cache = require('express-redis-cache')()
import { getConnection, mergeBlocks, filterFields, limitRange } from '../utils.js'
const pbkdf2 = require('pbkdf2')
const crypto = require('crypto')
const basicAuth = require('express-basic-auth')
const express = require('express')
const app = express()

// gets network data for a range of blocks
poolRouter.get('/stats/:height,:range/:fields?', (req, res) => {
  try {
    const connection = getConnection()
    const { height, range, fields } = req.params

    if (!height || !range) throw new Error('No height or range field specified')
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    const query = `SELECT ps.*, gps.gps, gps.edge_bits
      FROM pool_stats AS ps JOIN gps ON ps.height = gps.pool_stats_id
      WHERE ps.height > ${connection.escape(min)} AND ps.height <= ${connection.escape(max)}`
    console.log('query is: ', query)
    connection.query(query, (error, results) => {
      if (error) throw Error(error)
      if (fields) results = filterFields(fields, results)
      const output = mergeBlocks(results)
      res.json(output)
    })
  } catch (e) {
    console.log('Error is: ', e)
    res.status(500)
  }
})

poolRouter.get('/block', (req, res) => {
  try {
    const connection = getConnection()
    const query = `SELECT height, hash, nonce, actual_difficulty, net_difficulty, state, UNIX_TIMESTAMP(timestamp) as timestamp 
                  FROM pool_blocks
                  WHERE height = (SELECT MAX(height)
                  FROM pool_blocks)
                  LIMIT 1`
    console.log('query is: ', query)
    connection.query(query, (error, results) => {
      if (error) throw Error(error)
      res.json(...results)      
    })
  } catch (e) {
    console.log('Error is: ', e)
    res.status(500)
  }
}) 

poolRouter.get('/blocks/:height,:range?', (req, res) => {
  try {
    let { height, range } = req.params
    const connection = getConnection()
    range = limitRange(parseInt(range))
    height = parseInt(height)
    const rangeSyntax = ` LIMIT ${range}`
    const query = `SELECT height, hash, nonce, actual_difficulty, net_difficulty, UNIX_TIMESTAMP(timestamp) as timestamp, state FROM pool_blocks WHERE height <= ${height} ORDER BY height DESC ${rangeSyntax}`
    console.log('query is: ', query)    
    connection.query(query, (error, results) => {
      if (error) throw Error(error)
      res.json(results)
    })
  } catch (error) {
    console.log('Error is: ', e)
    res.status(500)
  }
})

poolRouter.get('/users', (req, res) => {
  const auth = req.headers['authorization']
  const encodedString = auth.replace('Basic ', '')
  console.log('encodedString is: ', encodedString)
  // const decoded = new Buffer(encodedString, 'utf-8')
  const decoded1 = new Buffer(encodedString, 'base64').toString()
  // const decoded2 = Base64.decode(encodedString)
  console.log('Authorization header is: ', auth, ' and decoded1 is: ', decoded1)
  const [username, password] = decoded1.splice(':')
  console.log('username is: ', username, ' and password: ', password)
})

export const hashPassword = (password) => {
  crypto.pbkdf2(password, salt, rounds, 64, 'sha512', (err, derivedKey) => {
    if (err) throw new Error
    const hashedPassword = derivedKey.toString('base64').toString().replace('=', '')
    return hashedPassword
  })
}

poolRouter.post('/users', (req, res) => {
  const { password, username } = req.body
  const connection = getConnection()
  const escapedPassword = connection.escape(password)
  const escapedUsername = connection.escape(username)  
  const salt = crypto.randomBytes(16).toString('base64').replace(/\=/g,'')
  const rounds = 656000
  console.log('about to begin try')
  try {
    crypto.pbkdf2(password, salt, rounds, 64, 'sha512', (err, derivedKey) => {
      if (err) throw new Error
      const hashedPassword = derivedKey.toString('base64').toString().replace(/\=/g,'')
      const fullHashedPassword = `$6$rounds=${rounds}$${salt}$${hashedPassword}`
      console.log('hashedPassword is: ', hashedPassword)
      // console.log('hashedPassword is: ', hashedPassword)
      const findUserQuery = `SELECT id FROM users WHERE username = ${escapedUsername} LIMIT 1`
      // console.log('query is: ', findUserQuery)
      connection.query(findUserQuery, (error, results) => {
        if (error) throw Error(error)
        if (results.length > 0) res.json({ message: 'Conflict with existing account' })
        const insertUserQuery = `INSERT INTO users SET username = ${escapedUsername}, extra1 = '${fullHashedPassword}'`
        // console.log('query is: ', insertUserQuery)
        connection.query(insertUserQuery, (error, results) => {
          if (error) throw Error(error)
          // console.log('results.affectedRows is: ', results.affectedRows)
          if (results.affectedRows === 1) res.json({ username, id: results.insertId })
        })
      })
    })
  } catch (e) {
    console.log('error is: ', e)
    res.status(500)    
  }

})

module.exports = poolRouter