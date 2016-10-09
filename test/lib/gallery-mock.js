'use strict'

const debug = require('debug')('slugram:gallery-mock')
const userMock = require('./user-mock.js')
const Gallery = require('../../model/gallery.js')


module.exports = function(done){
  debug('create mock gallery')
  let exampleGallery = {
    name: 'beach adventure',
    desc: 'not enough sun screan ouch',
  }
  userMock.call(this, err => {
    if (err) 
      return done(err)
    exampleGallery.userID = this.tempUser._id.toString()
    exampleGallery.username = this.tempUser.username
    new Gallery(exampleGallery).save()
    .then( gallery => {
      this.tempGallery = gallery
      done()
    })
    .catch(done)
  })
}
