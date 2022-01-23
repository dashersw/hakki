const test = require('ava')
const mongoose = require('mongoose')
const hakki = require('../')
const randomstring = require('randomstring')

test.before(async t => {
  await mongoose.connect('mongodb://localhost:27017/hakki_tests', { useNewUrlParser: true })
  await mongoose.connection.db.dropDatabase()
})

test.serial('Own tests', async t => {
  await hakki.addUserRoles('user1', ['role1', 'role2', 'role3'])
  let roles = await hakki.userRoles('user1')

  t.deepEqual(roles.sort(), ['role1', 'role2', 'role3'])

  await hakki.removeUserRoles('user1', ['role1', 'role3'])
  roles = await hakki.userRoles('user1')

  t.deepEqual(roles, ['role2'])

  await hakki.addUserRoles('user2', ['role2'])
  const roleUsers = await hakki.roleUsers('role2')

  t.deepEqual(roleUsers, ['user1', 'user2'])

  const undefinedRoleUsers = await hakki.roleUsers('role3')

  t.deepEqual(undefinedRoleUsers, [])

  t.true(await hakki.hasRole('user1', 'role2'))
  t.false(await hakki.hasRole('user1', 'role1'))

  await hakki.removeRole('role2')

  t.false(await hakki.hasRole('user1', 'role2'))

  await hakki.allow(['role1', 'role2'], ['res1', 'res2'], ['perm1', 'perm2'])
  await hakki.allow(['role3'], ['res3'], ['perm3'])
  await hakki.addUserRoles('user1', ['role1', 'role2', 'role3'])

  const perms = await hakki.allowedPermissions('user1', ['res1', 'res2'])
  perms.res1.sort()
  perms.res2.sort()

  t.deepEqual(perms, {
    res1: ['perm1', 'perm2'],
    res2: ['perm1', 'perm2']
  })

  const perm = await hakki.allowedPermissions('user1', ['res3'])
  t.deepEqual(perm, { res3: ['perm3'] })

  t.true(await hakki.isAllowed('user1', 'res1', ['perm1']))
  t.true(await hakki.isAllowed('user1', 'res1', ['perm1', 'perm2']))
  t.false(await hakki.isAllowed('user1', 'res3', ['perm1', 'perm2']))

  t.true(await hakki.areAnyRolesAllowed(['role1', 'role2'], 'res1', ['perm2']))
  t.true(await hakki.areAnyRolesAllowed(['role1', 'role3'], 'res1', ['perm2']))
  t.true(await hakki.areAnyRolesAllowed(['role1', 'role3'], 'res3', ['perm3']))
  t.false(await hakki.areAnyRolesAllowed(['role1', 'role2'], 'res3', ['perm3']))

  const res = await hakki.whatResources('role1')
  t.true(res.res1.indexOf('perm1') > -1 && res.res1.indexOf('perm2') > -1)
  t.true(res.res2.indexOf('perm1') > -1 && res.res2.indexOf('perm2') > -1)

  t.deepEqual(await hakki.whatResources('role3'), { res3: ['perm3'] })

  await hakki.allow(['role1'], ['res4'], ['perm1', 'perm2', 'perm3'])
  const res2 = await hakki.whatResources('role1', ['perm1', 'perm2', 'perm3'])
  t.deepEqual(res2, ['res4'])

  await hakki.removeAllow(['role1', 'role2'], ['res1', 'res2'], ['perm1', 'perm2'])
})

/*
 * These tests are adapted from https://github.com/OptimalBits/node_acl/blob/master/test/tests.js
 * and cover all unit tests from node_acl.
 */
