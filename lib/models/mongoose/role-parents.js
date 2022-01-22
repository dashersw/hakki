const mongoose = require('mongoose')
const Schema = mongoose.Schema

const roleParentsSchema = new Schema({
  role: String,
  parents: [String]
})

roleParentsSchema.statics.getAllParentRolesOfRole = function (role) {
  return this.aggregate()
    .match({ role: { $in: role } })
    .graphLookup({
      from: 'acl_role_parents',
      startWith: '$role',
      connectFromField: 'parents',
      connectToField: 'role',
      as: 'allParents'
    })
    .project({
      allParentRoles: '$allParents.parents'
    })
}

roleParentsSchema.statics.createGraph = function (role) {
  return this.aggregate()
    .match({ parents: { $in: role } })
    .graphLookup({
      from: 'acl_role_parents',
      startWith: '$parents',
      connectFromField: 'role',
      connectToField: 'parents',
      as: 'allChildren'
    })
    .project({
      allChildrenRoles: '$allChildren.role'
    })
}

const Role = mongoose.model('ACL_Role_Parents', roleParentsSchema)

module.exports = Role
