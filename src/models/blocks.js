const Sequelize = require('sequelize')
const db = require('../config/database.js')

const Block = db.define('blocks', {
  height: {
    type: Sequelize.BIGINT(20),
    primaryKey: true
  },
  hash: {
    type: Sequelize.STRING(64)
  },
  version: {
    type: Sequelize.SMALLINT(6)
  },
  previous: {
    type: Sequelize.STRING(64)
  },
  timestamp: {
    type: Sequelize.DATE
  },
  output_root: {
    type: Sequelize.STRING(64)
  },
  range_proof_root: {
    type: Sequelize.STRING(64)
  },
  kernel_root: {
    type: Sequelize.STRING(64)
  },
  nonce: {
    type: Sequelize.STRING(20)
  },
  edge_bits: {
    type: Sequelize.SMALLINT(6)
  },
  total_difficulty: {
    type: Sequelize.BIGINT(20)
  },
  secondary_scaling: {
    type: Sequelize.BIGINT(20)
  },
  num_inputs: {
    type: Sequelize.INTEGER(11)
  },
  num_outputs: {
    type: Sequelize.INTEGER(11)
  },
  num_kernels: {
    type: Sequelize.INTEGER(11)
  },
  fee: {
    type: Sequelize.BIGINT(20)
  },
  lock_height: {
    type: Sequelize.BIGINT(20)
  },
  total_kernel_offset: {
    type: Sequelize.STRING(64)
  },
  state: {
    type: Sequelize.STRING(64)
  }
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = Block