test.serial('node_acl tests', async t => {
  await hakki.allow('guest', 'blogs', 'view')
  await hakki.allow('guest', 'forums', 'view')
  await hakki.allow('member', 'blogs', ['edit', 'view', 'delete'])
  await hakki.addUserRoles('joed', 'guest')
  await hakki.addUserRoles('jsmith', 'member')
  await hakki.addUserRoles('harry', 'admin')
  await hakki.addUserRoles('test@test.com', 'member')
  await hakki.addUserRoles(0, 'guest')
  await hakki.addUserRoles(1, 'member')
  await hakki.addUserRoles(2, 'admin')

  t.deepEqual(await hakki.userRoles('harry'), ['admin'])
  t.true(await hakki.hasRole('harry', 'admin'))
  t.false(await hakki.hasRole('harry', 'no role'))
  t.true((await hakki.roleUsers('admin')).includes('harry'))
  t.false((await hakki.roleUsers('admin')).includes('invalid User'))

  await hakki.allow('admin', 'users', ['add', 'edit', 'view', 'delete'])
  await hakki.allow('foo', 'blogs', ['edit', 'view'])
  await hakki.allow('bar', 'blogs', ['view', 'delete'])
  await hakki.addRoleParents('baz', ['foo', 'bar'])
  await hakki.addUserRoles('james', 'baz')
  await hakki.addUserRoles(3, 'baz')

  await hakki.allow('admin', ['blogs', 'forums'], '*')
  await hakki.allow([
    {
      roles: 'fumanchu',
      allows: [
        { resources: 'blogs', permissions: 'get' },
        { resources: ['forums', 'news'], permissions: ['get', 'put', 'delete'] },
        { resources: ['/path/file/file1.txt', '/path/file/file2.txt'], permissions: ['get', 'put', 'delete'] }
      ]
    }
  ])

  await hakki.addUserRoles('suzanne', 'fumanchu')
  await hakki.addUserRoles(4, 'fumanchu')

  const isAllowedChecks = [
    [['joed', 'blogs', 'view'], true],
    [[0, 'blogs', 'view'], true],
    [['joed', 'forums', 'view'], true],
    [[0, 'forums', 'view'], true],
    [['joed', 'forums', 'edit'], false],
    [[0, 'forums', 'edit'], false],
    [['jsmith', 'forums', 'edit'], false],
    [['jsmith', 'blogs', 'edit'], true],
    [['test@test.com', 'forums', 'edit'], false],
    [['test@test.com', 'forums', 'edit'], false],
    [['test@test.com', 'blogs', 'edit'], true],
    [[1, 'blogs', 'edit'], true],
    [['jsmith', 'blogs', ['edit', 'view', 'clone']], false],
    [['test@test.com', 'blogs', ['edit', 'view', 'clone']], false],
    [[1, 'blogs', ['edit', 'view', 'clone']], false],
    [['jsmith', 'blogs', ['edit', 'clone']], false],
    [['test@test.com', 'blogs', ['edit', 'clone']], false],
    [[1, 'blogs', ['edit', 'clone']], false],
    [['james', 'blogs', 'add'], false],
    [[3, 'blogs', 'add'], false],
    [['suzanne', 'blogs', 'add'], false],
    [[4, 'blogs', 'add'], false],
    [['suzanne', 'blogs', 'get'], true],
    [[4, 'blogs', 'get'], true],
    [['suzanne', 'news', ['delete', 'put']], true],
    [[4, 'news', ['delete', 'put']], true],
    [['suzanne', 'forums', ['delete', 'put']], true],
    [[4, 'forums', ['delete', 'put']], true],
    [['nobody', 'blogs', 'view'], false],
    [['nobody', 'nothing', 'view'], false]
  ]

  const promises = isAllowedChecks.map(c => hakki.isAllowed(...c[0]))
  const results = await Promise.all(promises)
  t.deepEqual(
    results,
    isAllowedChecks.map(c => c[1])
  )

  let perms = await hakki.allowedPermissions('james', ['blogs', 'forums'])
  t.true('blogs' in perms)
  t.true('forums' in perms)
  t.true(perms.blogs.includes('edit'))
  t.true(perms.blogs.includes('delete'))
  t.true(perms.blogs.includes('view'))
  t.is(perms.forums.length, 0)

  perms = await hakki.allowedPermissions(3, ['blogs', 'forums'])
  t.true('blogs' in perms)
  t.true('forums' in perms)
  t.true(perms.blogs.includes('edit'))
  t.true(perms.blogs.includes('delete'))
  t.true(perms.blogs.includes('view'))
  t.is(perms.forums.length, 0)

  let res = await hakki.whatResources('bar')
  t.true(res.blogs.includes('view'))
  t.true(res.blogs.includes('delete'))

  res = await hakki.whatResources('bar', 'view')
  t.true(res.includes('blogs'))

  res = await hakki.whatResources('fumanchu')
  t.true(res.blogs.includes('get'))
  t.true(res.forums.includes('delete'))
  t.true(res.forums.includes('get'))
  t.true(res.forums.includes('put'))
  t.true(res.news.includes('delete'))
  t.true(res.news.includes('get'))
  t.true(res.news.includes('put'))
  t.true(res['/path/file/file1.txt'].includes('delete'))
  t.true(res['/path/file/file1.txt'].includes('get'))
  t.true(res['/path/file/file1.txt'].includes('put'))
  t.true(res['/path/file/file2.txt'].includes('delete'))
  t.true(res['/path/file/file2.txt'].includes('get'))
  t.true(res['/path/file/file2.txt'].includes('put'))

  res = await hakki.whatResources('baz')

  t.true(res.blogs.includes('view'))
  t.true(res.blogs.includes('delete'))
  t.true(res.blogs.includes('edit'))

  await hakki.removeAllow('fumanchu', ['blogs', 'forums'], 'get')
  await hakki.removeAllow('fumanchu', 'news', 'delete')
  await hakki.removeAllow('bar', 'blogs', 'view')

  res = await hakki.whatResources(['fumanchu'])

  t.false('blogs' in res)
  t.true('news' in res)
  t.true(res.news.includes('get'))
  t.true(res.news.includes('put'))
  t.false(res.news.includes('delete'))
  t.true('forums' in res)
  t.true(res.forums.includes('delete'))
  t.true(res.forums.includes('put'))

  await hakki.removeRole('fumanchu')
  await hakki.removeRole('member')
  await hakki.removeRole('foo')

  res = await hakki.whatResources('fumanchu')
  t.is(res.length, 0)

  res = await hakki.whatResources('member')
  t.is(res.length, 0)

  perms = await hakki.allowedPermissions('jsmith', ['blogs', 'forums'])
  t.is(perms.blogs.length, 0)
  t.is(perms.forums.length, 0)

  perms = await hakki.allowedPermissions('test@test.com', ['blogs', 'forums'])
  t.is(perms.blogs.length, 0)
  t.is(perms.forums.length, 0)

  perms = await hakki.allowedPermissions('james', 'blogs')
  t.true('blogs' in perms)
  t.true(perms.blogs.includes('delete'))

  await hakki.allow('parent1', 'x', 'read1')
  await hakki.allow('parent2', 'x', 'read2')
  await hakki.allow('parent3', 'x', 'read3')
  await hakki.allow('parent4', 'x', 'read4')
  await hakki.allow('parent5', 'x', 'read5')
  await hakki.addRoleParents('child', ['parent1', 'parent2', 'parent3', 'parent4', 'parent5'])

  res = await hakki.whatResources('child')
  t.is(res.x.length, 5)

  await hakki.removeRoleParents('child', 'parentX')
  await hakki.removeRoleParents('child', ['parentX', 'parentY'])

  await hakki.removeRoleParents('child', 'parentX')
  t.is(res.x.length, 5)
  t.true(res.x.includes('read1'))
  t.true(res.x.includes('read2'))
  t.true(res.x.includes('read3'))
  t.true(res.x.includes('read4'))
  t.true(res.x.includes('read5'))

  await hakki.removeRoleParents('child', 'parent1')
  res = await hakki.whatResources('child')
  t.is(res.x.length, 4)
  t.true(res.x.includes('read2'))
  t.true(res.x.includes('read3'))
  t.true(res.x.includes('read4'))
  t.true(res.x.includes('read5'))

  await hakki.removeRoleParents('child', ['parent2', 'parent3'])
  res = await hakki.whatResources('child')
  t.is(res.x.length, 2)
  t.true(res.x.includes('read4'))
  t.true(res.x.includes('read5'))

  await hakki.removeRoleParents('child')
  res = await hakki.whatResources('child')
  t.false('x' in res)

  await hakki.removeRoleParents('child')
  res = await hakki.whatResources('child')
  t.false('x' in res)

  await hakki.removeRoleParents('child', 'parent1')
  res = await hakki.whatResources('child')
  t.false('x' in res)

  await hakki.removeRoleParents('child')

  await hakki.removeResource('blogs')
  await hakki.removeResource('users')

  perms = await hakki.allowedPermissions('james', 'blogs')
  t.true('blogs' in perms)
  t.is(perms.blogs.length, 0)

  perms = await hakki.allowedPermissions(4, 'blogs')
  t.true('blogs' in perms)
  t.is(perms.blogs.length, 0)

  res = await hakki.whatResources('baz')
  t.is(Object.keys(res).length, 0)

  res = await hakki.whatResources('admin')
  t.false('users' in res)
  t.false('blogs' in res)

  await hakki.removeUserRoles('joed', 'guest')
  await hakki.removeUserRoles(0, 'guest')
  await hakki.removeUserRoles('harry', 'admin')
  await hakki.removeUserRoles(2, 'admin')

  perms = await hakki.allowedPermissions('harry', ['forums', 'blogs'])
  t.is(perms.forums.length, 0)

  perms = await hakki.allowedPermissions(2, ['forums', 'blogs'])
  t.is(perms.forums.length, 0)

  await hakki.addUserRoles('jannette', 'member')
  await hakki.allow('member', 'blogs', ['view', 'update'])
  t.true(await hakki.isAllowed('jannette', 'blogs', 'view'))

  await hakki.removeAllow('member', 'blogs', 'update')
  t.true(await hakki.isAllowed('jannette', 'blogs', 'view'))
  t.false(await hakki.isAllowed('jannette', 'blogs', 'update'))

  await hakki.removeAllow('member', 'blogs', 'view')
  t.false(await hakki.isAllowed('jannette', 'blogs', 'view'))

  await hakki.allow(['role1', 'role2', 'role3'], ['res1', 'res2', 'res3'], ['perm1', 'perm2', 'perm3'])

  await hakki.addUserRoles('user1', 'role1')
  await hakki.addRoleParents('role1', 'parentRole1')

  res = await hakki.whatResources('role1')
  t.deepEqual(res.res1.sort(), ['perm1', 'perm2', 'perm3'])

  res = await hakki.whatResources('role2')
  t.deepEqual(res.res1.sort(), ['perm1', 'perm2', 'perm3'])

  await hakki.removeRole('role1')

  await hakki.removeRole('role1')
  res = await hakki.whatResources('role1')
  t.is(Object.keys(res).length, 0)

  res = await hakki.whatResources('role2')
  t.deepEqual(res.res1.sort(), ['perm1', 'perm2', 'perm3'])
})

