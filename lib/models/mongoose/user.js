const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  userId: { type: String, unique: true }
})

const User = mongoose.model('ACL_User', userSchema)

module.exports = User
