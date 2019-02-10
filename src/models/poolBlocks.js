const Sequelize = require('sequelize')
const db = require('../config/database.js')
const User = require('./users.js')

const PoolBlock = db.define('pool_blocks', {
  height: {
    type: Sequelize.BIGINT(20),
    primaryKey: true
  },
  hash: {
    type: Sequelize.STRING(64)
  },
  nonce: {
    type: Sequelize.STRING(20)
  },
  actual_difficulty: {
    type: Sequelize.BIGINT(20)
  },
  net_difficulty: {
    type: Sequelize.BIGINT(20)
  },
  timestamp: {
    type: Sequelize.DATE
  },
  state: {
    type: Sequelize.STRING(20)
  }/* ,
  found_by: {
    type: Sequelize.INTEGER(11)
  } */
}, {
    timestamps: false,
    freezeTableName: true
})

PoolBlock.belongsTo(User, { foreignKey: 'found_by' })

module.exports = PoolBlock