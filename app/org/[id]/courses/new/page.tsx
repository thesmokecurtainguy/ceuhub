import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getOrganizationMembership } from '@/lib/permissions'
import { CreateCourseForm } from '@/components/courses/CreateCourseForm'

export default async function NewCoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Verify membership and admin role
  const membership = await getOrganizationMembership(id, session.user.id)
  if (!membership || membership.role !== 'admin') {
    redirect(`/org/${id}`)
  }

  // Get organization with full details
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        where: { role: 'admin' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 1,
      },
    },
  })

  if (!organization) {
    redirect('/organizations')
  }

  // Get current user for contact name
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
    },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href={`/org/${id}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Organization
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
        <p className="text-gray-600 mt-1">{organization.name}</p>
      </div>

      <CreateCourseForm 
        organizationId={id}
        organizationData={{
          name: organization.name,
          email: organization.email,
          phone: organization.phone || '',
          address: organization.address || '',
          city: organization.city || '',
          state: organization.state || '',
          zip: organization.zip || '',
          aiaProviderNumber: organization.aiaProviderNumber || '',
          logoUrl: organization.logoUrl || '',
          contactName: currentUser?.name || organization.members[0]?.user.name || organization.name,
        }}
      />
    </div>
  )
}
