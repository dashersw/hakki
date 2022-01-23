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

export function addUserRoles(userId: string, roles: string | string[]): Promise<UserDocument>

export function removeUserRoles(userId: string, roles: string | string[]): Promise<void>

export function userRoles(userId: string): Promise<string[]>

export function roleUsers(role: string): Promise<string[]>

export function hasRole(userId: string, role: string | string[]): Promise<boolean>

export function addRoleParents(role: string, parents: string | string[]): Promise<RoleParentsDocument>

export function removeRoleParents(role: string): Promise<RemovalResponse>
export function removeRoleParents(role: string, parents?: string | string[]): Promise<RoleParentsDocument>

export function removeRole(role: string): Promise<void>

export function removeResource(resource: string): Promise<void>

export function allow(
  bulkAccessRuleRequest: BulkAccessRuleRequest | BulkAccessRuleRequest[]
): Promise<AccessRuleDocument[]>

export function allow(
  roles: string | string[],
  resources: string | string[],
  permissions: string | string[]
): Promise<AccessRuleDocument[]>

export function removeAllow(
  roles: string | string[],
  resources: string | string[],
  permissions: string | string[]
): Promise<RemovalResponse[]>

export function allowedPermissions<T extends string, U = { [K in T]: string[] }>(
  userId: string,
  resources: T | T[]
): Promise<U>

export function isAllowed(userId: string, resource: string, permissions: string | string[]): Promise<boolean>

export function areAnyRolesAllowed(roles: string[], resource: string, permissions: string[]): Promise<boolean>

export function whatResources(
  role: string | string[],
  permissions: string | string[]
): Promise<string[] | Record<string, string[]>>

export function isRole(userId: string, role: string): Promise<boolean>

export function getDistinctRoles(): Promise<string[]>

export function getDistinctPermissions(): Promise<string[]>
