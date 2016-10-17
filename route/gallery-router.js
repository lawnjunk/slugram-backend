'use strict'

// npm
const AWS = require('aws-sdk')
const Router = require('express').Router
const jsonParser = require('body-parser').json()
const createError = require('http-errors')
const debug = require('debug')('slugram:gallery-route')

// app
const Pic = require('../model/pic.js')
const Gallery = require('../model/gallery.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const pageQueries = require('../lib/page-query-middleware.js')
const itemQueries = require('../lib/item-query-middleware.js')
const fuzzyQuery = require('../lib/fuzzy-query.js')

// constants
const s3 = new AWS.S3()
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
  let tempGallrey = null
  Gallery.findById(req.params.id)
  .populate('pics')
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery => {
    tempGallrey = gallery
    if (gallery.userID.toString() !== req.user._id.toString()) 
      return Promise.reject(createError(401, 'not users gallery'))
    let deletePhotos = []

    gallery.pics.forEach(pic => {
      let params = {
        Bucket: process.env.AWS_BUCKET,
        Key: pic.objectKey,
      }
      deletePhotos.push(Pic.findByIdAndRemove(pic._id))
      deletePhotos.push(s3.deleteObject(params).promise())
    })

    return Promise.all(deletePhotos)
  })
  .then(() => tempGallrey.remove()) 
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
      sort: {_id: req.query.itemsort},
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
  console.log('req.query.itemcount', req.query.itemcount)
  Gallery.find(query)
  .populate({
    path: 'pics',
    options: {
      sort: {_id: req.query.itemsort},
      limit: req.query.itemcount,
      skip: req.query.itemoffset,
    },
  })
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(galleries => res.json(galleries))
  .catch(next)
})
