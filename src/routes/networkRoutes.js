const networkRouter = require('express').Router()
// var cache = require('express-redis-cache')()
import { getConnection, mergeBlocks } from '../utils.js'
import regeneratorRuntime from 'regenerator-runtime'

// gets network data for a range of blocks
networkRouter.get('/stats/:height,:range/:fields?', async (req, res) => {
  try {
    const { height, range, fields } = req.params
    const connection = getConnection()
    const queryOpts = {}
    if (!height || !range) throw { statusCode: 400, message: 'No height or range field specified' }
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    const query = `SELECT grin_stats.difficulty, UNIX_TIMESTAMP(grin_stats.timestamp) as timestamp, grin_stats.height, gps.edge_bits, gps.gps
      FROM grin_stats JOIN gps ON grin_stats.height = gps.grin_stats_id
      WHERE grin_stats.height > ${connection.escape(min)} AND grin_stats.height <= ${connection.escape(max)}`
    // console.log('query is: ', query)
    connection.query(
      query,
      (error, results, field) => {
        console.log('error is: ', error)
        if (error) throw { statusCode: 500, message: 'Query error' }
        console.log('results is: ', results)
        const output = mergeBlocks(results)
        res.json(output)
      }
    )
  } catch (e) {
    next(e)
  }
})

// gets latest block
networkRouter.get('/block', async (req, res) => {
  try {
    const connection = getConnection()
    const query = `SELECT * FROM blocks WHERE height = (SELECT MAX(height) FROM blocks)`
    connection.query(query, (error, results, field) => {
      if (error) throw Error(error)
      // console.log('results is: ', results)
      res.json(...results)
    })
  } catch (e) {
    next(e)
  }
})

networkRouter.get('/blocks/:height,:range/:fields?', (req, res) => {
  try {
    const connection = getConnection()
    const { height, range, fields } = req.params

    if (!height || !range) throw { statusCode: 400, message: 'No height or range field specified' }
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    const query = `SELECT *, UNIX_TIMESTAMP(timestamp) as timestamp FROM blocks WHERE height > ${connection.escape(min)} AND height <= ${connection.escape(max)}`
    connection.query(query, (error, results) => {
      if (error) throw { statusCode: 500, message: 'Query error' }
      if (fields) {
        const fieldsList = fields.split(',')
        if (fieldsList.length > 0) {
          const filteredResults = results.map((item) => {
            let filteredItem = {}
            fieldsList.forEach(field => {
              filteredItem[field] = item[field]
            })
            return filteredItem
          })
          res.json(filteredResults)
          return
        }
      }
      res.json(results)
    })
  } catch (e) {
    next(e)
  }
})

module.exports = networkRouter