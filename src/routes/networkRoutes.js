const networkRouter = require('express').Router()
const db = require('../config/database.js')
const Block = require('../models/blocks.js')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

// gets network data for a range of blocks
networkRouter.get('/stats/:height,:range/:fields?', async (req, res) => {
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