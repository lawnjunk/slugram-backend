'use strict'

const debug = require('debug')('sulgram:mock-many-users')
const User = require('../../model/user.js')
const lorem = require('lorem-ipsum')

module.exports = function(count, done){
  debug(`creating ${count} users`)
  let userMocks = []

  for(var i=0; i<count; i++){
    userMocks.push(mockAUser())
  }

  Promise.all(userMocks)
  .then( tempUsers => {
    this.tempUsers = tempUsers
    done()
  })
  .catch(done)

}

function mockAUser(){
  let username = lorem({count: 2, units: 'word'}).split(' ').join('-')
  let password = lorem({count: 2, units: 'word'}).split(' ').join('-')
  let email= lorem({count: 2, units: 'word'}).split(' ').join('-')
  let exampleUser = {
    username,
    password,
    email: `${email}@slug.slug`,
  }
  let tempPassword = password
  let tempUser, tempToken
  return new User(exampleUser) 
  .generatePasswordHash(exampleUser.password)
  .then( user => user.save())
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
