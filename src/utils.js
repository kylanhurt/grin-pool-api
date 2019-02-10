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
  let output = []
  results.forEach((resultsRow) => {
    const index = output.findIndex(outputRow => outputRow.height === resultsRow.height)
    if (index === -1) {
      output.push({ 
        difficulty: resultsRow.difficulty,
        timestamp: resultsRow.timestamp,
        height: resultsRow.height,
        gps: [
          {
            edge_bits: resultsRow.edge_bits,
            gps: resultsRow.gps
          }
        ]
      })
    } else {
      output[index].gps.push({
        edge_bits: resultsRow.edge_bits,
        gps: resultsRow.gps
      })
    }
  })
  return output
}