'use strict'

// npm
const Router = require('express').Router
const jsonParser = require('body-parser').json()
const createError = require('http-errors')
const debug = require('debug')('slugram:gallery-route')

// app
const Gallery = require('../model/gallery.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const pageQueries = require('../lib/page-query-middleware.js')
const itemQueries = require('../lib/item-query-middleware.js')
const fuzzyQuery = require('../lib/find-fuzzy-query-gen.js')

// constants
const galleryRouter = module.exports = Router()

galleryRouter.post('/api/gallery', bearerAuth, jsonParser, function(req, res, next){
  debug('POST /api/gallery')
  req.body.userID = req.user._id
  req.body.username = req.user.username
  new Gallery(req.body).save()
  .then( gallery => res.json(gallery))
  .catch(next)
})


galleryRouter.get('/api/gallery/:id', bearerAuth, itemQueries,  function(req, res, next){
  debug('GET /api/gallery/:id')
  Gallery.findById(req.params.id)
  .populate({
    path: 'pics',
    options: {
      sort: {_id: req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .catch(err => Promise.reject(createError(400, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString())
      return Promise.reject(createError(401, 'invalid userid'))
    res.json(gallery)
  })
  .catch(next)
})

galleryRouter.put('/api/gallery/:id', bearerAuth, jsonParser, function(req, res, next){
  debug('PUT /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString()) 
      return Promise.reject(createError(401, 'not users gallery'))
    let options = { runValidators: true, new: true}
    return Gallery.findByIdAndUpdate(req.params.id, req.body, options)
  })
  .then(gallery => res.json(gallery))
  .catch(next)
})

galleryRouter.delete('/api/gallery/:id', bearerAuth, function(req, res, next){
  debug('DELETE /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString()) 
      return Promise.reject(createError(401, 'not users gallery'))
    return gallery.remove()
  })
  .then(() => res.sendStatus(204))
  .catch(next)
})

galleryRouter.get('/api/gallery', bearerAuth, pageQueries, itemQueries, function(req, res, next){
  debug('GET /api/gallery')

  let fields = ['name', 'desc']
  let query = fuzzyQuery(fields, req.query)
  query.userID = req.user._id.toString()
  Gallery.find(query)
  .populate({
    path: 'pics',
    options: {
      sort: {filed: '_id', test:  req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})

// public anyone can call
galleryRouter.get('/api/public/gallery', pageQueries, itemQueries, function(req, res, next){
  let fields = ['username', 'name', 'desc']
  let query = fuzzyQuery(fields, req.query)
  Gallery.find(query)
  .populate({
    path: 'pics',
    options: {
      sort: {filed: '_id', test:  req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})
