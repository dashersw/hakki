const  _ = require('lodash')

class BaseModel {
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
    // console.log('count documents', this.list)
    return this.list.filter(doc => {
      return doc.resource == where.resource &&
        (where.permission.$in ? where.permission.$in.includes(doc.permission) : where.permission == doc.permission) &&
        where.role.$in.includes(doc.role)
    }).length
  }

  static find (where) {
    const list = this.list
    return {
      async lean() {
        return _.filter(list, _.matches(where))
      }
    }
  }

  static findOne (where) {
    const list = this.list

    return {
      async lean() {
        return _.find(list, where.name.$in ? doc => doc.userId == where.userId && where.name.$in.includes(doc.name) : _.matches(where))
      }
    }
  }

  static async distinct (key) {
    return _
      .chain(this.contructor.list)
      .map(doc => doc[key])
      .uniq()
      .value()
  }

  static list = []
}

module.exports = BaseModel
