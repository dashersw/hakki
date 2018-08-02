const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: { type: String, unique: true }
}, { collection: 'acl_users' })

const User = mongoose.model('User', userSchema)

module.exports = User
