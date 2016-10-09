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
const cleanDB = require('./lib/clean-db.js')
const mockUser = require('./lib/user-mock.js')
const serverCtrl = require('./lib/server-ctrl.js')
const fuzzyRegex = require('../lib/fuzzy-regex.js')
const mockGallery = require('./lib/gallery-mock.js')
const mockManyPics = require('./lib/mock-many-pics.js')
const mockManyGallerys = require('./lib/mock-many-gallerys.js')
//const mockManyEverything = require('./lib/mock-many-everything.js')
const mockManyEverything = require('./lib/everything-mock.js')

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
          expect(date).to.equal(this.tempGallery.created.toString())
          done()
        })
      })
    })

    describe('with many pictures', function(){
      before(done => mockManyPics.call(this, 100, done))
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
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(100)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[i]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[i].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[i].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[i].imageURI)
          }
          done()
        })
      })
    })

    describe('with ?itemcount=10&itempage=2',  function(){
      before(done => mockManyPics.call(this, 100, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}?itemcount=10&itempage=2`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[i + 10 ]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[i + 10].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[i + 10].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[i + 10].imageURI)
          }
          done()
        })
      })
    })

    describe('with many pictures and ?itemcount=10', function(){
      before(done => mockManyPics.call(this, 100, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}?itemcount=10`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[i]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[i].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[i].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many pictures and ?itemcount=10&itemsort=dsc', function(){
      before(done => mockManyPics.call(this, 100, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}?itemcount=10&itemsort=dsc`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          let tempPicsLength = this.tempPics.length
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[tempPicsLength - 1 - i]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[tempPicsLength - 1 - i].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[tempPicsLength - 1 - i].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[tempPicsLength - 1 - i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many pictures and ?itemcount=10&itemsort=dsc?itemoffset=1', function(){
      before(done => mockManyPics.call(this, 100, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}?itemcount=10&itemsort=dsc&itemoffset=1`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          let tempPicsLength = this.tempPics.length
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[tempPicsLength - 2 - i]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[tempPicsLength - 2 - i].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[tempPicsLength - 2 - i].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[tempPicsLength - 2 - i].imageURI)
          }
          done()
        })
      })
    })

    describe('with many pictures and ?itemcount=10&itemoffset=1', function(){
      before(done => mockManyPics.call(this, 100, done))
      it('should return a gallery', done => {
        request.get(`${url}/api/gallery/${this.tempGallery._id}?itemcount=10&itemoffset=1`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err)
            return done(err)
          expect(res.body.name).to.equal(exampleGallery.name)
          expect(res.body.desc).to.equal(exampleGallery.desc)
          expect(res.body.userID).to.equal(this.tempUser._id.toString())
          expect(Array.isArray(res.body.pics)).to.equal(true)
          expect(res.body.pics.length).to.equal(10)
          let date = new Date(res.body.created).toString()
          expect(date).to.equal(this.tempGallery.created.toString())
          for (let i=0; i< res.body.pics.length; i++){
            expect(res.body.pics[i]._id.toString()).to.equal(this.tempPics[i + 1]._id.toString())
            expect(res.body.pics[i].name).to.equal(this.tempPics[i + 1].name)
            expect(res.body.pics[i].desc).to.equal(this.tempPics[i + 1].desc)
            expect(res.body.pics[i].imageURI).to.equal(this.tempPics[i + 1].imageURI)
          }
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before(done => mockGallery.call(this, done))
      it('should respond with status 401', done => {
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
      it('should respond with status 400', done => {
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
      it('should respond with status 400', done => {
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

      it('should respond with status 401', done => {
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

      it('should respond with status 401', done => {
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

  describe('testing PUT /api/gallery/:galleryID', function(){
    describe('update name ande desc', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should return a gallery', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}`)
        .send({
          name: 'hello',
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if(err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal('hello')
          expect(res.body.desc).to.equal('cool')
          done()
        })
      })
    })

    describe('update name ande desc', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      before(done => mockUser.call(this, done))

      it('should return a gallery', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}`)
        .send({
          name: 'hello',
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })

    describe('update name', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should return a gallery', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}`)
        .send({
          name: 'hello',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal('hello')
          expect(res.body.desc).to.equal(this.tempGallery.desc)
          done()
        })
      })
    })

    describe('update desc', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should return a gallery', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}`)
        .send({
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if (err) return done(err)
          expect(res.status).to.equal(200)
          expect(res.body.name).to.equal(this.tempGallery.name)
          expect(res.body.desc).to.equal('cool')
          done()
        })
      })
    })

    describe('with bad galeryID', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should return a gallery', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}bad`)
        .send({
          desc: 'cool',
        })
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with bad token', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should respond with status 401', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}`)
        .send({
          desc: 'cool',
        })
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

    describe('witn no auth', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))

      it('should respond with status 400', done => {
        request.put(`${url}/api/gallery/${this.tempGallery._id}bad`)
        .send({
          desc: 'cool',
        })
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing DELETE /api/gallery/:galleryID', function(){
    describe('should respond with status 204', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          expect(res.status).to.equal(204)
          done()
        })
      })
    })

    describe('with invalid galleryID', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      it('should return a gallery', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}bad`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(404)
          expect(res.text).to.equal('NotFoundError')
          done()
        })
      })
    })

    describe('with invalid galleryID', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      before(done => mockUser.call(this, done))
      it('should return a gallery', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          done()
        })
      })
    })

    describe('with invalid token', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      it('should respond with status 401', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}`)
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

    describe('witn no auth', function(){
      // mock user, password, token, and gallery
      before(done => mockGallery.call(this, done))
      it('should respond with status 400', done => {
        request.delete(`${url}/api/gallery/${this.tempGallery._id}`)
        .end((err, res) => {
          expect(res.status).to.equal(400)
          expect(res.text).to.equal('BadRequestError')
          done()
        })
      })
    })
  })

  describe('testing GET /api/gallery', function(){
    describe('with valid request', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should respond with status 400', done => {
        request.get(`${url}/api/gallery`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          done()
        })
      })
    })

    describe('with ?pagesize=10', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?pagesize=5`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(5)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i].name)
          }
          done()
        })
      })
    })

    describe('with ?sort=dsc', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?sort=dsc`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[this.tempGallerys.length - i - 1].name)
          }
          done()
        })
      })
    })

    describe('with ?sort=dsc?offset=3', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?sort=dsc&offset=3`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            let index = this.tempGallerys.length - i - 4 
            expect(res.body[i].name).to.equal(this.tempGallerys[index].name)
          }
          done()
        })
      })
    })

    describe('with offset=1', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?offset=1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i + 1].name)
          }
          done()
        })
      })
    })

    describe('with ?page=2', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?page=2`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i + 50].name)
          }
          done()
        })
      })
    })

    describe('with ?page=3&?offset=1', function(){
      before( done => mockManyGallerys.call(this, 150, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?page=3&offset=1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(49)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i + 101].name)
          }
          done()
        })
      })
    })

    describe('with ?page=-1', function(){
      before( done => mockManyGallerys.call(this, 150, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?page=-1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(50)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i].name)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=-1', function(){
      before( done => mockManyGallerys.call(this, 50, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?pagesize=-1`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(1)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i].name)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=300', function(){
      before( done => mockManyGallerys.call(this, 300, done))
      it('should return 10 notes', done => {
        request.get(`${url}/api/gallery?pagesize=250`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(250)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.equal(this.tempGallerys[i].name)
          }
          done()
        })
      })
    })

    describe('with invalid token', function(){
      before( done => mockManyGallerys.call(this, 50, done))
      it('should respond with status 401', done => {
        request.get(`${url}/api/gallery`)
        .set({ Authorization: `Bearer ${this.tempToken}bad` })
        .end((err, res) => {
          expect(res.status).to.equal(401)
          expect(res.text).to.equal('UnauthorizedError')
          done()
        })
      })
    })

    describe('with ?name=co', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/gallery?name=co`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          console.log('matching notes', res.body.length)
          let fuzzyName = fuzzyRegex('co')
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzyName)
          }
          done()
        })
      })
    })

    describe('with ?desc=co', function(){
      before( done => mockManyGallerys.call(this, 100, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/gallery?desc=co`)
        .set({ Authorization: `Bearer ${this.tempToken}` })
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          console.log('matching notes', res.body.length)
          let fuzzyName = fuzzyRegex('co')
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].desc).to.match(fuzzyName)
          }
          done()
        })
      })
    })
  })

  describe('testing GET /api/public/gallery', function(){
    describe('with valid request', function(){
      let options = {
        users: 4,
        gallerys: 3,
        pics: 4,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match co', done => {
        request.get(`${url}/api/public/gallery`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          done()
        })
      })
    })

    describe('with ?username=lu', function(){
      let options = {
        users: 30,
        gallerys: 1,
        pics: 1,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match lu', done => {
        request.get(`${url}/api/public/gallery?username=lu`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lu')
          console.log('matches found', res.body.length)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].username).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?name=lu', function(){
      let options = {
        users: 5,
        gallerys: 10,
        pics: 1,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('should respond nodes with fuzzy match lu', done => {
        request.get(`${url}/api/public/gallery?name=lu`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          let fuzzy = fuzzyRegex('lu')
          console.log('matches found', res.body.length)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].name).to.match(fuzzy)
          }
          done()
        })
      })
    })

    describe('with ?itemcount=4', function(){
      let options = {
        users: 2,
        gallerys: 5,
        pics: 10,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('each galery should have 4 pics', done => {
        request.get(`${url}/api/public/gallery?itemcount=4`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].pics.length).to.equal(4)
          }
          done()
        })
      })
    })

    describe('with ?pagesize=4', function(){
      let options = {
        users: 2,
        gallerys: 5,
        pics: 10,
      }

      before( done => mockManyEverything.call(this, options, done))
      it('show top 4 galerys with 10 pics', done => {
        request.get(`${url}/api/public/gallery?pagesize=4`)
        .end((err, res) => {
          expect(res.status).to.equal(200)
          expect(Array.isArray(res.body)).to.equal(true)
          expect(res.body.length).to.equal(4)
          for (let i=0; i < res.body.length; i++){
            expect(res.body[i].pics.length).to.equal(10)
          }
          done()
        })
      })
    })
  })
})
