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
const bearerAuth = require('../lib/bearer-auth-middleware.js')

// Use bluebird implementation of Promise
// will add a .promise() to AWS.Request 
AWS.config.setPromisesDependency(require('bluebird'))

// module constants
const s3 = new AWS.S3()
const dataDir =`${__dirname}/../data` 
const upload = multer({dest: dataDir })
const picRouter = module.exports = require('express').Router()

function s3UploadPromise(params){
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      if (err) 
        return reject(err)
      resolve(s3data)
    })
  })
}

picRouter.post('/api/gallery/:galleryID/pic', bearerAuth, upload.single('image'), function(req, res, next){
  debug('POST /api/gallery/:galleryID/pic')
  if(!req.file)
    return next(createError(400, 'no file found'))
  if(!req.file.path)
    return next(createError(500, 'file was not saved'))

  let ext = path.extname(req.file.originalname) // '.png' | '.gif' | '.tar.gz'

  let params = {
    ACL: 'public-read',
    Bucket: 'slugram-assets',
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path),
  }

  // first check that the gallery exists
  // then upload image
  // remove the image that multer stored on the local disk
  // then store monogo Pic
  // then respond to user

  Gallery.findById(req.params.galleryID)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then(() => s3UploadPromise(params))  // IF FAILS 500 ERROR
  .catch(err => err.status ? Promise.reject(err) : Promise.reject(createError(500, err.message)))
  .then(s3data => {
    del([`${dataDir}/*`])
    let picData = {
      name: req.body.name,
      desc: req.body.desc,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userID: req.user._id,
      galleryID: req.params.galleryID,
    }
    return new Pic(picData).save()
  })
  .then(pic => res.json(pic))
  .catch(err => {
    del([`${dataDir}/*`])
    next(err)
  })
})

picRouter.delete('/api/gallery/:galleryID/pic/:picID', bearerAuth, function(req, res, next){
  debug('DELETE /api/gallery/:galleryID/pic/:picID')

  //check that the pic exists if not 404
  //check that gallery id is correct if not 400 
  //make sure there userID matches the pic.userID if not 401
  //delete the picture from aws
  //delete the pic from mongo
  //respond to the client
  Pic.findById(req.params.picID)
  .catch(err => Promise.reject(createError(404, err.message)))
  .then( pic => {
    if(pic.galleryID.toString() !== req.params.galleryID)
      return Promise.reject(createError(400, 'bad request wrong gallery'))
    if(pic.userID.toString() !== req.user._id.toString())
      return Promise.reject(createError(401, 'user not authtorized to delete this pic'))
    let params = {
      Bucket: 'slugram-assets',
      Key: pic.objectKey,
    }
    return s3.deleteObject(params).promise()
  })
  .catch(err => err.status ? Promise.reject(err) : Promise.reject(createError(500, err.message)))
  .then(() => {
    return Pic.findByIdAndRemove(req.params.picID)
  })
  .then(() => res.sendStatus(204))
  .catch(next)
})



