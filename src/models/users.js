const Sequelize = require('sequelize')
const db = require('../config/database.js')

const User = db.define('users', {
  username: {
    type: Sequelize.STRING(64)
  },
  password_hash: {
    type: Sequelize.STRING(128)
  },
  email: {
    type: Sequelize.STRING(255)
  },
  settings: {
    type: Sequelize.STRING(4096)
  },
  extra1: {
    type: Sequelize.STRING(255)
  },
  extra2: {
    type: Sequelize.STRING(255)
  },
  extra3: {
    type: Sequelize.STRING(255)
  }
}, {
    timestamps: false,
    freezeTableName: true
})

module.exports = User