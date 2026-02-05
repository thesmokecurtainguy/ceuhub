import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const questions = await prisma.question.findMany({
      where: { courseId: id },
      orderBy: {
        questionNumber: 'asc',
      },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
