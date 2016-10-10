'use strict'

const expect = require('chai').expect
const fuzzyQuery = require('../lib/fuzzy-query.js')

describe('testing module fuzzy-query', function(){
  describe('with valid input', function(){
    let fields = ['name', 'duck']
    let query = {
      name: 'slug',
      duck: 'quack',
    }

    it('should return a mongo query', done => {
      let result = fuzzyQuery(fields, query)
      console.log('result', result)
      expect(result.name['$regex'].toString()).to.equal('/.*s.*l.*u.*g.*/')
      expect(result.duck.$regex.toString()).to.equal('/.*q.*u.*a.*c.*k.*/')
      done()
    })
  })

  describe('with bad array', function(){
    let fields = '' 
    let query = {
      name: 'slug',
      duck: 'quack',
    }

    it('should return a mongo query', done => {
      let result = fuzzyQuery(fields, query)
      expect(JSON.stringify(result)).to.equal('{}')
      done()
    })
  })

  describe('with bad array', function(){
    let fields = []
    let query = ''

    it('should return a mongo query', done => {
      let result = fuzzyQuery(fields, query)
      expect(JSON.stringify(result)).to.equal('{}')
      done()
    })
  })
})
