'use strict'

require('./lib/test-env.js')
require('./lib/aws-mocks.js')

// npm
const expect = require('chai').expect
const request = require('superagent')
const mongoose = require('mongoose')
const Promise = require('bluebird')

// app
const User = require('../model/user.js')
const server = require('../server.js')
const serverCtrl = require('./lib/server-ctrl.js')
const cleanDB = require('./lib/clean-db.js')
const mockUser = require('./lib/user-mock.js')
const mockGallery = require('./lib/gallery-mock.js')

// const
const url = `http://localhost:${process.env.PORT}`
  // config
mongoose.Promise = Promise
let exampleGallery = {
  name: 'beach adventure',
  desc: 'not enough sun screan ouch',
}

describe('test /api/gallery', function(){
  // start server at for this test file
  before(done => serverCtrl.serverUp(server, done))
  // stop server after this test file
  after(done => serverCtrl.serverDown(server, done))
  // clean all models from db after each test
  afterEach(done => cleanDB(done))

  describe('testing POST to /api/gallery', () => {
    // create this.tempUser and this.tempToken
    describe('with valid token and body', () => {
      before(done => mockUser.call(this, done))
      it('should return a gallery', done => {
        request.post(`${url}/api/gallery`)
        .send(exampleGallery)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          let date = new Date(res.body.created).toString()
          expect(date).to.not.equal('Invalid Date')
          done()
        })
      })
    })

    describe('with invalid token', () => {
      before(done => mockUser.call(this, done))
      it('should respond with status 401', done => {
        request.post(`${url}/api/gallery`)
        .send(exampleGallery)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid Bearer auth', () => {
      before(done => mockUser.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery`)
        .send(exampleGallery)
        .set({Authorization: 'not bearer auth'})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no Authorization header', () => {
      before(done => mockUser.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery`)
        .send(exampleGallery)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no name', () => {
      before(done => mockUser.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .send({ desc: exampleGallery.desc})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no desc', () => {
      before(done => mockUser.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .send({ name: exampleGallery.name})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing GET to /api/gallery/:id', () => {
    // create this.tempToken, this.tempUser, this.tempGallery
    describe('with valid token and id', function(){
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          let date = new Date(res.body.created).toString()
          expect(date).to.not.equal('Invalid Date')
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}bad`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid Bearer auth', function(){
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({ Authorization: 'bad request' })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no Authorization header', function(){
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid id', function(){
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}bad`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with user whos been removed', function(){
      before(done => mockGallery.call(this, done))
      before(done => {
        User.remove({})
        .then(() => done())
        .catch(done)
      })

      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with wrong user', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      // overwrite user, password, and token with new user
      before(done => mockUser.call(this, done))

      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })
  })
})
