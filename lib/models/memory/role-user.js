const _ = require('lodash')
const BaseModel = require('./base')
const RoleParentsModel = require('./role-parents')

class RoleUser extends BaseModel {
  static list = []

  static getUsersWithRole (role) {
    const roles = Array.isArray(role) ? role : [role]
    const rv = _.chain(this.list).filter(r => roles.includes(r.name))

    if (!rv.value().length) return []

    return [
      {
        users: rv.value().map(r => r.userId)
      }
    ]
  }

  static async getUsersWithParentRole (role) {
    const graph = await RoleParentsModel.getAllParentRolesOfRole(role)

    const parentRoles = (graph?.[0]?.allParentRoles || []).flat()

    const rv = _.chain(this.list).filter(r => parentRoles.includes(r.name) || r.name == role)

    if (!rv.value().length) return []

    return [
      {
        users: rv.value().map((r) => r.userId)
      }
    ]
  }

  static async getUsersIncludingInheritedRoles (roles) {
    const graph = await RoleParentsModel.getAllChildrenRolesOfRole(roles)

    const childrenRoles = graph?.[0]?.allChildrenRoles || []

    const rv = this.list.filter(r => childrenRoles.includes(r.name) || r.name == roles)

    if (!rv.length) return []

    return [
      {
        users: rv.map(r => r.userId)
      }
    ]
  }
}

module.exports = RoleUser
