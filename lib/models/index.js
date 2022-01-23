module.exports = function (type) {
  if (type == 'memory') {
    return {
      AllowModel: require('./memory/allow'),
      RoleUserModel: require('./memory/role-user'),
      RoleParentsModel: require('./memory/role-parents'),
      UserModel: require('./memory/user')
    }
  }

  if (type == 'mongoose') {
    return {
      AllowModel: require('./mongoose/allow'),
      RoleUserModel: require('./mongoose/role-user'),
      RoleParentsModel: require('./mongoose/role-parents'),
      UserModel: require('./mongoose/user')
    }
  }

  return {}
}
