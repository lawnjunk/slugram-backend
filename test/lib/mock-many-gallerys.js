'use strict'

const debug = require('debug')('slugram:gallery-mock')
const userMock = require('./user-mock.js')
const Gallery = require('../../model/gallery.js')
const lorem = require('lorem-ipsum')

module.exports = function(count, done){
  debug(`mock ${count}gallerys`)
  userMock.call(this, err => {
    if (err) return done(err)
    let galleryMocks = []
    let userID = this.tempUser._id.toString()
    let username = this.tempUser.username
    for(var i=0; i<count; i++){
      galleryMocks.push(mockAGallery(userID, username))
    }
    Promise.all(galleryMocks)
    .then(tempGallerys => {
      this.tempGallerys = tempGallerys
      done()
    })
    .catch(done)
  })
}

function mockAGallery(userID, username){
  let name = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let exampleGallery = { name, desc , userID, username}
  return new Gallery(exampleGallery).save()
}
