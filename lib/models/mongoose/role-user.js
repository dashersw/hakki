const mongoose = require('mongoose')
const RoleParentsModel = require('./role-parents')
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

roleUserSchema.statics.getUsersWithParentRole = async function (role) {
  if (!Array.isArray(role)) role = [role]

  const parentRoles = await RoleParentsModel.getAllParentRolesOfRole(role)

  const allRoles = (parentRoles[0]?.allParentRoles || []).concat(role)

  return this.getUsersWithRole({ $in: allRoles })
}

roleUserSchema.statics.getUsersIncludingInheritedRoles = function (roles) {
  return RoleParentsModel.aggregate()
    .graphLookup({
      from: 'acl_role_parents',
      startWith: '$parents',
      connectFromField: 'role',
      connectToField: 'parents',
      as: 'allChildren'
    })
    .match({
      $or: [{ role: { $in: roles } }, { parents: roles }]
    })
    .project({ roles: { $setUnion: ['$allChildren.role', roles] } })
    .lookup({
      from: 'acl_role_users',
      localField: 'roles',
      foreignField: 'name',
      as: 'users'
    })
    .unwind('users')
    .group({
      _id: null,
      users: { $addToSet: '$users.userId' }
    })
}

roleUserSchema.index({ name: 1, userId: 1 })
roleUserSchema.index({ userId: 1 })

const Role = mongoose.model('ACL_Role_User', roleUserSchema)

module.exports = Role
