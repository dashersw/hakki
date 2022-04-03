declare module 'hakki'

import { Document } from 'mongoose'

type AccessRule = {
  role: string
  resource: string
  permission: string
}

type RoleParents = {
  role: string
  parents: string[]
}

type User = {
  userId: string
}

type RemovalResponse = {
  n: number
  ok: number
  deletedCount: number
}

type BulkAccessRuleRequest = {
  roles: string | string[]
  allows: {
    resources: string | string[]
    permissions: string | string[]
  }[]
}

interface RoleParentsDocument extends RoleParents, Document {}
interface AccessRuleDocument extends AccessRule, Document {}
interface UserDocument extends User, Document {}

type hakki = {
  addUserRoles(userId: string, roles: string | string[]): Promise<UserDocument>

  removeUserRoles(userId: string, roles: string | string[]): Promise<void>

  userRoles(userId: string): Promise<string[]>

  roleUsers(role: string): Promise<string[]>

  hasRole(userId: string, role: string | string[]): Promise<boolean>

  addRoleParents(
    role: string,
    parents: string | string[]
  ): Promise<RoleParentsDocument>

  removeRoleParents(role: string): Promise<RemovalResponse>

  removeRoleParents(
    role: string,
    parents?: string | string[]
  ): Promise<RoleParentsDocument>

  removeRole(role: string): Promise<void>

  removeResource(resource: string): Promise<void>

  allow(
    bulkAccessRuleRequest: BulkAccessRuleRequest | BulkAccessRuleRequest[]
  ): Promise<AccessRuleDocument[]>

  allow(
    roles: string | string[],
    resources: string | string[],
    permissions: string | string[]
  ): Promise<AccessRuleDocument[]>

  removeAllow(
    roles: string | string[],
    resources: string | string[],
    permissions: string | string[]
  ): Promise<RemovalResponse[]>

  allowedPermissions<T extends string, U = { [K in T]: string[] }>(
    userId: string,
    resources: T | T[]
  ): Promise<U>

  isAllowed(
    userId: string,
    resource: string,
    permissions: string | string[]
  ): Promise<boolean>

  areAnyRolesAllowed(
    roles: string[],
    resource: string,
    permissions: string[]
  ): Promise<boolean>

  whatResources(
    role: string | string[],
    permissions: string | string[]
  ): Promise<string[] | Record<string, string[]>>

  isRole(userId: string, role: string): Promise<boolean>

  getDistinctRoles(): Promise<string[]>

  getDistinctPermissions(): Promise<string[]>

  roleUsersWithParentRoles(role: string): Promise<string[]>

  roleUsersIncludingInheritedRoles(role: string | string[]): Promise<string[]>
}

declare const module: hakki & ((opts) => hakki)

export default module
