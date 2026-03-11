import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationCoursesPage({
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
  })

  if (!organization) {
    redirect('/organizations')
  }

  // Get ALL courses for THIS organization ONLY (data isolation)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href={`/org/${id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Organization
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-1">{organization.name}</p>
          </div>
          {isAdmin && (
            <Link
              href={`/org/${id}/courses/new`}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Create Course
            </Link>
          )}
        </div>
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
                <div>
                  <span className="font-medium">Questions:</span> {course._count.questions}
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
  )
}
