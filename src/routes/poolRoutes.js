const poolRouter = require('express').Router()
// var cache = require('express-redis-cache')()
import { getConnection, mergeBlocks, filterFields, limitRange, hashPassword } from '../utils.js'
import jwt from 'jsonwebtoken'
import { secretKey } from '../index.js'
const pbkdf2 = require('pbkdf2')
const crypto = require('crypto')
const basicAuth = require('express-basic-auth')
const express = require('express')
const app = express()
const multer = require('multer');
const upload = multer()

// gets network data for a range of blocks
poolRouter.get('/stats/:height,:range/:fields?', (req, res) => {
  try {
    const connection = getConnection()
    const { height, range, fields } = req.params

    if (!height || !range) throw new Error('No height or range field specified')
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    if (range > max || max === 0) throw new Error('Block range incorrect')
    const query = `SELECT ps.*, gps.gps, gps.edge_bits, UNIX_TIMESTAMP(ps.timestamp) as timestamp
      FROM pool_stats AS ps JOIN gps ON ps.height = gps.pool_stats_id
      WHERE ps.height > ${connection.escape(min)} AND ps.height <= ${connection.escape(max)}`
    console.log('query is: ', query)
    connection.query(query, (error, results) => {
      if (error) throw Error(error)
      console.log('fields are: ', fields)
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
  const connection = getConnection()
  const auth = req.headers['authorization']
  const encodedString = auth.replace('Basic ', '')
  console.log('(users) encodedString is: ', encodedString)
  // const decoded = new Buffer(encodedString, 'utf-8')
  const decoded1 = new Buffer(encodedString, 'base64').toString()
  // const decoded2 = Base64.decode(encodedString)
  console.log('Authorization header is: ', auth, ' and decoded1 is: ', decoded1)
  const [username, password] = decoded1.split(':')
  console.log('(users)username is: ', username, ' and password: ', password)
  hashPassword(username, password)
    .then((output) => {
      const fullHashedPassword = output.fullHashedPassword
      console.log('(users) fullHashedPassword is: ', fullHashedPassword)
      const query = `SELECT * FROM users WHERE username = '${username}' AND extra1 = '${fullHashedPassword}'`
      connection.query(query, (error, results) => {
        console.log('verifying results: ', results)
        jwt.sign({ id: results[0].id, username: results[0].username }, secretKey, { expiresIn: '1 day'}, (err, token) => {
          console.log('signed token is: ', token, ' and error is: ', err)
          res.status(200).json({ token, id: results[0].id })
        })        
      })      
    })
})

poolRouter.post('/users', upload.fields([]), (req, res) => {
  const { password, username } = req.body
  console.log('req.body is: ', req.body)
  const connection = getConnection()
  const escapedPassword = connection.escape(password)
  console.log('escapedPassword is: ', escapedPassword)
  const escapedUsername = connection.escape(username)  
  const salt = crypto.randomBytes(16).toString('base64').replace(/\=/g,'')
  const rounds = 656000
  console.log('about to begin try')
  try {
    crypto.pbkdf2(password, salt, rounds, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        console.log('crypto.pbkdf2 error: ', err)
        throw new Error(err)
      }
      const hashedPassword = derivedKey.toString('base64').toString().replace(/\=/g,'')
      const fullHashedPassword = `$6$rounds=${rounds}$${salt}$${hashedPassword}`
      console.log('hashedPassword is: ', hashedPassword)
      console.log('fullHashedPassword is: ', fullHashedPassword)
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
    res.status(500).json({ message: e})
  }
})

module.exports = poolRouter