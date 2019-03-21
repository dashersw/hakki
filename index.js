const AllowModel = require('./lib/models/allow')
const RoleUserModel = require('./lib/models/role-user')
const RoleParentsModel = require('./lib/models/role-parents')
const UserModel = require('./lib/models/user')

const smoosh = require('./lib/smoosh')

require('mongoose')

const upsertOpts = { upsert: true, new: true, lean: true }
const upsert = model => doc => model.findOneAndUpdate(doc, doc, upsertOpts)

async function addUserRoles (userId, roles) {
  if (!Array.isArray(roles)) roles = [roles]

  roles = roles.map(r => ({ name: r, userId }))

  const updates = roles.map(upsert(RoleUserModel))
  await Promise.all(updates)

  return upsert(UserModel)({ userId })
}

async function removeUserRoles (userId, roles) {
  if (!Array.isArray(roles)) roles = [roles]

  roles = roles.map(r => ({ name: r, userId }))

  const updates = roles.map(r => RoleUserModel.remove(r))
  await Promise.all(updates)
}

async function userRoles (userId) { // return roles
  const roles = await RoleUserModel.find({ userId }).lean()
  return roles.map(r => r.name)
}

async function roleUsers (role) { // return user ids
  const roles = await RoleUserModel.aggregate().match({ name: role }).group({
    _id: null,
    users: { $push: '$userId' }
  }).allowDiskUse()

  return (roles && roles[0] && roles[0].users) || []
}

async function hasRole (userId, role) { // boolean
  role = await RoleUserModel.findOne({ userId, name: role }).lean()

  return !!role
}

async function isRole (userId, role) {
  const userHasRole = await hasRole(userId, role)
  if (userHasRole) return true

  const parents = await RoleParentsModel.find({ role }, 'parents').lean()
  const roleNames = smoosh(parents.map(p => p.parents))

  role = await RoleUserModel.findOne({ userId, name: { $in: roleNames } })

  return !!role
}

async function addRoleParents (role, parents) {
  if (!Array.isArray(parents)) parents = [parents]

  return RoleParentsModel.findOneAndUpdate({ role }, { $addToSet: { parents: { $each: parents } } }, upsertOpts)
}

async function removeRoleParents (role, parents) {
  if (arguments.length == 1) {
    return RoleParentsModel.remove({ role })
  }

  if (!Array.isArray(parents)) parents = [parents]

  return RoleParentsModel.findOneAndUpdate({ role }, { $pullAll: { parents } }, upsertOpts)
}

async function removeRole (role) {
  await RoleUserModel.remove({ name: role })
  await AllowModel.remove({ role })
}

async function removeResource (resource) {
  await AllowModel.remove({ resource })
}

async function allow (roles, resources, permissions) {
  if (arguments.length == 1 && Array.isArray(roles)) {
    const calls = roles.map(roleAllows =>
      roleAllows.allows.map(allowDoc => allow(roleAllows.roles, allowDoc.resources, allowDoc.permissions)))

    return Promise.all(smoosh(calls))
  }

  if (!Array.isArray(roles)) roles = [roles]
  if (!Array.isArray(resources)) resources = [resources]
  if (!Array.isArray(permissions)) permissions = [permissions]

  const updates =
    roles.map(role =>
      resources.map(resource =>
        permissions.map(permission => upsert(AllowModel)({ role, resource, permission }))
      )
    )

  return Promise.all(smoosh(updates))
}

async function removeAllow (roles, resources, permissions) {
  if (!Array.isArray(roles)) roles = [roles]
  if (!Array.isArray(resources)) resources = [resources]
  if (!Array.isArray(permissions)) permissions = [permissions]

  const updates =
    roles.map(role =>
      resources.map(resource =>
        permissions.map(permission => AllowModel.remove({ role, resource, permission }))))

  return Promise.all(smoosh(updates))
}

async function allowedPermissions (userId, resources) { // returns array of objects
  if (!Array.isArray(resources)) resources = [resources]

  const roles = await RoleUserModel.find({ userId }, 'name').lean()
  let roleNames = roles.map(r => r.name)
  const parents = await RoleParentsModel.find({ role: { $in: roleNames } }, 'parents').lean()
  roleNames = roleNames.concat(smoosh(parents.map(p => p.parents)))

  const permissions = await AllowModel.aggregate()
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

  if (!permissions[0]) permissions[0] = []

  resources.forEach(r => (permissions[0][r] = permissions[0][r] || []))

  return permissions[0]
}

async function isAllowed (userId, resource, permissions) { // boolean all permissions
  if (!Array.isArray(permissions)) permissions = [permissions]

  const roles = await RoleUserModel.find({ userId }, 'name').lean()
  let roleNames = roles.map(r => r.name)
  const parents = await RoleParentsModel.find({ role: { $in: roleNames } }, 'parents').lean()
  roleNames = roleNames.concat(smoosh(parents.map(p => p.parents)))

  let hasWildcardAccess = await AllowModel.countDocuments({
    resource,
    role: { $in: roleNames },
    permission: '*'
  })

  if (hasWildcardAccess) return true

  const allowCount = await AllowModel.countDocuments({
    resource,
    role: { $in: roleNames },
    permission: { $in: permissions }
  })

  if (allowCount) return allowCount >= permissions.length

  const wildcardResourceAllows = await AllowModel.find({
    resource: /\*/,
    role: { $in: roleNames },
    permission: { $in: permissions }
  }).lean()

  if (!wildcardResourceAllows.length) return false

  hasWildcardAccess = wildcardResourceAllows.some(a => new RegExp(`^${a.resource.replace(/\*/g, '.+')}$`).test(resource))

  return hasWildcardAccess
}

async function areAnyRolesAllowed (roles, resource, permissions) { // boolean
  const allowed = await AllowModel.aggregate()
    .match({ role: { $in: roles }, resource, permission: { $in: permissions } })
    .group({ _id: { role: '$role', resource: '$resource' }, permissions: { $push: '$permission' } })
    .match({ permissions: { $size: permissions.length } })
    .count('matches')

  return !!allowed.length
}

async function whatResources (role, permissions) { // return resources role has perm over
  if (!Array.isArray(role)) role = [role]
  const parents = await RoleParentsModel.find({ role: { $in: role } }, 'parents').lean()
  role = role.concat(smoosh(parents.map(p => p.parents)))

  let allow = AllowModel.aggregate()
    .match({ role: { $in: role } })
    .group({ _id: { resource: '$resource' }, permissions: { $addToSet: '$permission' } })
    .project({ _id: 0, resource: '$_id.resource', permissions: '$permissions' })

  if (permissions) {
    if (!Array.isArray(permissions)) permissions = [permissions]
    allow = allow.match({ permissions: { $all: permissions } })
  }

  allow.group({ _id: null, resourceAndPermissions: { $push: '$$ROOT' } })
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

  allow = await allow

  if (allow.length == 0) return allow

  return permissions ? Object.keys(allow[0]) : allow[0]
}

module.exports = {
  addUserRoles,
  removeUserRoles,
  userRoles,
  roleUsers,
  hasRole,
  addRoleParents,
  removeRoleParents,
  removeRole,
  removeResource,
  allow,
  removeAllow,
  allowedPermissions,
  isAllowed,
  areAnyRolesAllowed,
  whatResources,
  isRole
}
