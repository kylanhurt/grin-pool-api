const workerRouter = require('express').Router()
const basicAuth = require('express-basic-auth')

import { getConnection, mergeBlocks, filterFields, limitRange, checkAuth } from '../utils.js'

workerRouter.get('/stats/:id/:height,:range/:fields?', checkAuth, (req, res) => {
  try {
    const connection = getConnection()
    const { height, range, fields } = req.params

    if (!height || !range) res.status(400).send('No height or range field specified')
    const max = parseInt(height)
    const rangeNumber = parseInt(range)
    const min = max - rangeNumber
    const query = `SELECT ps.*, gps.gps, gps.edge_bits, UNIX_TIMESTAMP(ps.timestamp) as timestamp
      FROM pool_stats AS ps JOIN gps ON ps.height = gps.pool_stats_id
      WHERE ps.height > ${connection.escape(min)} AND ps.height <= ${connection.escape(max)}`
    console.log('query is: ', query)
    connection.query(query, (error, results) => {
      if (error)res.status(500).send('Query error')
      if (fields) results = filterFields(fields, results)
      const output = mergeBlocks(results)
      res.json(output)
    })
  } catch (e) {
    res.status(500).send(e)
  }
})

workerRouter.get('/stat/:id/:fields?', checkAuth, (req, res) => {
  try {
    const connection = getConnection()
    const { id, fields } = req.params
    const escapedId = connection.escape(id)
    const query = `SELECT valid_shares, invalid_shares, stale_shares, total_valid_shares, total_invalid_shares, total_stale_shares
      FROM worker_stats WHERE user_id = ${escapedId} AND id = (SELECT max(id) FROM worker_stats WHERE user_id = ${escapedId}) LIMIT 1`
    console.log('query is: ', query)
    connection.query(query, (error, results) => {
      if (error) res.status(500).send(error)
      console.log('results are: ', results)
      let output = results
      if (fields) output = filterFields(fields, results)
      res.json(output)
    })
  } catch (e) {
    res.status(500).json({ message: e })
  }
})

workerRouter.get('/utxo/:id', checkAuth, (req, res) => {
  try {
    const connection = getConnection()
    const { id } = req.params
    const escapedId = connection.escape(id)
    const query = `SELECT * FROM pool_utxo WHERE user_id = ${escapedId} LIMIT 1`
    connection.query(query, (err, results) => {
      if (err) res.status(500).send('Query error')
      delete results.id
      res.json(results)
    })
  } catch (e) {
    res.status(500).send(e)
  }
})

workerRouter.get('/payment/:id', checkAuth, (req, res) => {
  try {
    const connection = getConnection()
    const { id } = req.params
    const escapedId = connection.escape(id)
    const query = `SELECT * FROM pool_payment WHERE user_id = ${escapedId}
      AND timestamp = max(SELECT timestamp FROM pool_payment
      WHERE user_id = ${escapedId}) LIMIT 1`
    connection.query(query, (err, result) => {
      if (err) res.status(500).end('Query error')
      delete result.id
      res.json({ result })
    })
  } catch (e) {
    res.status(500).json({ message: e })
  }
})

workerRouter.get('/payments/:id/:range', checkAuth, (req, res) => {
  try {
    const connection = getConnection()
    const { id, range } = req.params
    if (!range) res.status(400).send('No block range set')
    const escapedRange = connection.escape(parseInt(range))
    const escapedId = connection.escape(id)
    const query = `SELECT * FROM pool_payment WHERE user_id = ${escapedId} ORDER BY timestamp DESC LIMIT ${escapedRange}`
    connection.query(query, (err, results) => {
      if (err) res.status(500).send('Query error')
      delete results.id
      res.json({ results })
    })
  } catch (e) {
    res.status(500).json({ message: e })
  }
})

workerRouter.get('/estimate/payment/:id', checkAuth, (req, res) => {
  try {
    const { id } = req.body
    const connection = getConnection()
    const escapedId = connection.escape(id)
    const query = `SELECT locked FROM pool_utxo WHERE user_id = ${escapedId}
                  AND id = (SELECT max(id) from pool_utxo WHERE user_id = ${escapedId}) LIMIT 1`
    connection.query(query, (err, result) => {
      if (err) res.status(500).send('Query error')
      delete result.id
      res.json(result.locked)
    })
  } catch (e) {
    res.status(500).send(e)
  }
})

workerRouter.get('/estimate/payment/:id/:height', checkAuth, (req, res) => {
  try {
    const { height, id } = req.params
    const connection = getConnection()
    if (!height) res.status(400).send('No height or range field specified')
    const escapedId = connection.escape(id)
    const max = parseInt(height)
    const rangeNumber = 60
    const min = max - rangeNumber
    const query = `SELECT * FROM worker_stats JOIN gps ON worker_stats.id = gps.worker_stats_id
                  WHERE worker_stats.user_id = ${escapedId} AND worker_stats.height > ${min}`
    console.log('query is: ', query)
    connection.query(query, (err, results) => {
      if (err) res.status(500).end('Query error')
      res.json(results)
    })
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = workerRouter