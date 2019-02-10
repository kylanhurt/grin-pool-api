const Sequelize = require('sequelize')
const db = require('../config/database.js')
const User = require('./users.js')

const PoolUtxo = db.define('pool_utxo', {
  address: {
    type: Sequelize.STRING(1024)
  },
  method: {
    type: Sequelize.STRING(64)
  },
  locked: {
    type: Sequelize.INTEGER(1)
  },
  amount: {
    type: Sequelize.BIGINT(20)
  },
  failure_count: {
    type: Sequelize.INTEGER(11)
  },
  last_try: {
    type: Sequelize.DATE
  },
  last_success: {
    type: Sequelize.DATE
  },
  total_amount: {
    type: Sequelize.BIGINT(20)
  } /*,
  user_id: { // foreign key
    type: Sequelize.INTEGER(11)
  }, */
}, {
    timestamps: false,
    freezeTableName: true,
    underscored: true
})

PoolUtxo.belongsTo(User)

module.exports = PoolUtxo