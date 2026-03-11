import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './db'
import { NextResponse } from 'next/server'

export type OrganizationRole = 'admin' | 'rep' | 'viewer'
export type UserRole = 'platform_admin' | 'organization_admin' | 'rep' | 'student'

/**
 * Get the current user's session
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return await prisma.user.findUnique({
    where: { id: session.user.id },
  })
}

/**
 * Check if user is a platform admin
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'platform_admin'
}

/**
 * Get user's membership in an organization
 */
export async function getOrganizationMembership(
  organizationId: string,
  userId?: string
) {
  if (!userId) {
    const user = await getCurrentUser()
    if (!user) return null
    userId = user.id
  }

  return await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
    },
  })
}

/**
 * Check if user belongs to an organization
 */
export async function belongsToOrganization(
  organizationId: string,
  userId?: string
): Promise<boolean> {
  const membership = await getOrganizationMembership(organizationId, userId)
  return membership !== null
}

/**
 * Check if user has a specific role in an organization
 */
export async function hasOrganizationRole(
  organizationId: string,
  role: OrganizationRole | OrganizationRole[],
  userId?: string
): Promise<boolean> {
  const membership = await getOrganizationMembership(organizationId, userId)
  if (!membership) return false

  const roles = Array.isArray(role) ? role : [role]
  return roles.includes(membership.role as OrganizationRole)
}

/**
 * Check if user is organization admin
 */
export async function isOrganizationAdmin(
  organizationId: string,
  userId?: string
): Promise<boolean> {
  return hasOrganizationRole(organizationId, 'admin', userId)
}

/**
 * Require authentication - returns user or throws 401
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require organization membership - returns membership or throws 403
 */
export async function requireOrganizationMembership(organizationId: string) {
  const user = await requireAuth()
  const membership = await getOrganizationMembership(organizationId, user.id)
  if (!membership) {
    throw new Error('Forbidden: Not a member of this organization')
  }
  return membership
}

/**
 * Require organization admin role - throws 403 if not admin
 */
export async function requireOrganizationAdmin(organizationId: string) {
  const membership = await requireOrganizationMembership(organizationId)
  if (membership.role !== 'admin') {
    throw new Error('Forbidden: Organization admin access required')
  }
  return membership
}

/**
 * Get all organizations a user belongs to
 */
export async function getUserOrganizations(userId?: string) {
  if (!userId) {
    const user = await getCurrentUser()
    if (!user) return []
    userId = user.id
  }

  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              members: true,
              courses: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return memberships.map((m) => ({
    ...m.organization,
    role: m.role,
    joinedAt: m.createdAt,
  }))
}

/**
 * Helper to return error responses
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 })
}
