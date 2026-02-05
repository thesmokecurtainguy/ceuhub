import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { notFound } from 'next/navigation'

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: {
          questionNumber: 'asc',
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  if (course.questions.length !== 10) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800">
            This course does not have a complete quiz yet. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Get user's enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: id,
      },
    },
  })

  if (!enrollment) {
    redirect(`/courses/${id}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <QuizContainer
        courseId={id}
        enrollmentId={enrollment.id}
        questions={course.questions}
      />
    </div>
  )
}
