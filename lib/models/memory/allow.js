const BaseModel = require('./base')
const _ = require('lodash')

class Allow extends BaseModel {
  static list = []

  static find (where) {
    return _.filter(this.list, doc => {
      return (
        doc.resource.includes('*') &&
        where.role.$in.includes(doc.role) &&
        where.permission.$in.includes(doc.permission)
      )
    })
  }

  static async getAllPermissionsForResourcesAndRoles (resources, roleNames) {
    let rv = _.chain(this.list)
      .filter(allow => roleNames.includes(allow.role) && resources.includes(allow.resource))

    if (!rv.value().length) return []

    rv = rv.groupBy('resource')
      .mapValues(obj => _.uniq(obj.map(o => o.permission)))
      .value()

    return [rv]
  }

  static async areAnyRolesAllowed (roles, resource, permissions) {
    const rv = _.chain(this.list)
      .filter(doc => roles.includes(doc.role) && doc.resource == resource && permissions.includes(doc.permission))
      .groupBy(doc => `${doc.role}_${doc.resource}`)
      .mapValues((obj, key) => ({ key, permissions: _.uniq(obj.map(o => o.permission)) }))
      .filter(obj => obj.permissions.length == permissions.length)
      .value()

    return rv
  }

  static getAllowedPermissionsOfRoles (role, permissions) {
    let rv = _.chain(this.list)
      .filter(doc => role.includes(doc.role))

    if (!rv.value().length) return []

    rv = rv.groupBy(doc => doc.resource)
      .mapValues((obj, key) => ({ resource: key, permissions: _.uniq(obj.map(o => o.permission)) }))
      .map(o => o)
      .value()

    if (permissions) {
      if (!Array.isArray(permissions)) permissions = [permissions]
      rv = _.filter(rv, _.matches({ permissions }))
    }

    rv = _.chain(rv)
      .keyBy('resource')
      .mapValues(o => o.permissions)
      .value()

    return [rv]
  }
}

module.exports = Allow
