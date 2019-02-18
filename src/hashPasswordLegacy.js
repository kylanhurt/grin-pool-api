const spawn = require('child_process').spawn
const ps = require('python-shell')

const hashPasswordLegacy = (password) => {
  const options = {
    scriptPath: '../mwgrinpool/grin-py/',
    pythonOptions: ['-u'],
    args: [password]
  }
  return new Promise ((resolve, reject) => {
    ps.PythonShell.run('hashPassword.py', options, (error, results) => {
      if (error) reject(errorValue)
      resolve(results[0])
    })
  })
}

module.exports = hashPasswordLegacy