test.serial('Wildcard permissions', async t => {
  await hakki.allow('admin', 'blogs', '*')
  await hakki.allow('editor', 'blogs', 'edit')
  await hakki.addUserRoles('user1', 'admin')
  await hakki.addUserRoles('user2', 'editor')

  t.true(await hakki.isAllowed('user1', 'blogs', ['edit', 'delete']))
  t.true(await hakki.isAllowed('user2', 'blogs', 'edit'))
  t.false(await hakki.isAllowed('user2', 'blogs', 'delete'))
})

test.serial('Wildcard resources', async t => {
  await hakki.allow('admin', 'resource:*', 'edit')
  await hakki.allow('admin', 'resource:*:*', 'delete')
  await hakki.addUserRoles('user1', 'admin')

  t.true(await hakki.isAllowed('user1', 'resource:1', 'edit'))
  t.true(await hakki.isAllowed('user1', 'resource:1:1', 'edit'))
  t.true(await hakki.isAllowed('user1', 'resource:1:1', 'delete'))
  t.false(await hakki.isAllowed('user1', 'resource:1', 'delete'))
  t.false(await hakki.isAllowed('user1', 'resource:', 'edit'))
  t.false(await hakki.isAllowed('user1', 'resource1', 'edit'))
})

test.serial('isRole should return true for directly assigned roles', async t => {
  const id = randomstring.generate()

  await hakki.addRoleParents(`admin${id}`, `user${id}`)
  await hakki.addUserRoles(`person${id}`, `user${id}`)

  await hakki.allow(`admin${id}`, `resource${id}`, `manage${id}`)
  await hakki.allow(`user${id}`, `resource${id}`, `use${id}`)

  t.true(await hakki.isAllowed(`person${id}`, `resource${id}`, `use${id}`), 'Person is not allowed to use the resource')

  t.true(await hakki.isRole(`person${id}`, `user${id}`), 'Person has not inherited the user role')
})

