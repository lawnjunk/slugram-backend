'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Promise = require('bluebird')
const mongoose = require('mongoose')
const createError = require('http-errors')
const debug = require('debug')('slugram:user')

// mondule constant
const Schema = mongoose.Schema

const userSchema = Schema({
  username: {type: String, required: true, unique: true, minlength: 5},
  email: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  findHash: {type: String, unique: true},
})

// for signup
// store a password that has been encrypted as a hash
userSchema.methods.generatePasswordHash = function(password){
  debug('generatePasswordHash')
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(err) // 500 error
      this.password = hash
      resolve(this)
    })
  })
}

// for signin 
// compare a plain text password with the stored hashed password
userSchema.methods.comparePasswordHash = function(password){
  debug('comparePasswordHash')
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, this.password, (err, valid) => {
      if (err) return reject(err) // 500 error bcrypt failed
      if (!valid) return reject(createError(401, 'wrong password'))
      resolve(this)
    })
  })
}

// for signup 
userSchema.methods.generateFindHash = function(){
  debug('generateFindHash')
  return new Promise((resolve, reject) => {
    let tries = 0
    _generateFindHash.call(this)

    function _generateFindHash(){
      this.findHash = crypto.randomBytes(32).toString('hex')
      this.save()
      .then(() => resolve(this.findHash))
      .catch(err => {
        if (tries > 3) return reject(err) // 500 error
        tries++
        _generateFindHash.call(this)
      })
    }
  })
}

// for sinup and signin
userSchema.methods.generateToken = function(){
  debug('generateToken')
  return new Promise((resolve, reject) => {
    this.generateFindHash()
    .then(findHash => resolve(jwt.sign({token: findHash}, process.env.APP_SECRET)))
    .catch(err => reject(err)) // 500 error from find hash
  })
}

module.exports = mongoose.model('user', userSchema)
// static methods
