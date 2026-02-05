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
    if (!session?.user || session.user.id !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const certificates = await prisma.certificate.findMany({
      where: { userId: id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            aiaCourseNumber: true,
            learningUnits: true,
            learningUnitsType: true,
          },
        },
        quizAttempt: {
          select: {
            score: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    })

    return NextResponse.json(certificates)
  } catch (error) {
    console.error('Get certificates error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
