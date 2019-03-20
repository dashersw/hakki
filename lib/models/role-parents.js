const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleParentsSchema = new Schema({
  role: String,
  parents: [String]
})

const Role = mongoose.model('ACL_Role_Parents', roleParentsSchema)

module.exports = Role
