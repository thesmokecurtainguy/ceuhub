import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateProgressSchema = z.object({
  progressSlide: z.number().int().min(0),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateProgressSchema.parse(body)

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    })

    if (!enrollment || enrollment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        progressSlide: data.progressSlide,
      },
    })

    return NextResponse.json(updatedEnrollment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update enrollment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
