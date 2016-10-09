'use strict'

const mongoose = require('mongoose')

const picSchema = mongoose.Schema({
  name: {type: String, required: true},
  desc: {type: String, required: true},
  username: {type: String, required: true},
  userID: {type: mongoose.Schema.Types.ObjectId, required: true},
  imageURI: {type: String, required: true, unique: true},
  objectKey: {type: String, required: true, unique: true},
  created: {type: Date, default: Date.now},
})

module.exports = mongoose.model('pic', picSchema)

//Pic.schema.path('name').validate(function(val) {
  //return /(slug|byte)/.test(val)
//})

