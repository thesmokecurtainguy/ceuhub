import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get user's enrolled courses (student view) - from ALL organizations
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              slides: true,
            },
          },
        },
      },
    },
    orderBy: {
      enrolledAt: 'desc',
    },
  })

  // Group by organization for display
  const coursesByOrg = enrollments.reduce((acc: any, enrollment: any) => {
    const orgName = enrollment.course.organization?.name || 'No Organization'
    if (!acc[orgName]) {
      acc[orgName] = []
    }
    acc[orgName].push(enrollment)
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-600">Continue your learning journey across all organizations</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(coursesByOrg).map(([orgName, orgEnrollments]: [string, any]) => (
            <div key={orgName}>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{orgName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orgEnrollments.map((enrollment: any) => (
                  <div key={enrollment.id} className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {enrollment.course.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {enrollment.course.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">
                        Progress: {enrollment.progressSlide} / {enrollment.course._count.slides} slides
                      </span>
                      {enrollment.completedAt && (
                        <span className="text-sm text-green-600 font-semibold">✓ Completed</span>
                      )}
                    </div>

                    <Link
                      href={
                        enrollment.completedAt
                          ? `/courses/${enrollment.course.id}`
                          : `/courses/${enrollment.course.id}/slide/${enrollment.progressSlide + 1}`
                      }
                      className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {enrollment.completedAt ? 'View Course' : 'Continue'}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
