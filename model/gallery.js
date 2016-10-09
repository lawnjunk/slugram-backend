'use strict'

const mongoose = require('mongoose')

const gallerySchema = mongoose.Schema({
  name: {type: String, required: true},
  desc: {type: String, required: true},
  username: {type: String, required: true},
  created: {type: Date, required: true, default: Date.now},
  userID: {type: mongoose.Schema.Types.ObjectId, required: true},
  pics: [{type: mongoose.Schema.Types.ObjectId, ref: 'pic'}],
})

module.exports = mongoose.model('gallery', gallerySchema)