test.serial('isRole should return true for inherited roles', async t => {
  const id = randomstring.generate()

  await hakki.addRoleParents(`admin${id}`, `user${id}`)
  await hakki.addUserRoles(`person${id}`, `admin${id}`)

  await hakki.allow(`admin${id}`, `resource${id}`, `manage${id}`)
  await hakki.allow(`user${id}`, `resource${id}`, `use${id}`)

  t.true(await hakki.isAllowed(`person${id}`, `resource${id}`, `use${id}`), 'Person is not allowed to use the resource')

  t.true(await hakki.isRole(`person${id}`, `user${id}`), 'Person has not inherited the user role')
})

test.serial('isRole on an empty role returns false', async t => {
  const id = randomstring.generate()

  t.false(await hakki.isRole(`person${id}`, `guest${id}`))
})

test.serial('isRole should return true for several layers of inherited roles', async t => {
  const id = randomstring.generate()

  await hakki.addRoleParents(`user${id}`, `guest${id}`)
  await hakki.addRoleParents(`admin${id}`, `user${id}`)
  await hakki.addUserRoles(`person${id}`, `admin${id}`)

  await hakki.allow(`admin${id}`, `resource${id}`, `manage${id}`)
  await hakki.allow(`user${id}`, `resource${id}`, `use${id}`)
  await hakki.allow(`guest${id}`, `resource${id}`, `view${id}`)

  t.true(
    await hakki.isAllowed(`person${id}`, `resource${id}`, `view${id}`),
    'Person is not allowed to view the resource'
  )

  t.true(await hakki.isRole(`person${id}`, `guest${id}`), 'Person has not inherited the guest role')

  t.true(
    await hakki.isRole(`person${id}`, [`guest${id}`, `visitor${id}`]),
    'Person has not inherited either the guest role or does not have a visitor role'
  )
})

