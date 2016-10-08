'use strict'

const debug = require('debug')('slugram:query-middleware')

module.exports = function(req, res, next){
  debug('creating page queries')
  let page = 1 
  let offset = 0 
  let pagesize = 50 
  if (!isNaN(Number(req.query.page))) page = Number(req.query.page)
  if (!isNaN(Number(req.query.offset))) offset = Number(req.query.offset)
  if (!isNaN(Number(req.query.pagesize))) pagesize = Number(req.query.pagesize)

  if (page < 1) page = 1
  if (offset < 0) offset = 0
  if (pagesize < 1) pagesize = 1
  if (pagesize > 250) pagesize = 250

  req.query.page = page
  req.query.offset = offset
  req.query.pagesize = pagesize
  next()
}
