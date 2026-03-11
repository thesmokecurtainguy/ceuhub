'use client'

import { signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setMessage('Failed to send magic link. Please try again.')
      } else {
        setMessage('Check your email for the magic link!')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const result = await signIn('credentials', {
        email,
        redirect: true,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setMessage('Failed to sign in. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      setMessage('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Sign In to ceuHUB</h2>

      {isDev && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800 font-medium mb-2">🧪 Dev Mode</p>
          <p className="text-sm text-yellow-700">
            Use Dev Login for instant sign-in without email verification.
          </p>
        </div>
      )}

      {isDev && (
        <form onSubmit={handleDevLogin} className="space-y-4 mb-6">
          <div>
            <label htmlFor="dev-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (Dev Login)
            </label>
            <input
              id="dev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="test@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Dev Login (Instant)'}
          </button>
        </form>
      )}

      {isDev && (
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or use email magic link</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send Magic Link'}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.includes('Check') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <button
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading}
            className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Google
          </button>
          <button
            onClick={() => handleOAuthSignIn('facebook')}
            disabled={isLoading}
            className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Facebook
          </button>
          <button
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isLoading}
            className="flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Apple
          </button>
        </div>
      </div>
    </div>
  )
}
