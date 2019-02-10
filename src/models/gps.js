const Sequelize = require('sequelize')
const db = require('../config/database.js')

const Gps = db.define('gps', {
  edge_bits: {
    type: Sequelize.INTEGER(11)
  },
  gps: {
    type: Sequelize.FLOAT()
  },
  grin_stats_id: {
    type: Sequelize.BIGINT(20)
  },
  pool_stats_id: {
    type: Sequelize.BIGINT(20)
  },
  worker_stats_id: {
    type: Sequelize.INTEGER(11)
  },
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = GrinStat