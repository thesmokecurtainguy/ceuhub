import { prisma } from '@/lib/db'
import { CourseCard } from '@/components/courses/CourseCard'
import { Course } from '@/types'

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      presenter: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          slides: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Courses</h1>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course: Course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
