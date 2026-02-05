import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-blue-600">ceuHUB</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Your platform for self-paced continuing education. Complete courses at your own pace,
          take quizzes, and earn certificates.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          {session ? (
            <div className="rounded-md shadow">
              <Link
                href="/dashboard"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="rounded-md shadow">
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Self-Paced Learning
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Progress through course materials at your own pace, whenever it's convenient for you.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Earn Certificates
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Complete quizzes and automatically receive certificates of completion via email.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  AIA Compliant
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Courses are structured to meet AIA continuing education requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


