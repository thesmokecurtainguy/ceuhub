'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Header() {
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

  const isOrgUser = userContext?.isOrganizationUser
  const isPlatformAdmin = userContext?.isPlatformAdmin
  const isInOrgSection = pathname?.startsWith('/org')
  const isInAdminSection = pathname?.startsWith('/admin')

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            ceuHUB
          </Link>
          
          <nav className="flex items-center space-x-4">
            {session ? (
              <>
                {/* Student Links */}
                {!isInOrgSection && !isInAdminSection && (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/courses"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Browse Courses
                    </Link>
                    <Link
                      href="/dashboard/certificates"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      My Certificates
                    </Link>
                  </>
                )}

                {/* Organization/Admin Links */}
                {(isOrgUser || isPlatformAdmin) && (
                  <>
                    {isInOrgSection && (
                      <Link
                        href="/dashboard"
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Student View
                      </Link>
                    )}
                    {!isInOrgSection && (
                      <Link
                        href="/org"
                        className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Organization
                      </Link>
                    )}
                  </>
                )}

                {/* Platform Admin Link */}
                {isPlatformAdmin && (
                  <Link
                    href="/admin"
                    className="text-purple-700 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium font-semibold"
                  >
                    Admin
                  </Link>
                )}

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