test.serial('get parent roles', async t => {
  const id = randomstring.generate()

  await hakki.addRoleParents(`user${id}`, `guest${id}`)
  await hakki.addRoleParents(`admin${id}`, `user${id}`)
  await hakki.addUserRoles(`person${id}`, `admin${id}`)

  await hakki.allow(`admin${id}`, `resource${id}`, `manage${id}`)
  await hakki.allow(`user${id}`, `resource${id}`, `use${id}`)
  await hakki.allow(`guest${id}`, `resource${id}`, `view${id}`)

  const allowedPermissions = await hakki.allowedPermissions(`person${id}`, `resource${id}`)

  t.deepEqual(
    allowedPermissions[`resource${id}`].sort(),
    [`view${id}`, `use${id}`, `manage${id}`].sort(),
    'Person is not allowed to view the resource'
  )

  t.deepEqual(
    await hakki.whatResources(`admin${id}`, `view${id}`, `resource${id}`),
    [`resource${id}`],
    'Admin is not allowed to view the resource'
  )

  await hakki.addUserRoles(`person${id}`, [`user${id}`])

  const allowedPermissions2 = await hakki.allowedPermissions(`person${id}`, `resource${id}`)

  t.deepEqual(
    allowedPermissions2[`resource${id}`].sort(),
    [`view${id}`, `use${id}`, `manage${id}`].sort(),
    'Person is not allowed to view the resource'
  )
  // t.deepEqual(await hakki.whatResources(`admin${id}`, `view${id}`, `resource${id}`), [`resource${id}`], 'Admin is not allowed to view the resource')
})

test.serial('get distinct roles & permissions', async t => {
  await hakki.allow(['distinctrole1', 'distinctrole2'], ['res1', 'res2'], ['distinctperm1', 'distinctperm2'])
  await hakki.allow(['distinctrole1', 'distinctrole3'], ['res3', 'res4'], ['distinctperm1', 'distinctperm3'])

  let distinctRoles = await hakki.getDistinctRoles()

  const includesArray = (containerArray, subArray) => {
    return subArray.every(elem => containerArray.includes(elem))
  }

  // check whether new roles are included in the distinct roles
  t.true(includesArray(distinctRoles, ['distinctrole1', 'distinctrole2', 'distinctrole3']))

  await hakki.removeRole('distinctrole1')

  distinctRoles = await hakki.getDistinctRoles()

  t.true(includesArray(distinctRoles, ['distinctrole2', 'distinctrole3']))
  t.false(includesArray(distinctRoles, ['distinctrole1']))

  let distinctPermissions = await hakki.getDistinctPermissions()

  // check whether new permissions are included in the distinct permissions
  t.true(includesArray(distinctPermissions, ['distinctperm1', 'distinctperm2', 'distinctperm3']))

  await hakki.removeAllow(['distinctrole2'], ['res1', 'res2'], ['distinctperm1'])
  await hakki.removeAllow(['distinctrole3'], ['res3', 'res4'], ['distinctperm1'])

  distinctPermissions = await hakki.getDistinctPermissions()

  t.true(includesArray(distinctPermissions, ['distinctperm2', 'distinctperm3']))
  t.false(includesArray(distinctPermissions, ['distinctperm1']))
})

test.after(async t => {
  // await mongoose.connection.db.dropDatabase()
})
