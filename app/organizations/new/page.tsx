import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CreateOrganizationForm from '@/components/organizations/CreateOrganizationForm'
import Link from 'next/link'

export default async function CreateOrganizationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/organizations"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Organizations
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Organization</h1>
        <p className="text-gray-600 mt-2">
          Create a new organization to manage courses, certificates, and members.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <CreateOrganizationForm />
      </div>
    </div>
  )
}
