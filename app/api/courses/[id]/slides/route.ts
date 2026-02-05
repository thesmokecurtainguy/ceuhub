import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const slides = await prisma.slide.findMany({
      where: { courseId: id },
      orderBy: {
        slideNumber: 'asc',
      },
    })

    return NextResponse.json(slides)
  } catch (error) {
    console.error('Get slides error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
