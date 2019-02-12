const poolRouter = require('express').Router()
// var cache = require('express-redis-cache')()
import { getConnection, mergeBlocks, filterFields, limitRange } from '../utils.js'

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
      if (error) throw Error
      if (fields) results = filterFields(fields, results)
      const output = mergeBlocks(results)
      res.json(output)
    })
  } catch (e) {
    console.log('Error is: ', e)
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
      if (error) throw Error
      res.json(...results)      
    })
  } catch (e) {
    console.log('Error is: ', e)
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
      if (error) throw Error
      res.json(results)
    })
  } catch (error) {
    console.log('Error is: ', e)
  }
})

poolRouter.post('/users', (req, res) => {
  console.log('req.body is: ', req.body)
})

module.exports = poolRouter