'use strict'

const debug = require('debug')('slugram:fuzzy-regex')

module.exports = function(input){
  debug(`creating fuzzy regex from ${input}`)
  let result = input.split('').join('.*')
  return new RegExp(`.*${result}.*`)
}
