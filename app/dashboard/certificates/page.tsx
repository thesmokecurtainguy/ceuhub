import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Certificate } from '@/types'

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const certificates = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          aiaCourseNumber: true,
          learningUnits: true,
          learningUnitsType: true,
        },
      },
      quizAttempt: {
        select: {
          score: true,
          completedAt: true,
        },
      },
    },
    orderBy: {
      generatedAt: 'desc',
    },
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Certificates</h1>

      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You don't have any certificates yet.</p>
          <Link
            href="/courses"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate: any) => {
            if (!certificate.course || !certificate.quizAttempt) return null
            return (
            <div key={certificate.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {certificate.course.title}
              </h3>
              
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">AIA Course #:</span> {certificate.course.aiaCourseNumber}
                </div>
                <div>
                  <span className="font-medium">Score:</span> {certificate.quizAttempt.score.toFixed(1)}%
                </div>
                <div>
                  <span className="font-medium">Learning Units:</span>{' '}
                  {certificate.course.learningUnits} {certificate.course.learningUnitsType}
                </div>
                <div>
                  <span className="font-medium">Completed:</span>{' '}
                  {new Date(certificate.quizAttempt.completedAt).toLocaleDateString()}
                </div>
              </div>

              <a
                href={certificate.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Download Certificate
              </a>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}