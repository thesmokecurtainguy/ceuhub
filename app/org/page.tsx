import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserOrganizations } from '@/lib/permissions'
import Link from 'next/link'

export default async function OrganizationWorkspacePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const organizations = await getUserOrganizations(session.user.id)

  if (organizations.length === 0) {
    redirect('/organizations/new')
  }

  // For now, redirect to first organization
  // Later: if multiple orgs, show selection page
  redirect(`/org/${organizations[0].id}`)
}
