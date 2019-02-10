const networkRouter = require('express').Router()
const db = require('../config/database.js')
import { getConnection, mergeBlocks } from '../utils.js'

// gets network data for a range of blocks
networkRouter.get('/stats/:height,:range/:fields?', async (req, res) => {
  try {
    const { height, range, fields } = req.params
    const connection = getConnection()
    const queryOpts = {}
    if (!height || !range) throw new Error('No height or range field specified')
    let max, min
    max = parseInt(height)
    const rangeNumber = parseInt(range)
    min = max - rangeNumber
    if (fields) {
      const fieldList = fields.split(',')
      if (fieldList.length !== 0) {
        queryOpts.attributes = fieldList
      }
    }
    const query = `SELECT grin_stats.difficulty, UNIX_TIMESTAMP(grin_stats.timestamp) as timestamp, grin_stats.height, gps.edge_bits, gps.gps
      FROM grin_stats JOIN gps ON grin_stats.height = gps.grin_stats_id
      WHERE grin_stats.height > ${connection.escape(min)} AND grin_stats.height <= ${connection.escape(max)}`
    // console.log('query is: ', query)
    connection.query(
      query,
      (error, results, field) => {
        if (error) throw Error
        console.log('results is: ', results)
        const output = mergeBlocks(results)
        res.json(output)
      }
    )
  } catch (e) {
    console.log('Error is: ', e)
  }
})

// gets latest block
networkRouter.get('/block', async (req, res) => {
  try {
    const { height, range, fields } = req.params 
    const queryOpts = {}
    if (!height || !range) throw new Error('No height or range field specified')
    let max, min
    max = parseInt(height)
    const rangeNumber = parseInt(range)
    min = max - rangeNumber    
    queryOpts.where = {
      height: {
        [Op.gt]: min,
        [Op.lte]: max
      }
    }
    if (fields) {
      const fieldList = fields.split(',')
      if (fieldList.length !== 0) {
        queryOpts.attributes = fieldList
      }
    }
    const blocks = await Block.findAll(queryOpts)
    res.json(blocks)
  } catch (e) {
    console.log('Error is: ', e)
  }
})

module.exports = networkRouter