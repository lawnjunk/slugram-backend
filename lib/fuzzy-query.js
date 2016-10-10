'use strict'

let debug = require('debug')('slugram:fuzzy-query')

let fuzzyRegex = require('./fuzzy-regex.js')

module.exports = function(fieldnames, reqQuerys){
  debug('generating fuzzy queries')
  if (!Array.isArray(fieldnames))
    return {}
  if (typeof reqQuerys !== 'object')
    return {}
  let query = {}
  fieldnames.forEach(val => {
    if (reqQuerys[val]) 
      query[val] = {$regex: fuzzyRegex(reqQuerys[val])}
  })
  return query
}
