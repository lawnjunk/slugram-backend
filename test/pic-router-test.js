'use strict'

// mock third party services
require('./lib/test-env.js')
const awsMocks = require('./lib/aws-mocks.js')

// npm modules
const expect = require('chai').expect
const request = require('superagent')

// app modules
const picMock = require('./lib/pic-mock.js')
const cleanDB = require('./lib/clean-db.js')
const galleryMock = require('./lib/gallery-mock.js')
const serverCtrl = require('./lib/server-ctrl.js')

// module constants
const server = require('../server.js')
const url = `http://localhost:${process.env.PORT}`

const examplePic = {
  name: 'sunburn',
  desc: 'owie no thank you',
  image: `${__dirname}/data/shield.png`,
}

describe('testing pic-router', function(){
  // start server before all tests
  before( done => serverCtrl.serverUp(server, done))
  // stop server before all tests
  after(done => serverCtrl.serverDown(server, done))
  // remove all models from database after every test
  afterEach(done => cleanDB(done))

  describe('testing post /api/gallery/:id/pic', function(){
    describe('with valid token and data', function(){
      before(done => galleryMock.call(this, done))
      it('should return a pic', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}/pic`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('name', examplePic.name)
        .field('desc', examplePic.desc)
        .attach('image', examplePic.image)
        .end((err, res) => {
          if (err) 
            return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal(examplePic.name)
          expect(res.body.desc).to.equal(examplePic.desc)
          expect(res.body.imageURI).to.equal(awsMocks.uploadMock.Location)
          expect(res.body.objectKey).to.equal(awsMocks.uploadMock.Key)
          done()
        })
      })
    })

    describe('with no name', function(){
      before(done => galleryMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}/pic`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', examplePic.desc)
        .attach('image', examplePic.image)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no desc', function(){
      before(done => galleryMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}/pic`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('name', examplePic.name)
        .attach('image', examplePic.image)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no image', function(){
      before(done => galleryMock.call(this, done))
      it('should respond with status 400', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}/pic`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', examplePic.desc)
        .field('name', examplePic.name)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => galleryMock.call(this, done))
      it('should respond with status 401', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}/pic`)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .field('desc', examplePic.desc)
        .field('name', examplePic.name)
        .attach('image', examplePic.image)
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with invalid galleryID', function(){
      before(done => galleryMock.call(this, done))
      it('should respond with status 404', done => {
        request.post(`${url}/api/gallery/${this.tempGallery._id}bad/pic`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .field('desc', examplePic.desc)
        .field('name', examplePic.name)
        .attach('image', examplePic.image)
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })
  })

  describe('testing DELETE /api/gallery/:gallryID/pic/:picID', function(){
    describe('with valid token and ids', function(){
      before(done => picMock.call(this, done))

      it('should respond with status 204', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}/pic/${this.tempPic._id}`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.status).to.equal(204)
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => picMock.call(this, done))
      it('should respond with status 401', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}/pic/${this.tempPic._id}`)
        .set({Authorization: `Bearer ${this.tempToken}bad`})
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('no auth header', function(){
      before(done => picMock.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}/pic/${this.tempPic._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with no bearer auth', function(){
      before(done => picMock.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}/pic/${this.tempPic._id}`)
        .set({Authorization: 'lul this is bad'})
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })

    describe('with invalid galleryID', function(){
      before(done => picMock.call(this, done))
      it('should respond with status 404', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}bad/pic/${this.tempPic._id}`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with invalid picID', function(){
      before(done => picMock.call(this, done))
      it('should respond with status 404', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}/pic/${this.tempPic._id}bad`)
        .set({Authorization: `Bearer ${this.tempToken}`})
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })
  })

})
