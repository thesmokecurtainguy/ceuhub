import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserOrganizations } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const organizations = await getUserOrganizations()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Organizations</h1>
        <Link
          href="/organizations/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Create Organization
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You don't belong to any organizations yet.</p>
          <Link
            href="/organizations/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Create Your First Organization
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org: any) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{org.name}</h3>
                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  {org.role}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Type:</span>{' '}
                  <span className="capitalize">{org.type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="font-medium">Email:</span> {org.email}
                </div>
                {org._count && (
                  <>
                    <div>
                      <span className="font-medium">Members:</span> {org._count.members}
                    </div>
                    <div>
                      <span className="font-medium">Courses:</span> {org._count.courses}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <span className="text-sm text-blue-600 hover:text-blue-800">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
