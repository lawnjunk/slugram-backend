'use strict'

// npm modules
const cors = require('cors')
const dotenv = require('dotenv')
const morgan = require('morgan')
const express = require('express')
const Promise = require('bluebird')
const mongoose = require('mongoose')
const debug = require('debug')('slugram:sever')

// app modules
const picRouter = require('./route/pic-router.js')
const authRouter = require('./route/auth-router.js')
const galleryRouter = require('./route/gallery-router.js')
const errorMiddleware = require('./lib/error-middleware.js')

// load env vars
dotenv.load()

// setup mongoose
mongoose.Promise = Promise
mongoose.connect(process.env.MONGODB_URI)

// module constants
const PORT = process.env.PORT
const app = express()


// app middleware
app.use(cors())
let production = process.env.NODE_ENV === 'production'
let morganFormat = production ? 'common' : 'dev'
app.use(morgan(morganFormat))

// app routes
app.use(picRouter)
app.use(authRouter)
app.use(galleryRouter)
app.use(errorMiddleware)

// start server
const server = module.exports = app.listen(PORT , () => {
  debug(`server up on ${PORT}`)
})

server.isRunning = true
