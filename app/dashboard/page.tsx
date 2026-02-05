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

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          aiaCourseNumber: true,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Courses</h1>

      {enrollments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment: any) => (
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
      )}
    </div>
  )
}
