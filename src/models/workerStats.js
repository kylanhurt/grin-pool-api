const Sequelize = require('sequelize')
const db = require('../config/database.js')

const WorkerStat = db.define('worker_stats', {
  timestamp: {
    type: Sequelize.DATE
  },
  height: {
    type: Sequelize.BIGINT(20)
  },
  valid_shares: {
    type: Sequelize.INTEGER(11)
  },
  invalid_shares: {
    type: Sequelize.INTEGER(11)
  },
  stale_shares: {
    type: Sequelize.INTEGER(11)
  },
  total_valid_shares: {
    type: Sequelize.BIGINT(20)
  },
  total_invalid_shares: {
    type: Sequelize.BIGINT(20)
  },
  total_stale_shares: {
    type: Sequelize.BIGINT(20)
  },
  dirty: {
    type: Sequelize.TINYINT(1)
  },
  user_id: { // foreign key
    type: Sequelize.INTEGER(11)
  }
}, {
    timestamps: false,
    freezeTableName: true,
    underscored: true
})

WorkerStat.belongsTo(User)

module.exports = WorkerStat