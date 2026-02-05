import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
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
            enrollments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


