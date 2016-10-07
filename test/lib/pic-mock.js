
// npm modules
const debug = require('debug')('slugram:pic-mock')

// app modules
const Pic = require('../../model/pic.js')
const awsMocks = require('./aws-mocks.js')
const galleryMock = require('./gallery-mock.js')

module.exports = function(done){
  debug('creating mock pic')
  let examplePicData = {
    name: 'beach ball',
    desc: 'party with the tropics',
    created: new Date(),
    imageURI: awsMocks.uploadMock.Location,
    objectKey: awsMocks.uploadMock.Key,
  }

  galleryMock.call(this, err => {
    if (err) return done(err)
    examplePicData.userID = this.tempUser._id.toString()
    examplePicData.galleryID = this.tempGallery._id.toString()
    new Pic(examplePicData).save()
    .then( pic => {
      this.tempPic = pic
      done()
    })
    .catch(done)
  })
}
