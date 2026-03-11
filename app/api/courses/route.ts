import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOrganizationAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/permissions'
import { z } from 'zod'

const createCourseSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  aiaCourseNumber: z.string().min(1, 'AIA Course Number is required'),
  sessionNumber: z.string().optional(),
  location: z.string().optional(),
  learningUnits: z.number().int().positive('Learning Units must be positive'),
  learningUnitsType: z.string().min(1, 'Learning Units Type is required'),
  speakerName: z.string().min(1, 'Speaker Name is required'),
  speakerTitle: z.string().min(1, 'Speaker Title is required'),
  courseType: z.string().min(1, 'Course Type is required'),
  providerName: z.string().min(1, 'Provider Name is required'),
  providerContactName: z.string().min(1, 'Provider Contact Name is required'),
  providerAddress: z.string().min(1, 'Provider Address is required'),
  providerCity: z.string().min(1, 'Provider City is required'),
  providerState: z.string().min(1, 'Provider State is required'),
  providerZip: z.string().min(1, 'Provider Zip is required'),
  providerPhone: z.string().min(1, 'Provider Phone is required'),
  providerEmail: z.string().email('Invalid provider email'),
  providerNumber: z.string().min(1, 'Provider Number is required'),
  providerLogoUrl: z.string().url().optional().nullable(),
  pdfUrl: z.string().url('Invalid PDF URL'),
  videoProvider: z.enum(['youtube', 'vimeo', 'wistia', 'custom', 'hosted']).optional().nullable(),
  requireVideoCompletion: z.boolean().default(false),
  isHosted: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await req.json()
    
    // Validate input
    const validation = createCourseSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify user is admin of the organization
    try {
      await requireOrganizationAdmin(data.organizationId)
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) {
        return unauthorizedResponse()
      }
      return forbiddenResponse('You must be an organization admin to create courses')
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    })

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // For hosted courses (Track 1), set defaults for session/location
    // For rep/presenter courses (Track 2), require session/location
    const sessionNumber = data.isHosted ? 'N/A' : (data.sessionNumber || '')
    const location = data.isHosted ? 'Online' : (data.location || '')

    // Validate that Track 2 courses have session/location
    if (!data.isHosted && (!data.sessionNumber || !data.location)) {
      return NextResponse.json(
        { error: 'Session Number and Location are required for Rep/Presenter courses (Track 2)' },
        { status: 400 }
      )
    }

    // Create the course
    const course = await prisma.course.create({
      data: {
        presenterId: user.id,
        organizationId: data.organizationId,
        title: data.title,
        description: data.description,
        aiaCourseNumber: data.aiaCourseNumber,
        sessionNumber: sessionNumber,
        location: location,
        learningUnits: data.learningUnits,
        learningUnitsType: data.learningUnitsType,
        speakerName: data.speakerName,
        speakerTitle: data.speakerTitle,
        courseType: data.courseType,
        providerName: data.providerName,
        providerContactName: data.providerContactName,
        providerAddress: data.providerAddress,
        providerCity: data.providerCity,
        providerState: data.providerState,
        providerZip: data.providerZip,
        providerPhone: data.providerPhone,
        providerEmail: data.providerEmail,
        providerNumber: data.providerNumber,
        providerLogoUrl: data.providerLogoUrl || null,
        pdfUrl: data.pdfUrl,
        videoProvider: data.videoProvider || null,
        requireVideoCompletion: data.requireVideoCompletion,
        isHosted: data.isHosted,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        presenter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    console.error('Create course error:', error)
    if (error.message?.includes('Unauthorized') || error.message?.includes('Forbidden')) {
      return forbiddenResponse(error.message)
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
