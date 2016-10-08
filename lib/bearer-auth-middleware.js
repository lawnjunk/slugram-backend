'use strict'

// npm modules
const jwt = require('jsonwebtoken')
const createError = require('http-errors')
const debug = require('debug')('slugram:bearer-middleware')

// app modules
const User = require('../model/user.js')

module.exports = function(req, res, next){
  debug()
  let authHeader = req.headers.authorization
  if (!authHeader)
    return next(createError(400, 'requires auth header'))

  let token = authHeader.split('Bearer ')[1]
  if (!token)
    return next(createError(400, 'requires token'))

  jwt.verify(token, process.env.APP_SECRET, (err, decoded) => {
    if (err) 
      return next(createError(401, 'requires token'))
    User.findOne({findHash: decoded.token})
    .then( user => {
      if (!user) return next(createError(401, 'user no longer exists or has new token'))
      req.user = user
      next()
    })
  })
}
