const BaseModel = require('./base')
const _ = require('lodash')

class Allow extends BaseModel {
  static list = []

  static async getAllPermissionsForResourcesAndRoles(resources, roleNames) {
    const rv = _
    .chain(this.list)
    .filter(allow => roleNames.includes(allow.role) && resources.includes(allow.resource))
    .groupBy('resource')
    .mapValues((obj) => _.uniq(obj.map(o => o.permission)))
    .value()

    return [rv]
  }

  static async areAnyRolesAllowed(roles, resource, permissions) {
    const rv = _
    .chain(this.list)
    .filter(doc => roles.includes(doc.role) && doc.resource == resource && permissions.includes(doc.permission))
    .groupBy(doc => `${doc.role}_${doc.resource}`)
    .mapValues((obj, key) => ({key, permissions: _.uniq(obj.map(o => o.permission))}))
    .filter(obj => obj.permissions.length == permissions.length)
    .value()

    return rv
  }

  static getAllowedPermissionsOfRoles(role, permissions) {
    console.log('params', role, permissions)
    let rv = _
    .chain(this.list)
    .filter(doc => role.includes(doc.role))
    .groupBy(doc => doc.resource)
    .mapValues((obj, key) => ({resource: key, permissions: _.uniq(obj.map(o => o.permission))}))
    .map(o => o)
    .value()

    if (permissions) {
      if (!Array.isArray(permissions)) permissions = [permissions]
      rv = _.filter(rv, _.matches({ permissions }))
    }

    rv = _
    .chain(rv)
    .keyBy('resource')
    .mapValues(o => o.permissions)
    .value()



    console.log('getAllowedPermissionsOfRoles', rv)

    return Object.keys(rv).length == 1 ? rv : [rv]
  }
}

module.exports = Allow



// allowSchema.statics.getAllowedPermissionsOfRoles = function (role, permissions) {
//   let allow = this.aggregate()
//     .match({ role: { $in: role } })
//     .group({ _id: { resource: '$resource' }, permissions: { $addToSet: '$permission' } })
//     .project({ _id: 0, resource: '$_id.resource', permissions: '$permissions' })

//   if (permissions) {
//     if (!Array.isArray(permissions)) permissions = [permissions]
//     allow = allow.match({ permissions: { $all: permissions } })
//   }

//   return allow.group({ _id: null, resourceAndPermissions: { $push: '$$ROOT' } })
//     .project({
//       results: {
//         $arrayToObject: {
//           $map: {
//             input: '$resourceAndPermissions',
//             as: 'pair',
//             in: ['$$pair.resource', '$$pair.permissions']
//           }
//         }
//       }
//     })
//     .replaceRoot('$results')
// }
