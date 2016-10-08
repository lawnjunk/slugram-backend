'use strict'

require('./lib/test-env.js')
require('./lib/aws-mocks.js')

const expect = require('chai').expect
const errorMiddleware = require('../lib/error-middleware.js')
const createError = require('http-errors')

function mockRes (){
  let res = {}
  res.status = function(num){
    this.statusCode = num
    return this
  }
  res.send = function(data){
    this.text = data.toString()
    return this
  }
  res.json = function(data){
    this.body = data
    return this
  }

  return res
}

describe('testing errorMiddleware', function(){
  describe('with vanilla Error', function(){
    let res
    before(() => res = mockRes())
    it('should respond with status 500', done => {
      let err = new Error('ordinary error')
      errorMiddleware(err, {}, res, () => {
        expect(res.statusCode).to.equal(500)
        expect(res.text).to.equal('InternalServerError')
        done()
      })
    })
  })

  describe('http-errors error', function(){
    let res
    before(() => res = mockRes())
    it('should respond with status 418', done => {
      let err = createError(418, 'example error message')
      errorMiddleware(err, {}, res, () => {
        expect(res.statusCode).to.equal(418)
        expect(res.text).to.equal('ImATeapotError')
        done()
      })
    })
  })

  describe('with ValidationError', function(){
    let res
    before(() => res = mockRes())
    it('should respond with status 418', done => {
      let err = new Error('You should read the docs')
      err.name = 'ValidationError'
      errorMiddleware(err, {}, res, () => {
        expect(res.statusCode).to.equal(400)
        expect(res.text).to.equal('BadRequestError')
        done()
      })
    })
  })

  describe('with MongoError && err.message = "E11000 duplicate"', function(){
    let res
    before(() => res = mockRes())
    it('should respond with status 409', done => {
      let err = new Error('E11000 duplicate')
      err.name = 'MongoError'
      errorMiddleware(err, {}, res, () => {
        expect(res.statusCode).to.equal(409)
        expect(res.text).to.equal('ConflictError')
        done()
      })
    })
  })
})


