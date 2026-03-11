import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationStudentsPage({
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

  // Get organization
  const organization = await prisma.organization.findUnique({
    where: { id },
  })

  if (!organization) {
    redirect('/organizations')
  }

  // Get ALL enrollments in THIS organization's courses ONLY (data isolation)
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
          aiaCourseNumber: true,
        },
      },
      certificates: {
        select: {
          id: true,
          certificateNumber: true,
          generatedAt: true,
        },
        take: 1,
        orderBy: {
          generatedAt: 'desc',
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  })

  // Get contacts from CSV uploads (bulk certificates) for THIS organization
  const contacts = await prisma.contact.findMany({
    where: {
      sourceBatchId: { not: null },
      organizationId: id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href={`/org/${id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Organization
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Students & Contacts</h1>
        <p className="text-gray-600 mt-1">
          Students who have taken your courses and contacts from CSV uploads
        </p>
      </div>

      {/* Students from Course Enrollments */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Students ({enrollments.length})
        </h2>
        {enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No students have enrolled in your courses yet.</p>
          </div>
        ) : (
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
                    AIA #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Enrolled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificate
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
                      {enrollment.user.aiaNumber || '-'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {enrollment.certificates.length > 0 ? (
                        <span className="text-green-600">✓ Issued</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contacts from CSV Uploads */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Contacts from CSV Uploads ({contacts.length})
        </h2>
        {contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No contacts from CSV uploads yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    AIA #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact: any) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.aiaNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
