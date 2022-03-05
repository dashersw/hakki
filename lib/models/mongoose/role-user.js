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

roleUserSchema.statics.getUsersWithParentRole = function (role) {
  return this.aggregate()
    .lookup({
      from: 'acl_role_parents',
      localField: 'name',
      foreignField: 'parents',
      as: 'parents'
    })
    .match({
      $or: [{ name: role }, { 'parents.role': role }]
    })
    .group({
      _id: null,
      users: { $addToSet: '$userId' }
    })
}

const Role = mongoose.model('ACL_Role_User', roleUserSchema)

module.exports = Role
