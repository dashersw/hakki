let AllowModel
let RoleUserModel
let RoleParentsModel
let UserModel

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
  const roles = await RoleUserModel.find({ userId }, null, { lean: true })
  return roles.map(r => r.name)
}

async function roleUsers (role) { // return user ids
  const roles = await RoleUserModel.getUsersWithRole(role)

  return (roles && roles[0] && roles[0].users) || []
}

async function roleUsersWithParentRoles(role) {
  // return user ids
  const result = await RoleUserModel.getUsersWithParentRole(role)

  return (result && result[0] && result[0].users) || []
}

async function roleUsersIncludingInheritedRoles(role) {
  // return user ids
  const roles = Array.isArray(role) ? role : [role]

  const result = await RoleUserModel.getUsersIncludingInheritedRoles(roles)

  return (result && result[0] && result[0].users) || []
}

async function hasRole (userId, role) { // boolean
  const query = { userId, name: role }

  if (Array.isArray(role)) query.name = { $in: role }

  role = await RoleUserModel.findOne(query, null, { lean: true })

  return !!role
}

async function getAllParentRoles (role) {
  const graph = await RoleParentsModel.getAllParentRolesOfRole(role)

  if (!graph[0]) return []

  return graph[0].allParentRoles.flat()
}

async function getAllChildrenRoles (role) {
  if (!Array.isArray(role)) role = [role]

  const graph = await RoleParentsModel.getAllChildrenRolesOfRole(role)

  if (!graph[0]) return []

  return graph[0].allChildrenRoles
}

async function isRole (userId, role) {
  const userHasRole = await hasRole(userId, role)
  if (userHasRole) return true

  const parentRoles = await getAllChildrenRoles(role)

  return hasRole(userId, parentRoles)
}

async function addRoleParents (role, parents = []) {
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

    return Promise.all(calls.flat())
  }

  if (!Array.isArray(roles)) roles = [roles]
  if (!Array.isArray(resources)) resources = [resources]
  if (!Array.isArray(permissions)) permissions = [permissions]

  const updates =
    roles.flatMap(role =>
      resources.flatMap(resource =>
        permissions.map(permission => upsert(AllowModel)({ role, resource, permission }))
      )
    )

  return Promise.all(updates)
}

async function removeAllow (roles, resources, permissions) {
  if (!Array.isArray(roles)) roles = [roles]
  if (!Array.isArray(resources)) resources = [resources]
  if (!Array.isArray(permissions)) permissions = [permissions]

  const updates =
    roles.flatMap(role =>
      resources.flatMap(resource =>
        permissions.map(permission => AllowModel.remove({ role, resource, permission }))))

  return Promise.all(updates)
}

async function allowedPermissions (userId, resources) { // returns array of objects
  if (!Array.isArray(resources)) resources = [resources]

  const roles = await RoleUserModel.find({ userId }, 'name', { lean: true })
  let roleNames = roles.map(r => r.name)
  const parents = await getAllParentRoles(roleNames)
  roleNames = roleNames.concat(parents)

  const permissions = await AllowModel.getAllPermissionsForResourcesAndRoles(resources, roleNames)

  if (!permissions[0]) permissions[0] = []

  resources.forEach(r => (permissions[0][r] = permissions[0][r] || []))

  return permissions[0]
}

async function isAllowed (userId, resource, permissions) { // boolean all permissions
  if (!Array.isArray(permissions)) permissions = [permissions]

  const roles = await RoleUserModel.find({ userId }, 'name', { lean: true })
  let roleNames = roles.map(r => r.name)
  const parents = await getAllParentRoles(roleNames)
  roleNames = roleNames.concat(parents)

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
  }, null, { lean: true })

  if (!wildcardResourceAllows.length) return false

  hasWildcardAccess = wildcardResourceAllows.some(a => new RegExp(`^${a.resource.replace(/\*/g, '.+')}$`).test(resource))

  return hasWildcardAccess
}

async function areAnyRolesAllowed (roles, resource, permissions) { // boolean
  const allowed = await AllowModel.areAnyRolesAllowed(roles, resource, permissions)

  return !!allowed.length
}

async function whatResources (role, permissions) { // return resources role has perm over
  if (!Array.isArray(role)) role = [role]
  const parents = await getAllParentRoles(role)
  role = role.concat(parents)

  const allow = await AllowModel.getAllowedPermissionsOfRoles(role, permissions)

  if (allow.length == 0) return allow

  return permissions ? Object.keys(allow[0]) : allow[0]
}

/**
 * Returns all the unique roles
 */
async function getDistinctRoles () {
  return AllowModel.distinct('role')
}

/**
 * Returns all the unique permissions
 */
async function getDistinctPermissions () {
  return AllowModel.distinct('permission')
}

const methods = {
  addUserRoles,
  removeUserRoles,
  userRoles,
  roleUsers,
  roleUsersWithParentRoles,
  roleUsersIncludingInheritedRoles,
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
  isRole,
  getDistinctRoles,
  getDistinctPermissions
}

function init (opts = { backend: 'memory' }) {
  const models = require('./lib/models')(opts.backend)

  AllowModel = models.AllowModel
  RoleUserModel = models.RoleUserModel
  RoleParentsModel = models.RoleParentsModel
  UserModel = models.UserModel

  return init
}

Object.assign(init, methods)

module.exports = init({ backend: 'memory' })
