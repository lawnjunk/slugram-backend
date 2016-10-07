'use strict'

const debug = require('debug')('slugram:clean-db')

const Pic = require('../../model/pic.js')
const User = require('../../model/user.js')
const Gallery = require('../../model/gallery.js')

module.exports = function(done){
  debug('clean up database')
  Promise.all([
    Pic.remove({}),
    User.remove({}),
    Gallery.remove({}),
  ])
  .then( () => done())
  .catch(done)
}
