const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleUserSchema = new Schema({
  name: String,
  userId: String
}, { collection: 'acl_role_users' })

const Role = mongoose.model('RoleUser', roleUserSchema)

module.exports = Role
