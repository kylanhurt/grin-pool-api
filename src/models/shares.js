const Sequelize = require('sequelize')
const db = require('../config/database.js')
const WorkerShare = require('./workerShares.js')

const Share = db.define('shares', {
  edge_bits: {
    type: Sequelize.INTEGER(11)
  },
  difficulty: {
    type: Sequelize.BIGINT(20)
  },
  valid: {
    type: Sequelize.INTEGER(11)
  },
  invalid: {
    type: Sequelize.INTEGER(11)
  },
  stale: {
    type: Sequelize.INTEGER(11)
  }
}, {
    timestamps: false,
    freezeTableName: true
})

Share.belongsTo(WorkerShare, { foreignKey: 'parent_id' })

module.exports = Share