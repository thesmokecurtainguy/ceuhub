import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(existingEnrollment)
    }

    // Create new enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: session.user.id,
        courseId,
        progressSlide: 0,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                slides: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Enroll error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


