import { prisma } from '@/lib/db'
import { CourseDetail } from '@/components/courses/CourseDetail'
import { notFound } from 'next/navigation'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const course = await prisma.course.findUnique({
    where: { id },
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
          questions: true,
          enrollments: true,
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CourseDetail course={course} />
    </div>
  )
}
