const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleUserSchema = new Schema({
  name: String,
  userId: String
})

roleUserSchema.statics.getUsersWithRole = function (role) {
  return this.aggregate().match({ name: role }).group({
    _id: null,
    users: { $push: '$userId' }
  }).allowDiskUse()
}

const Role = mongoose.model('ACL_Role_User', roleUserSchema)

module.exports = Role
