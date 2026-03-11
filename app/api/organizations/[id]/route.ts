import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  requireAuth,
  requireOrganizationMembership,
  requireOrganizationAdmin,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/permissions'

const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  aiaProviderNumber: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  customCss: z.string().optional().nullable(),
  whiteLabelEnabled: z.boolean().optional(),
  removeBranding: z.boolean().optional(),
})

/**
 * GET /api/organizations/[id]
 * Get organization details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if user is platform admin or member
    const isAdmin = user.role === 'platform_admin'
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId: user.id,
        },
      },
    })

    if (!isAdmin && !membership) {
      return forbiddenResponse('Not a member of this organization')
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            courses: true,
            batches: true,
            subscriptions: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(organization)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Get organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/organizations/[id]
 * Update organization (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireAuth()

    // Require admin access
    await requireOrganizationAdmin(id)

    const body = await req.json()
    const data = updateOrganizationSchema.parse(body)

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.aiaProviderNumber !== undefined && {
          aiaProviderNumber: data.aiaProviderNumber,
        }),
        ...(data.primaryColor !== undefined && {
          primaryColor: data.primaryColor,
        }),
        ...(data.secondaryColor !== undefined && {
          secondaryColor: data.secondaryColor,
        }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.customCss !== undefined && { customCss: data.customCss }),
        ...(data.whiteLabelEnabled !== undefined && {
          whiteLabelEnabled: data.whiteLabelEnabled,
        }),
        ...(data.removeBranding !== undefined && {
          removeBranding: data.removeBranding,
        }),
      },
      include: {
        _count: {
          select: {
            members: true,
            courses: true,
          },
        },
      },
    })

    return NextResponse.json(organization)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    if (error.message?.includes('Forbidden')) {
      return forbiddenResponse(error.message)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (platform admin or org admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    // Check if platform admin or organization admin
    const isPlatformAdmin = user.role === 'platform_admin'
    if (!isPlatformAdmin) {
      await requireOrganizationAdmin(id)
    }

    await prisma.organization.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Organization deleted' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    if (error.message?.includes('Forbidden')) {
      return forbiddenResponse(error.message)
    }
    console.error('Delete organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
