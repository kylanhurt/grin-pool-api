const workerRouter = require('express').Router()
const basicAuth = require('express-basic-auth')
// var cache = require('express-redis-cache')()
import { getConnection, mergeBlocks, filterFields, limitRange } from '../utils.js'

// gets network data for a range of blocks
workerRouter.get('/stats/:id/:height,:range/:fields?', (req, res) => {
  try {
    basicAuth({
      
    })
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

module.exports = workerRouter