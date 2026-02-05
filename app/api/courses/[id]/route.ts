import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        presenter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            slides: true,
            questions: true,
            enrollments: true,
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
