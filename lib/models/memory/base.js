const _ = require('lodash')

class BaseModel {
  static list = []

  static async findOneAndUpdate (where, update, options) {
    const doc = this.list.find(_.matches(where))
    if (doc) _.assign(doc, update)
    else this.list.push(update)
    return doc || update
  }

  static async remove (where) {
    _.remove(this.list, _.matches(where))
  }

  static async countDocuments (where) {
    return this.list.filter(doc => {
      return (
        doc.resource == where.resource &&
        (where.permission.$in ? where.permission.$in.includes(doc.permission) : where.permission == doc.permission) &&
        where.role.$in.includes(doc.role)
      )
    }).length
  }

  static find (where) {
    return _.filter(this.list, _.matches(where))
  }

  static findOne (where) {
    return _.find(
      this.list,
      where.name?.$in ? doc => doc.userId == where.userId && where.name.$in.includes(doc.name) : _.matches(where)
    )
  }

  static distinct (property) {
    return _.uniqBy(this.list, property).map(a => a[property])
  }
}

module.exports = BaseModel
