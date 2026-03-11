import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check membership
  const membership = await getOrganizationMembership(id, session.user.id)
  const userRecord = await prisma.user.findUnique({ where: { id: session.user.id } }); const isPlatformAdmin = userRecord?.role === 'platform_admin'

  if (!membership && !isPlatformAdmin) {
    redirect('/organizations')
  }

  // Get organization details
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true,
          courses: true,
          batches: true,
          subscriptions: true,
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
  })

  if (!organization) {
    notFound()
  }

  const isAdmin = membership?.role === 'admin' || isPlatformAdmin

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/organizations"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Organizations
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600 mt-1 capitalize">
              {organization.type.replace('_', ' ')}
            </p>
          </div>
          {isAdmin && (
            <Link
              href={`/organizations/${id}/settings`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Edit Settings
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Organization Information
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.email}</dd>
              </div>
              {organization.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{organization.phone}</dd>
                </div>
              )}
              {organization.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.address}
                    {organization.city && `, ${organization.city}`}
                    {organization.state && `, ${organization.state}`}
                    {organization.zip && ` ${organization.zip}`}
                  </dd>
                </div>
              )}
              {organization.aiaProviderNumber && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">AIA Provider Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {organization.aiaProviderNumber}
                  </dd>
                </div>
              )}
              {organization.parent && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Parent Organization</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <Link
                      href={`/organizations/${organization.parent.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {organization.parent.name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Hierarchy */}
          {organization.children.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Child Organizations
              </h2>
              <div className="space-y-2">
                {organization.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/organizations/${child.id}`}
                    className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">{child.name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {child.type.replace('_', ' ')}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Members</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {organization._count.members}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Courses</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {organization._count.courses}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Certificate Batches</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {organization._count.batches}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Subscriptions</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {organization._count.subscriptions}
                </dd>
              </div>
            </dl>
          </div>

          {/* Your Role */}
          {membership && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Role</h2>
              <div className="flex items-center">
                <span className="px-3 py-1 text-sm font-medium rounded bg-blue-100 text-blue-800 capitalize">
                  {membership.role}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
