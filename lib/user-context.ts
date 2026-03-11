import { getCurrentUser, getUserOrganizations } from './permissions'

export type UserContext = {
  role: 'student' | 'organization_admin' | 'rep' | 'platform_admin' | null
  hasOrganizations: boolean
  organizationCount: number
  isPlatformAdmin: boolean
  isOrganizationUser: boolean
  isStudent: boolean
}

/**
 * Get user context for determining UI/access
 */
export async function getUserContext(): Promise<UserContext> {
  const user = await getCurrentUser()
  const organizations = await getUserOrganizations()
  
  const isPlatformAdmin = user?.role === 'platform_admin'
  const hasOrganizations = organizations.length > 0
  const isOrganizationUser = hasOrganizations || user?.role === 'organization_admin' || user?.role === 'rep'
  const isStudent = !isOrganizationUser && !isPlatformAdmin

  return {
    role: (user?.role as any) || null,
    hasOrganizations,
    organizationCount: organizations.length,
    isPlatformAdmin,
    isOrganizationUser,
    isStudent,
  }
}
