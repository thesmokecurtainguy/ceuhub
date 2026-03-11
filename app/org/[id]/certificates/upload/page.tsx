import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import { BulkCertificateUploadForm } from '@/components/certificates/BulkCertificateUploadForm'
import Link from 'next/link'

export default async function BulkCertificateUploadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Verify membership (admin or rep can upload)
  const membership = await getOrganizationMembership(id, session.user.id)
  if (!membership || (membership.role !== 'admin' && membership.role !== 'rep')) {
    redirect(`/org/${id}/certificates`)
  }

  // Get organization
  const organization = await prisma.organization.findUnique({
    where: { id },
  })

  if (!organization) {
    redirect('/organizations')
  }

  // Get courses for this organization (for course selection)
  const courses = await prisma.course.findMany({
    where: { organizationId: id },
    select: {
      id: true,
      title: true,
      aiaCourseNumber: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href={`/org/${id}/certificates`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Certificates
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Upload CSV for Bulk Certificates</h1>
        <p className="text-gray-600 mt-1">{organization.name}</p>
      </div>

      <BulkCertificateUploadForm organizationId={id} courses={courses} />
    </div>
  )
}
