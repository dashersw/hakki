const _ = require('lodash')
const BaseModel = require('./base')

class Role extends BaseModel {
  static list = []

  static async getAllChildrenRolesOfRole (roles) {
    if (!roles.length || !roles[0]) return []

    const parents = this.list.filter(item => _.intersection(roles, item.parents).length)

    if (!parents.length) return []

    const children = parents.flatMap(p => p.role)

    const childrenPromises = children.map(child => this.getAllChildrenRolesOfRole([child]))

    const allChildren = await Promise.all(childrenPromises)

    const rv = [...children, ...allChildren.flatMap(p => p[0]?.allChildrenRoles).filter(a => a)]

    return [{ allChildrenRoles: rv }]
  }

  static async getAllParentRolesOfRole (role) {
    if (!role.length) return []

    const children = this.list.filter(item => role.includes(item.role))

    if (!children.length) return []

    const parents = children.flatMap(c => c.parents)

    const parentPromises = parents.map(parent => this.getAllParentRolesOfRole([parent]))

    const allParents = await Promise.all(parentPromises)

    const rv = [...parents, ...allParents.flatMap(p => p[0]?.allParentRoles).filter(a => a)]

    return [{ allParentRoles: rv }]
  }

  static async findOneAndUpdate (where, update, options) {
    let item = this.list.find(item => item.role == where.role)

    if (update.$addToSet) {
      if (!item) {
        item = { role: where.role, parents: [] }
        this.list.push(item)
      }

      item.parents.push(...update.$addToSet.parents.$each)

      return item
    }

    if (update.$pullAll) {
      let item = this.list.find(item => item.role == where.role)
      if (!item) {
        item = { role: where.role, parents: [] }
        this.list.push(item)
      }

      item.parents = item.parents.filter(p => !update.$pullAll.parents.includes(p))

      return item
    }

    return BaseModel.findOneAndUpdate.call(this, where, update, options)
  }
}

module.exports = Role
