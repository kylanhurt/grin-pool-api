const poolRouter = require('express').Router()
// var cache = require('express-redis-cache')()
import {
  getConnection,
  mergeBlocks,
  filterFields,
  limitRange,
  reHashPassword,
  getPasswordFromFullPassword,
  createHashedPassword
} from '../utils.js'
import jwt from 'jsonwebtoken'
import { secretKey } from '../index.js'
const pbkdf2 = require('pbkdf2')
const crypto = require('crypto')
const basicAuth = require('express-basic-auth')
const express = require('express')
const app = express()
const multer = require('multer');
const upload = multer()
const hashPasswordLegacy = require('../hashPasswordLegacy.js')

// gets network data for a range of blocks
poolRouter.get('/stats/:height,:range/:fields?', (req, res, next) => {
  try {
    const { range, height, fields } = req.params
    const connection = getConnection()
    const actualHeight = parseInt(height) < 1 ? 1 : parseInt(height) // is the height less than 1? Then use 1
    let actualRange = (parseInt(range) > actualHeight) ? actualHeight : parseInt(range) // range too big? limit to max
    if (actualRange > 120) actualRange = 120
    if (!actualHeight || !actualRange) throw { statusCode: 400, message: 'Invalid height or range field specified' }
    // but if max is zero then it should find max
    const min = actualHeight - actualRange
    const maxHeightQuery = `SELECT max(height) as maxHeight FROM blocks LIMIT 1`
    connection.query(maxHeightQuery, (err, maxHeightResults) => {
      if (!maxHeightResults[0].maxHeight) throw { statusCode: 500, message: 'Query error'}
      const maxHeight = maxHeightResults[0].maxHeight
      const finalHeight = actualHeight > maxHeight ? maxHeight : actualHeight
    const poolStatsQuery = `SELECT ps.*, gps.gps, gps.edge_bits, UNIX_TIMESTAMP(ps.timestamp) as timestamp
      FROM pool_stats AS ps JOIN gps ON ps.height = gps.pool_stats_id
      WHERE ps.height > ${min} AND ps.height <= ${finalHeight}`
      console.log('poolStatsQuery is: ', poolStatsQuery)
      connection.query(
        poolStatsQuery,
        (error, poolStatsResults, field) => {
          if (error) throw { statusCode: 500, message: 'Query error' }
          console.log('poolStatsResults: '. poolStatsResults)
          const output = mergeBlocks(poolStatsResults)
          res.json(output)
        }
      )      
    })
  } catch (e) {
    next(e)
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
    next(e)
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
    next(e)
  }
})

poolRouter.get('/users', (req, res, next) => {
  try {
    const connection = getConnection()
    const auth = req.headers['authorization']
    const encodedString = auth.replace('Basic ', '')
    console.log('(users) encodedString is: ', encodedString)
    // const decoded = new Buffer(encodedString, 'utf-8')
    const decoded1 = new Buffer(encodedString, 'base64').toString()
    // const decoded2 = Base64.decode(encodedString)
    console.log('Authorization header is: ', auth, ' and decoded1 is: ', decoded1)
    const [username, enteredPassword] = decoded1.split(':')
    const escapedUsername = connection.escape(username)
    console.log('(users)username is: ', username, ' and password: ', enteredPassword)
    console.log('escaped username is: ', escapedUsername, ' and enteredPassword is: ', enteredPassword)
    const findUserQuery = `SELECT * FROM users WHERE username = ${escapedUsername}`
    console.log('findUserQuery is: ', findUserQuery)
    connection.query(findUserQuery, (findUserError, findUserResults) => {
      console.log('findUserResults is: ', findUserResults)
      if (findUserError || findUserResults.length !== 1) throw {statusCode: 500, message: 'Find user error'}
      const db = findUserResults[0]
      console.log('db is: ', db)
      if (db.extra1) {
        const hashedPassword = getPasswordFromFullPassword(db, enteredPassword)
        console.log('hashedPassword.fullHashedPassword is: ', hashedPassword.fullHashedPassword)
        console.log('db.extra1 is: ', db.extra1)
        if (hashedPassword.fullHashedPassword !== db.extra1) throw { statusCode: 403, message: 'Invalid credentials'}
        jwt.sign({ id: db.id, username: db.username }, secretKey, { expiresIn: '1 day'}, (err, token) => {
          if (err) throw { statusCode: 500, message: 'Error signing data'}
          console.log('signed token is: ', token, ' and error is: ', err)
          res.status(200).json({ token, id: db.id })
        })
      } else { // if there is no new password
        hashPasswordLegacy(password) // hash password using old legacy password scheme
          .then((legacyPassword) => {
            console.log('returned legacyPassword is: ', legacyPassword)
            if (db.password !== legacyPassword) throw { statusCode: 403, message: 'Invalid credentials'}
            const newHashedPassword = createHashedPassword(enteredPassword)
            const insertNewPasswordQuery = `UPDATE users SET extra1 = ${newHashedPassword} WHERE id = ${db.id} LIMIT 1`
            connection.query(insertNewPasswordQuery, (err, insertNewPasswordResults) => {
              if (insertNewPasswordResults.affectedRows !== 1) throw { statusCode: 500, message: 'Error inserting new password' }
              jwt.sign({ id: db.id, username: db.username }, secretKey, { expiresIn: '1 day'}, (err, token) => {
                if (err) throw { statusCode: 500, message: 'Problem signing data' }
                console.log('signed token is: ', token, ' and error is: ', err)
                res.status(200).json({ token, id: db.id })
              })                
            })
          })
      }
    })
  } catch (e) {
    next(e) // .json message: e})
  }
})

poolRouter.post('/users', upload.fields([]), (req, res, next) => {
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
        throw { statusCode: 500, message: 'Problem signing data'}
      }
      const hashedPassword = derivedKey.toString('base64').toString().replace(/\=/g,'')
      const fullHashedPassword = `$6$rounds=${rounds}$${salt}$${hashedPassword}`
      console.log('hashedPassword is: ', hashedPassword)
      console.log('fullHashedPassword is: ', fullHashedPassword)
      const findUserQuery = `SELECT id FROM users WHERE username = ${escapedUsername} LIMIT 1`
      // console.log('query is: ', findUserQuery)
      connection.query(findUserQuery, (error, results) => {
        if (error) throw Error(error)
        if (results.length > 0) res// .json message: 'Conflict with existing account' })
        const insertUserQuery = `INSERT INTO users SET username = ${escapedUsername}, extra1 = '${fullHashedPassword}'`
        // console.log('query is: ', insertUserQuery)
        connection.query(insertUserQuery, (error, results) => {
          if (error) throw Error(error)
          // console.log('results.affectedRows is: ', results.affectedRows)
          if (results.affectedRows === 1) res// .json username, id: results.insertId })
        })
      })
    })
  } catch (e) {
    next(e)
  }
})

module.exports = poolRouter