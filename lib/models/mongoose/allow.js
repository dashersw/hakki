const mongoose = require('mongoose')
const Schema = mongoose.Schema

const allowSchema = new Schema({
  role: String,
  resource: String,
  permission: String
})

allowSchema.statics.getAllowedPermissionsOfRoles = function (role) {
  return this.aggregate()
    .match({ role: { $in: role } })
    .group({ _id: { resource: '$resource' }, permissions: { $addToSet: '$permission' } })
    .project({ _id: 0, resource: '$_id.resource', permissions: '$permissions' })
}
allowSchema.statics.areAnyRolesAllowed = function (roles, resource, permissions) {
  return this.aggregate()
    .match({ role: { $in: roles }, resource, permission: { $in: permissions } })
    .group({ _id: { role: '$role', resource: '$resource' }, permissions: { $push: '$permission' } })
    .match({ permissions: { $size: permissions.length } })
    .count('matches')
}

allowSchema.statics.getAllPermissionsForResourcesAndRoles = function (resources, roleNames) {
  return this.aggregate()
    .match({ resource: { $in: resources }, role: { $in: roleNames } })
    .group({ _id: { resource: '$resource' }, permissions: { $addToSet: '$permission' } })
    .project({ _id: 0, resource: '$_id.resource', permissions: '$permissions' })
    .group({ _id: null, resourceAndPermissions: { $push: '$$ROOT' } })
    .project({
      results: {
        $arrayToObject: {
          $map: {
            input: '$resourceAndPermissions',
            as: 'pair',
            in: ['$$pair.resource', '$$pair.permissions']
          }
        }
      }
    })
    .replaceRoot('$results')
}

const Allow = mongoose.model('ACL_Allow', allowSchema)

module.exports = Allow
