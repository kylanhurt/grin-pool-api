process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()
const server = require('../index.js')

chai.use(chaiHttp)
//Our parent block
describe('networkRoutes return correct info', () => {
  describe('/GET network stats for range', () => {
    it('it should return valid network data', (done) => {
      chai.request(server)
        .get('/grin/stats/2500,2/')
        .end((err, res) => {
            console.log('res is: ', res.body, ' and err is: ', err)          
            res.should.have.status(200)
            res.body.should.be.a('array')
            res.body.should.be.eql(
              [ { difficulty: 562237172,
                  timestamp: 1547760044,
                  height: 2499,
                  edge_bits: 29,
                  gps: [ { edge_bits: 29, gps: 365919 }, { edge_bits: 31, gps: 4959.25 } ] },
                { difficulty: 567986979,
                  timestamp: 1547760076,
                  height: 2500,
                  edge_bits: 29,
                  gps: [ { edge_bits: 29, gps: 370043 }, { edge_bits: 31, gps: 5009.97 } ] } ]              
            )
            res.body.length.should.be.eql(2)
          done()
        })
    })
  })
})