'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function Navigation() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="bg-gray-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <Link
            href="/dashboard"
            className="border-b-2 border-blue-600 text-blue-600 px-1 py-4 text-sm font-medium"
          >
            My Courses
          </Link>
          <Link
            href="/courses"
            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 py-4 text-sm font-medium"
          >
            Browse Courses
          </Link>
          <Link
            href="/dashboard/certificates"
            className="border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 px-1 py-4 text-sm font-medium"
          >
            Certificates
          </Link>
        </div>
      </div>
    </nav>
  )
}


