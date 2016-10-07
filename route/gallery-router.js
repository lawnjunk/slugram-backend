'use strict'

// npm
const Router = require('express').Router
const jsonParser = require('body-parser').json()
const createError = require('http-errors')
const debug = require('debug')('slugram:gallery-route')

// app
const Gallery = require('../model/gallery.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')

// constants
const galleryRouter = module.exports = Router()

galleryRouter.post('/api/gallery', bearerAuth, jsonParser, function(req, res, next){

  debug('POST /api/gallery')
  req.body.userID = req.user._id
  new Gallery(req.body).save()
  .then( gallery => res.json(gallery))
  .catch(next)
})


galleryRouter.get('/api/gallery/:id', bearerAuth, function(req, res, next){
  debug('GET /api/gallery/:id')
  Gallery.findById(req.params.id)
  .catch(err => Promise.reject(createError(400, err.message)))
  .then(gallery => {
    if (gallery.userID.toString() !== req.user._id.toString())
      return Promise.reject(createError(401, 'invalid userid'))
    res.json(gallery)
  })
  .catch(next)
})
