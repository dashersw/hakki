# hakki
**An opinionated, modern, and scalable alternative to node_acl.**

## Features
* Provides the same functionality with [node_acl](https://github.com/OptimalBits/node_acl) except for `middleware`
* Works with promises and async/await out of the box instead of callbacks
* Requires and works with mongoose
* Built specifically for MongoDB with aggregation features
* Scalable architecture to support millions of operations
* Supports wildcard resources for a lighter database

## Motivation
[node_acl](https://github.com/OptimalBits/node_acl) is great until you need to scale it with MongoDB. It's originally built for redis, and MongoDB backend is problematic at scale where you modify the same document that holds 200,000 properties in it. The fact that it works on a MongoDB connection makes it hard to operate it with clusters, as well.

hakki addresses these concerns, respects your MongoDB connection logic with [mongoose](http://mongoosejs.com), and offers a modern, scalable experience both during development and for your infrastructure.

## Usage
### Installation
```bash
npm install hakki
```
### Providing mongoose
Since mongoose and MongoDB in general has a lot of connection options, and hakki only wants to focus on ACL, it expects you to have a working mongoose connection. It will create four collections in the database of your connection: `acl_allows`, `acl_role_parents`, `acl_role_users` and `acl_users`.

Just require mongoose and connect to database however you wish:

```js
const mongoose = require('mongoose')
const hakki = require('hakki')

mongoose.connect('mongodb://localhost:27017/acl', { useNewUrlParser: true })
```

After this point, hakki is ready to use.

### Example
```js
await hakki.allow(['developer', 'guest'], ['branches', 'tags'], ['list', 'fetch'])
await hakki.allow('master', ['branches', 'tags'], 'push')
await hakki.addRoleParents('master', ['developer', 'guest'])
await hakki.addUserRoles('user1', 'master')

let perms = await hakki.allowedPermissions('user1', ['branches', 'tags'])
console.log(perms)
/*
{
tags: [ 'fetch', 'push', 'list' ],
branches: [ 'fetch', 'push', 'list' ]
}
*/
```

## API
Hakki supports the same API footprint as [node_acl](https://github.com/OptimalBits/node_acl) with the following functions:

* addUserRoles
* removeUserRoles
* userRoles
* roleUsers
* hasRole
* removeRole
* allow
* removeAllow
* allowedPermissions
* isAllowed
* areAnyRolesAllowed
* whatResources
* removeResource
* addRoleParents
* removeRoleParents

All the functions use promises and no callbacks. So if you rely on callbacks with node_acl, then you will have to refactor your code to use promises, and better yet, async / await.

Also, currently there's no Express middleware support.

Please refer to [node_acl](https://github.com/OptimalBits/node_acl)'s [README](https://github.com/OptimalBits/node_acl/blob/master/README.md#documentation) for detailed documentation.

## MIT License

Copyright (c) 2018 Armagan Amcalar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

