import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; courseId: string }> }
) {
  try {
    const { userId, courseId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        courseId,
      },
      orderBy: {
        attemptedAt: 'desc',
      },
      include: {
        certificate: {
          select: {
            id: true,
            certificateUrl: true,
            generatedAt: true,
          },
        },
      },
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error('Get quiz attempts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
