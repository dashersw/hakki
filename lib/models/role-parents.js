const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleParentsSchema = new Schema({
  role: String,
  parents: [String]
}, { collection: 'acl_role_parents' })

const Role = mongoose.model('RoleParents', roleParentsSchema)

module.exports = Role
