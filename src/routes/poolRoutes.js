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
poolRouter.get('/stats/:height,:range/:fields?', (req, res) => {
  try {
    const connection = getConnection()
    const { height, range, fields } = req.params

    if (!height || !range) res.status(400).send('No height or range field specified')
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    if (range > max || max === 0) res.status(400).send('Block range incorrect')
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
    res.status(500).send(e)
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
    res.status(500).send(e)
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
    res.status(500).send(e)
  }
})

poolRouter.get('/users', (req, res) => {
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
      if (findUserError || findUserResults.length !== 1) res.status(500).send('Find user error') // .json message: 'Error finding user'})
      const db = findUserResults[0]
      console.log('db is: ', db)
      if (db.extra1) {
        const hashedPassword = getPasswordFromFullPassword(db, enteredPassword)
        console.log('hashedPassword.fullHashedPassword is: ', hashedPassword.fullHashedPassword)
        console.log('db.extra1 is: ', db.extra1)
        if (hashedPassword.fullHashedPassword !== db.extra1) res.status(403).send('Invalid credentials') // .json message: 'Invalid credentials'})
        jwt.sign({ id: db.id, username: db.username }, secretKey, { expiresIn: '1 day'}, (err, token) => {
          if (err) res.status(500).send('Error signing data') // .json message: 'Error signing data'})
          console.log('signed token is: ', token, ' and error is: ', err)
          res.status(200).json({ token, id: db.id })
        })
      } else { // if there is no new password
        hashPasswordLegacy(password) // hash password using old legacy password scheme
          .then((legacyPassword) => {
            console.log('returned legacyPassword is: ', legacyPassword)
            if (db.password !== legacyPassword) res.status(403).send('Invalid credentials') //.json({ message: 'Invalid credentials'})
            const newHashedPassword = createHashedPassword(enteredPassword)
            const insertNewPasswordQuery = `UPDATE users SET extra1 = ${newHashedPassword} WHERE id = ${db.id} LIMIT 1`
            connection.query(insertNewPasswordQuery, (err, insertNewPasswordResults) => {
              if (insertNewPasswordResults.affectedRows !== 1) res.status(500).send('Error inserting new password')
              jwt.sign({ id: db.id, username: db.username }, secretKey, { expiresIn: '1 day'}, (err, token) => {
                if (err) res.status(500).send('Problem signing data') // .json message: 'Problem signing data'})
                console.log('signed token is: ', token, ' and error is: ', err)
                res.status(200).json({ token, id: db.id })
              })                
            })
          })
      }
    })
  } catch (e) {
    res.status(500).send(e) // .json message: e})
  }
})

/*
    reHashPassword(username, password)
      .then(hashedPassword => {
        console.log('hashedPassword is: ', hashedPassword)
        const fullHashedPassword = hashedPassword.fullHashedPassword
        console.log('(users) fullHashedPassword is: ', fullHashedPassword)  
*/

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
        res.status(500).send(err)
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
    console.log('error is: ', e)
    res.status(500).send(e)// .json message: e})
  }
})

module.exports = poolRouter