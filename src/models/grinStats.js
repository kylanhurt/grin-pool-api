const Sequelize = require('sequelize')
const db = require('../config/database.js')

const GrinStat = db.define('grin_stats', {
  height: {
    type: Sequelize.BIGINT(20),
    primaryKey: true
  },
  timestamp: {
    type: Sequelize.DATE
  },
  difficulty: {
    type: Sequelize.BIGINT(20)
  }
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = GrinStat