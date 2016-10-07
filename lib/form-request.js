'use strict'

const FormData = require('form-data')
const Promise = require('bluebird')

module.exports = function(url, params){
  return new Promise((resolve, reject) => {
    let form = new FormData()
    for (var key in params){
      form.append(key, params[key])
    }

    form.submit(url, function(err, res){
      if (err) return reject(err)
      let json = ''
      res.on('data', data => json += data.toString())
      res.on('end', () => {
        try {
          let result = JSON.parse(json)
          res.body = result
          resolve(res)
        } catch (err) {
          reject(err)
        }
      })
    })
  })
}
