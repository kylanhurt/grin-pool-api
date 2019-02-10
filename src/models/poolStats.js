const Sequelize = require('sequelize')
const db = require('../config/database.js')

const PoolStat = db.define('pool_stats', {
  height: {
    type: Sequelize.BIGINT(20),
    primaryKey: true
  },
  timestamp: {
    type: Sequelize.DATE
  },
  active_miners: {
    type: Sequelize.INTEGER(11)
  },
  shares_processed: {
    type: Sequelize.INTEGER(11)
  },
  total_blocks_found: {
    type: Sequelize.INTEGER(11)
  },
  total_shares_processed: {
    type: Sequelize.BIGINT(20)
  },
  dirty: {
    type: Sequelize.SMALLINT(1)
  }  
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = PoolStat