const Sequelize = require('sequelize')

module.exports = new Sequelize('pool', 'root', 'root', {
  host: 'localhost',
  dialect: 'mysql'
})
