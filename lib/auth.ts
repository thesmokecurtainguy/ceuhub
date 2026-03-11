import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import { sendEmail } from './email'

const providers: any[] = [
  EmailProvider({
    server: process.env.EMAIL_SERVER_HOST
      ? {
          host: process.env.EMAIL_SERVER_HOST,
          port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        }
      : undefined,
    from: process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'noreply@ceuhub.com',
    sendVerificationRequest: async ({ identifier, url }) => {
      await sendEmail({
        to: identifier,
        subject: 'Sign in to ceuHUB',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #003366;">Sign in to ceuHUB</h1>
            <p>Click the link below to sign in to your account:</p>
            <p><a href="${url}" style="background-color: #003366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Sign In</a></p>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this email, you can safely ignore it.</p>
          </div>
        `,
      })
    },
  }),
]

// Add dev-only credentials provider for testing (no email required)
if (process.env.NODE_ENV !== 'production') {
  providers.push(
    CredentialsProvider({
      name: 'Dev Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split('@')[0],
            },
          })
        }

        return {
          id: user.id,
          email: user.email!,
          name: user.name,
        }
      },
    })
  )
}

// Add OAuth providers only if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id') {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  )
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_ID !== 'your-facebook-app-id') {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
    })
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers,
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
