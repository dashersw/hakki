const BaseModel = require('./base')

class Role extends BaseModel {
  static list = []
  // {role: 'role1', parents: ['role2', 'role3']}
  // {role: 'role2', parents: ['role4', 'role5']}
  // {role: 'role3', parents: ['role6', 'role7']}

  static async getAllParentRolesOfRole(role) {
    // return []//[{allParentRoles: []}]
    if (!role.length) return []

    console.log('get all parent roles of role params', role, this.list)
    const children = this.list.filter(item => role.includes(item.role))  // [{role: 'role1', parents: ['role2', 'role3']}]
    console.log('children', children)
    if (!children.length) return []

    const parents = children.flatMap(c => c.parents) // ['role2', 'role3']
    console.log('ne bu parents', children)
    if (!parents) return [...children]

    const rv = [...parents, ...parents.map(parent => this.getAllParentRolesOfRole([parent]))]
    console.log('rv', rv)
    return [{ allParentRoles: rv }]
  }

  static async findOneAndUpdate(doc, update, upsertOpts) {
    let item = this.list.find(item => item.role == doc.role)

    if (update.$addToSet) {
      if (!item) {
        item = {role: doc.role, parents: update.$addToSet.parents.$each}
        this.list.push(item)
      }

      item.parents.concat(...update.$addToSet.parents.$each)
    }
    else if (update.$pullAll) {

    }
  }
}

module.exports = Role

// roleParentsSchema.statics.getAllParentRolesOfRole = function (role) {
//   return this.aggregate()
//     .match({ role: { $in: role } })
//     .graphLookup({
//       from: 'acl_role_parents',
//       startWith: '$role',
//       connectFromField: 'parents',
//       connectToField: 'role',
//       as: 'allParents'
//     })
//     .project({
//       allParentRoles: '$allParents.parents'
//     })
// }