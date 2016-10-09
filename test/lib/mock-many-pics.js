
'use strict'

const Pic = require('../../model/pic.js')
const debug = require('debug')('slugram:gallery-mock')
const galleryMock = require('./gallery-mock.js')
const lorem = require('lorem-ipsum')

// create a uesr, token, pass, gallery
// create a bunch of pics
// add pic ids to gallery
// save gallery
// done
module.exports = function(count, done){
  debug(`mock ${count}gallerys`)
  galleryMock.call(this, err => {
    if (err) return done(err)
    let picMocks = []
    let userID = this.tempUser._id.toString()
    let username = this.tempUser.username
    for(var i=0; i<count; i++){
      picMocks.push(mockAPic(userID, username))
    }
    Promise.all(picMocks)
    .then(tempPics => {
      tempPics.forEach(pic => {
        let picID = pic._id.toString()
        this.tempGallery.pics.push(picID)
      })
      this.tempPics = tempPics
      return this.tempGallery.save()
    })
    .then(() => done())
    .catch(done)
  })
}

function mockAPic(userID, username){
  let name = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let uri = lorem({count: 5, units: 'word'}).split(' ').join('-')
  let objectKey = lorem({count: 5, units: 'word'}).split(' ').join('')
  let imageURI = `https://${uri}/${objectKey}`
  let examplePicData = {
    name,
    desc,
    userID,
    username,
    imageURI,
    objectKey,
    created: new Date(),
  }
  return new Pic(examplePicData).save()
}
