import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import {
  requireAuth,
  getUserOrganizations,
  isPlatformAdmin,
  unauthorizedResponse,
} from '@/lib/permissions'

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['manufacturer', 'rep_firm', 'individual_rep']),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  aiaProviderNumber: z.string().optional(),
  parentId: z.string().uuid().optional(),
})

/**
 * GET /api/organizations
 * List organizations - returns user's organizations or all if platform admin
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    // Platform admins can see all organizations
    if (user.role === 'platform_admin') {
      const organizations = await prisma.organization.findMany({
        include: {
          _count: {
            select: {
              members: true,
              courses: true,
            },
          },
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      return NextResponse.json(organizations)
    }

    // Regular users see only their organizations
    const organizations = await getUserOrganizations(user.id)
    return NextResponse.json(organizations)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    console.error('Get organizations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await req.json()
    const data = createOrganizationSchema.parse(body)

    // Check parent organization if provided
    if (data.parentId) {
      const parentExists = await prisma.organization.findUnique({
        where: { id: data.parentId },
      })
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent organization not found' },
          { status: 404 }
        )
      }
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        type: data.type,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        aiaProviderNumber: data.aiaProviderNumber || null,
        parentId: data.parentId || null,
      },
    })

    // Automatically add creator as admin
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: 'admin',
      },
    })

    // Return organization with membership info
    const orgWithMembership = await prisma.organization.findUnique({
      where: { id: organization.id },
      include: {
        _count: {
          select: {
            members: true,
            courses: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(orgWithMembership, { status: 201 })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse()
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create organization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
