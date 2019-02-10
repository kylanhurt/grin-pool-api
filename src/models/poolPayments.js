const Sequelize = require('sequelize')
const db = require('../config/database.js')
const user

const PoolPayment = db.define('pool_payment', {
  timestamp: {
    type: Sequelize.DATE
  },
  height: {
    type: Sequelize.BIGINT(20)
  },
  address: {
    type: Sequelize.STRING(1024)
  },
  amount: {
    type: Sequelize.BIGINT(20)
  },
  method: {
    type: Sequelize.STRING(64)
  },
  fee: {
    type: Sequelize.BIGINT(20)
  },
  failure_count: {
    type: Sequelize.INTEGER(11)
  },
  invoked_by: {
    type: Sequelize.STRING(16)
  },
  state: {
    type: Sequelize.STRING(16)
  },
  tx_data: {
    type: Sequelize.STRING(4096)
  } /*,
  user_id: {
    type: Sequelize.INTEGER(11)
  } */
}, {
    timestamps: false,
    freezeTableName: true,
    underscored: true
})

PoolPayment.belongsTo(User)

module.exports = PoolPayment