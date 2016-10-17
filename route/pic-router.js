'use strict'

// node module
const fs = require('fs')
const path = require('path')

// npm module
const del = require('del')
const AWS = require('aws-sdk')
const multer = require('multer')
const createError = require('http-errors')
const debug = require('debug')('sulgram:pic-router')

// app module
const Pic = require('../model/pic.js')
const Gallery = require('../model/gallery.js')
const fuzzyQuery = require('../lib/fuzzy-query.js')
const bearerAuth = require('../lib/bearer-auth-middleware.js')
const pageQuery = require('../lib/page-query-middleware.js')

// Use bluebird implementation of Promise
// will add a .promise() to AWS.Request 
AWS.config.setPromisesDependency(require('bluebird'))

// module constants
const s3 = new AWS.S3()
const dataDir =`${__dirname}/../data` 
const upload = multer({dest: dataDir })
const s3UploadPromise = require('../lib/s3-upload-promise.js')
const picRouter = module.exports = require('express').Router()


picRouter.post('/api/gallery/:galleryID/pic', bearerAuth, upload.single('file'), function(req, res, next){
  debug('POST /api/gallery/:galleryID/pic')
  if(!req.file)
    return next(createError(400, 'no file found'))

  let ext = path.extname(req.file.originalname) // '.png' | '.gif' | '.tar.gz'

  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path),
  }

  // first check that the gallery exists
  // then upload image
  // remove the image that multer stored on the local disk
  // then store monogo Pic
  // then respond to user

  let tempGallery, tempPic
  Gallery.findById(req.params.galleryID)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(gallery  => {
    tempGallery = gallery
    return s3UploadPromise(params)// IF FAILS 500 ERROR
  })  
  .catch(err => err.status ? Promise.reject(err) : Promise.reject(createError(500, err.message)))
  .then(s3data => {
    del([`${dataDir}/*`])
    let picData = {
      name: req.body.name,
      username: req.user.username,
      desc: req.body.desc,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userID: req.user._id,
    }
    return new Pic(picData).save()
  })
  .then(pic => {
    tempPic = pic
    tempGallery.pics.push(pic._id)
    return tempGallery.save()
  })
  .then(() => res.json(tempPic))
  .catch(err => {
    del([`${dataDir}/*`])
    next(err)
  })
})

picRouter.delete('/api/gallery/:galleryID/pic/:picID', bearerAuth, function(req, res, next){
  debug('DELETE /api/gallery/:galleryID/pic/:picID')


  //check that the pic exists if not 404
  //make sure there userID matches the pic.userID if not 401
  //check that gallery id is correct if not 404
  //remove the picID from the gallery 
  //delete the picture from aws
  //delete the pic from mongo
  //respond to the client
  let tempPic
  Pic.findById(req.params.picID) // 404
  .then( pic => {
    if(pic.userID.toString() !== req.user._id.toString())
      return Promise.reject(createError(401, 'user not authtorized to delete this pic'))
    tempPic = pic
    return Gallery.findById(req.params.galleryID) // 404
  })
  .catch(err => err.status? Promise.reject(err) : Promise.reject(createError(404, err.message))) // if no pic or gal found
  .then( gallery => { 
    gallery.pics = gallery.pics.filter( id => {
      if (id === req.params.picID) return false
      return true
    })
    return gallery.save() // 500 error
  })
  .then(() => {
    let params = {
      Bucket: process.env.AWS_BUCKET,
      Key: tempPic.objectKey,
    }
    return s3.deleteObject(params).promise() // 500 error
  })
  .then(() => {
    return Pic.findByIdAndRemove(req.params.picID) //500 
  })
  .then(() => res.sendStatus(204))
  .catch(next)
})

picRouter.get('/api/public/pic', pageQuery, function(req, res, next){
  let fields = ['username', 'name', 'desc']
  let query = fuzzyQuery(fields, req.query)

  Pic.find(query)
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(pics => res.json(pics))
  .catch(next)
})

 // this route is private and only returns a users pictures
picRouter.get('/api/pic', bearerAuth, pageQuery, function(req, res, next){
  let fuzzyFields = [ 'name', 'desc' ]
  let query = fuzzyQuery(fuzzyFields, req.query)
  query.userID = req.user._id.toString() 
  Pic.find(query)
  .sort({_id: req.query.sort}).skip(req.query.offset).limit(req.query.pagesize)
  .then(pics => res.json(pics))
  .catch(next)
}) 

