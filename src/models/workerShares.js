const Sequelize = require('sequelize')
const db = require('../config/database.js')
const User = require('./users.js')

const WorkerShare = db.define('worker_shares', {
  height: {
    type: Sequelize.BIGINT(20)
  },
  timestamp: {
    type: Sequelize.DATE
  },
  user_id: {
    type: Sequelize.INTEGER(11)
  }
}, {
    timestamps: false,
    freezeTableName: true,
    underscored: true
})

WorkerShare.belongsTo(User)

module.exports = WorkerShare