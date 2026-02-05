import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: true,
        course: true,
      },
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Verify certificate belongs to user
    if (certificate.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Redirect to certificate URL
    return NextResponse.redirect(certificate.certificateUrl)
  } catch (error) {
    console.error('Get certificate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
