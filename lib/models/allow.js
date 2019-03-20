const mongoose = require('mongoose')
const Schema = mongoose.Schema

const allowSchema = new Schema({
  role: String,
  resource: String,
  permission: String
})

const Allow = mongoose.model('ACL_Allow', allowSchema)

module.exports = Allow
