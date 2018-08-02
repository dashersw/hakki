const mongoose = require('mongoose')
const Schema = mongoose.Schema

const allowSchema = new Schema({
  role: String,
  resource: String,
  permission: String
}, { collection: 'acl_allows' })

const Allow = mongoose.model('Allow', allowSchema)

module.exports = Allow
