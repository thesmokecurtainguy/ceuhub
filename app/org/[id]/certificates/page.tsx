import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationCertificatesPage({
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

  // Get certificates from THIS organization's courses ONLY (data isolation)
  const certificates = await prisma.certificate.findMany({
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
      quizAttempt: {
        select: {
          score: true,
          completedAt: true,
        },
      },
      bulkCertificate: {
        select: {
          attendeeName: true,
          attendeeEmail: true,
          presentationDate: true,
        },
      },
    },
    orderBy: {
      generatedAt: 'desc',
    },
  })

  // Get bulk certificate batches for THIS organization
  const batches = await prisma.bulkCertificateBatch.findMany({
    where: { organizationId: id },
    include: {
      _count: {
        select: {
          certificates: true,
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
        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-gray-900">Certificates</h1><Link href={`/org/${id}/certificates/upload`} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Upload CSV</Link></div>
        <p className="text-gray-600 mt-1">{organization.name}</p>
      </div>

      {/* Bulk Certificate Batches */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Certificate Batches ({batches.length})
        </h2>
        {batches.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No certificate batches yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Batch Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch: any) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.name || `Batch ${batch.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch._count.certificates}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          batch.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : batch.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Certificates */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Certificates ({certificates.length})
        </h2>
        {certificates.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">No certificates issued yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Certificate #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Issued
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert: any) => (
                  <tr key={cert.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.bulkCertificate
                          ? cert.bulkCertificate.attendeeName
                          : cert.user.name || cert.user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cert.bulkCertificate
                          ? cert.bulkCertificate.attendeeEmail
                          : cert.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cert.course.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cert.certificateNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cert.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cert.bulkCertificate ? (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                          Bulk
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          Quiz
                        </span>
                      )}
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
