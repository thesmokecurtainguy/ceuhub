import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Verify membership
  const membership = await getOrganizationMembership(id, session.user.id)
  if (!membership) {
    redirect('/organizations')
  }
  const isAdmin = membership.role === 'admin'

  // Get organization
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
    },
  })

  if (!organization) {
    redirect('/organizations')
  }

  // Get organization courses ONLY (data isolation)
  const courses = await prisma.course.findMany({
    where: { organizationId: id },
    include: {
      _count: {
        select: {
          enrollments: true,
          slides: true,
          questions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get enrollments in THIS organization's courses ONLY
  const enrollments = await prisma.enrollment.findMany({
    where: {
      course: {
        organizationId: id,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          aiaNumber: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
    take: 10, // Recent enrollments
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
        <p className="text-gray-600 mt-1 capitalize">{organization.type.replace('_', ' ')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500">Members</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{organization._count.members}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500">Courses</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{organization._count.courses}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500">Certificate Batches</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{organization._count.batches}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm font-medium text-gray-500">Active Subscriptions</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {organization._count.subscriptions}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {isAdmin && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={`/org/${id}/courses/new`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Course</h3>
            <p className="text-sm text-gray-600">Add a new course to your organization</p>
          </Link>
          <Link
            href={`/org/${id}/members`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Members</h3>
            <p className="text-sm text-gray-600">Add or remove organization members</p>
          </Link>
          <Link
            href={`/org/${id}/settings`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Configure organization settings</p>
          </Link>
        </div>
      )}

      {/* Courses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Courses</h2>
          {isAdmin && (
            <Link
              href={`/org/${id}/courses/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Course
            </Link>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No courses yet.</p>
            {isAdmin && (
              <Link
                href={`/org/${id}/courses/new`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Create Your First Course
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">AIA Course #:</span> {course.aiaCourseNumber}
                  </div>
                  <div>
                    <span className="font-medium">Enrollments:</span> {course._count.enrollments}
                  </div>
                  <div>
                    <span className="font-medium">Slides:</span> {course._count.slides}
                  </div>
                </div>

                <Link
                  href={`/courses/${course.id}`}
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Manage Course
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Enrollments (Students who took THIS org's courses) */}
      {enrollments.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Students</h2>
            <Link
              href={`/org/${id}/students`}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {enrollment.user.name || enrollment.user.email}
                      </div>
                      <div className="text-sm text-gray-500">{enrollment.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enrollment.course.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {enrollment.completedAt ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                          In Progress
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
