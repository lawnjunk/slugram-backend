'use strict'

const debug = require('debug')('slugram:query-middleware')

module.exports = function(req, res, next){
  debug('creating itempage queries')
  let itempage = 1 
  let itemoffset = 0 
  let itemcount = 100 
  let itemsort = 1
  if (!isNaN(Number(req.query.itempage))) itempage = Number(req.query.itempage)
  if (!isNaN(Number(req.query.itemoffset))) itemoffset = Number(req.query.itemoffset)
  if (!isNaN(Number(req.query.itemcount))) itemcount = Number(req.query.itemcount)
  if (req.query.itemsort === 'dsc') itemsort = -1
  if (req.query.itemsort === 'asc') itemsort = 1

  if (itempage < 1) itempage = 1
  if (itemoffset < 0) itemoffset = 0
  if (itemcount < 1) itemcount = 1
  if (itemcount > 250) itemcount = 250

  if (itempage > 1) 
    itemoffset =  (itempage - 1) * itemcount + itemoffset

  req.query.itempage = itempage
  req.query.itemoffset = itemoffset
  req.query.itemcount = itemcount
  req.query.itemsort = itemsort
  next()
}
