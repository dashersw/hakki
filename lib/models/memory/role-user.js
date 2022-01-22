const _ = require('lodash')
const BaseModel = require('./base')

class RoleUser extends BaseModel {
  static list = []

  static getUsersWithRole(role) {
    return [
      {
        users: _
      .chain(this.list)
      .filter(_.matches({ name: role }))
      .value().map(r => r.userId)
    }
  ]
  }
}

module.exports = RoleUser
