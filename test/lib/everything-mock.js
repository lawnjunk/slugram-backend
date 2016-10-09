'use strict'

const Promise = require('bluebird')
const lorem = require('lorem-ipsum')
const debug = require('debug')('slugram:gallery-mock-everything')

const Pic = require('../../model/pic.js')
const User = require('../../model/user.js')
const Gallery = require('../../model/gallery.js')

module.exports = function(options, done){
  debug('mocking users, gallerys, and pics')
  if(!checkOptions)
    return done('bad options')

  // make usercount
  // make gallerycount for each user
  // make pictures for each gallery
  this.tempUserData = []
  this.tempGallerys = []
  this.tempPics = []

  let makeUsers = []
  for(var i=0; i<options.users; i++){
    makeUsers.push(mockAUser())
  }

  Promise.all(makeUsers)
  .map( userdata => {
    this.tempUserData.push(userdata)
    let makeUserGallerys = []
    let userID = userdata.tempUser._id.toString()
    let username  = userdata.tempUser.username
    for(var i=0; i<options.gallerys; i++){
      makeUserGallerys.push(mockAGallery(userID, username))
    }
    return Promise.all(makeUserGallerys)
  })
  .map(userGallerys => {
    return Promise.resolve(userGallerys)
    .map(gallery => {
      let makeGalleryPics = []
      let userID = gallery.userID.toString()
      let username = gallery.username
      for(var i=0; i<options.pics; i++){
        makeGalleryPics.push(mockAPic(userID, username))
      }
      return Promise.all(makeGalleryPics)
      .map( pic => {
        this.tempPics.push(pic)
        let picID = pic._id.toString()
        gallery.pics.push(picID)
        return gallery.save()
      })
      .each(gallery => this.tempGallerys.push(gallery))
    })
  })
  .then(() => done())
  .catch(done)
}

function checkOptions(options){
  if (!options.users)
    return false
  if (!options.gallerys)
    return false
  if (!options.pics)
    return false
  return true
}

function mockAUser(){
  let username = lorem({count: 4, units: 'word'}).split(' ').join('-')
  let password = lorem({count: 4, units: 'word'}).split(' ').join('-')
  let email= lorem({count: 4, units: 'word'}).split(' ').join('-')
  let exampleUser = {
    username,
    password,
    email: `${email}@slug.slug`,
  }
  let tempPassword = password
  let tempUser, tempToken
  return new User(exampleUser)
  .generatePasswordHash(tempPassword)
  .then( user => {
    tempUser = user
    return user.generateToken()
  })
  .then( token => {
    tempToken = token
    return {
      tempUser,
      tempToken,
      tempPassword,
    }
  })
}

function mockAGallery(userID, username){
  let name = lorem({count: 2, units: 'word'})
  let desc = lorem({count: 2, units: 'sentence'})
  let exampleGallery = { name, desc , userID, username}
  return new Gallery(exampleGallery).save()
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
