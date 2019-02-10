const networkRouter = require('express').Router()
const db = require('../config/database.js')
const Block = require('../models/blocks.js')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

networkRouter.get('/stats/:height,:range/:fields?', async (req, res) => {
  try {
    const queryOpts = {}
    const { height, range, fields } = req.params
    if (!height || !range) throw new Error('No height or range field specified')
    let max, min
    if (fields) {
      const fieldList = fields.split(',')
      if (fieldList.length !== 0) {
        queryOpts.attributes = fieldList
      }
    }
    max = parseInt(height)
    const rangeNumber = parseInt(range)
    min = max - rangeNumber
    queryOpts.where = {
      height: {
        [Op.gt]: min,
        [Op.lte]: max
      }
    }
    const blocks = await Block.findAll(queryOpts)
    res.json(blocks)
  } catch (e) {
    console.log('Error is: ', e)
  }
})

module.exports = networkRouter