const mysql = require('mysql')

export const getConnection = () => {
  return mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'root',
    database : 'pool'
  })
}

export const mergeBlocks = (results) => {
  const output = []
  results.forEach((resultsRow) => {
    const index = output.findIndex(outputRow => outputRow.height === resultsRow.height)
    // if it's a new row for the block
    if (index === -1) {
      // console.log('resultsRow is: ', resultsRow)
      output.push({
        ...resultsRow,
        gps: [
          {
            edge_bits: resultsRow.edge_bits,
            gps: resultsRow.gps
          }
        ]
      })
    } else {
      // console.log('in else clause, output is: ', output, ' and index is: ', index)
      output[index].gps.push({
        edge_bits: resultsRow.edge_bits,
        gps: resultsRow.gps
      })
    }
  })
  return output
}

export const filterFields = (fields, results) => {
  const fieldsList = fields.split(',')
  if (fieldsList.length > 0) {
    const filteredResults = results.map((item) => {
      let filteredItem = {}
      fieldsList.forEach(field => {
        filteredItem[field] = item[field]
      })
      return filteredItem
    })
    return filteredResults
  }
}