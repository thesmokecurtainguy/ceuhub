'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [userContext, setUserContext] = useState<any>(null)

  useEffect(() => {
    if (session) {
      fetch('/api/users/context')
        .then(res => res.json())
        .then(data => setUserContext(data))
        .catch(() => setUserContext({ isStudent: true }))
    }
  }, [session])

  if (!session) return null

  // Extract organization ID from pathname if in org section
  const orgIdMatch = pathname?.match(/^\/org\/([^/]+)/)
  const orgId = orgIdMatch ? orgIdMatch[1] : null

  // Show different navigation based on context
  // Default to student view if context not loaded yet
  const isStudent = !userContext || userContext.isStudent
  const isOrgUser = userContext?.isOrganizationUser
  const isPlatformAdmin = userContext?.isPlatformAdmin
  const isInOrgSection = pathname?.startsWith('/org') && orgId

  // Student Navigation (default)
  if (isStudent && !isOrgUser && !isPlatformAdmin && !isInOrgSection) {
    return (
      <nav className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Courses
            </Link>
            <Link
              href="/courses"
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname?.startsWith('/courses') && pathname !== '/courses/new'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Courses
            </Link>
            <Link
              href="/dashboard/certificates"
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/dashboard/certificates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Certificates
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  // Organization Navigation (when in org section)
  if (isInOrgSection && orgId) {
    return (
      <nav className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href={`/org/${orgId}`}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === `/org/${orgId}`
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href={`/org/${orgId}/courses`}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname?.startsWith(`/org/${orgId}/courses`)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Courses
            </Link>
            <Link
              href={`/org/${orgId}/students`}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname?.startsWith(`/org/${orgId}/students`)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Students
            </Link>
            <Link
              href={`/org/${orgId}/certificates`}
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname?.startsWith(`/org/${orgId}/certificates`)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Certificates
            </Link>
            {isPlatformAdmin && (
              <Link
                href="/admin"
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  pathname?.startsWith('/admin')
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-purple-500 hover:text-purple-700 hover:border-purple-300'
                }`}
              >
                Platform Admin
              </Link>
            )}
          </div>
        </div>
      </nav>
    )
  }

  // Default organization navigation (when not in org section but user is org user)
  if (isOrgUser || isPlatformAdmin) {
    return (
      <nav className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/org"
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname?.startsWith('/org')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Organization
            </Link>
            <Link
              href="/dashboard"
              className={`border-b-2 px-1 py-4 text-sm font-medium ${
                pathname === '/dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Courses
            </Link>
            {isPlatformAdmin && (
              <Link
                href="/admin"
                className={`border-b-2 px-1 py-4 text-sm font-medium ${
                  pathname?.startsWith('/admin')
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-purple-500 hover:text-purple-700 hover:border-purple-300'
                }`}
              >
                Platform Admin
              </Link>
            )}
          </div>
        </div>
      </nav>
    )
  }

  return null
}
