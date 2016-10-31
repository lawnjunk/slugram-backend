'use strict'

const AWSMock = require('aws-sdk-mock')

module.exports = exports = {}

exports.uploadMock = { 
  ETag: '"5eefd06b5b384cc52f35a0c49414ea31"',
  VersionId: '_F6K4BKgNMBKeTvrPEd27rl_4qPQl9Hy',
  Location: 'https://slugram-assets.s3.amazonaws.com/cd52be0bc15dd9500e87d9afcf35c19e.png',
  key: 'cd52be0bc15dd9500e87d9afcf35c19e.png',
  Key: 'cd52be0bc15dd9500e87d9afcf35c19e.png',
  Bucket: 'slugram-assets',
}

AWSMock.mock('S3', 'upload', function(params, callback){
  if(params.ACL !== 'public-read')
    return callback(new Error('ACL must be public read'))
  if(params.Bucket !== process.env.AWS_BUCKET)
    return callback(new Error('Bucket must be slugram-assets'))
  if(!params.Key)
    return callback(new Error('requres Key'))
  if(!params.Body)
    return callback(new Error('requires body'))
  callback(null, exports.uploadMock)
})

exports.deleteMock = { 
  DeleteMarker: 'true',
  VersionId: 'lv9XPH0r.UfGZERuv3u7WwxkIzwPKP2d',
}

AWSMock.mock('S3', 'deleteObject', function(params, callback){
  if(params.Bucket !== process.env.AWS_BUCKET)
    return callback(new Error('Bucket must be slugram-assets'))
  if(!params.Key)
    return callback(new Error('requres Key'))
  callback(null, exports.deleteMock)
})


