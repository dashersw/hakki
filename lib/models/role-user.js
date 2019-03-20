const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleUserSchema = new Schema({
  name: String,
  userId: String
})

const Role = mongoose.model('ACL_Role_User', roleUserSchema)

module.exports = Role
