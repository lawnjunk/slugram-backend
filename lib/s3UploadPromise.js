'use strict'

const AWS = require('aws-sdk')
const debug = require('debug')('slugram:s3-upload-promise')

const s3 = new AWS.S3()

module.exports = function s3UploadPromise(params){
  debug('uploading file to s3')
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      if (err) 
        return reject(err)
      resolve(s3data)
    })
  })
}
