const _ = require('lodash')
const BaseModel = require('./base')

class RoleUser extends BaseModel {
  static list = []

  static getUsersWithRole (role) {
    const rv = _.chain(this.list).filter(_.matches({ name: role }))

    if (!rv.value().length) return []

    return [
      {
        users: rv.value().map(r => r.userId)
      }
    ]
  }
}

module.exports = RoleUser
