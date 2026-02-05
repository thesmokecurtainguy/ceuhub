import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/email'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import AppleProvider from 'next-auth/providers/apple'
import { prisma } from './db'
import { sendEmail } from './email'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
    }),
    // AppleProvider - commented out due to TypeScript issues, can be enabled when needed
    // AppleProvider({
    //   clientId: process.env.APPLE_ID || '',
    //   clientSecret: process.env.APPLE_KEY_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_PRIVATE_KEY
    //     ? {
    //         kid: process.env.APPLE_KEY_ID,
    //         teamId: process.env.APPLE_TEAM_ID,
    //         keyId: process.env.APPLE_KEY_ID,
    //         privateKey: process.env.APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    //       }
    //     : undefined,
    // }),
  ],
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
