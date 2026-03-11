import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOrganizationMembership, unauthorizedResponse, forbiddenResponse } from '@/lib/permissions'
import { generateAndUploadBulkCertificate, sendBulkCertificateEmail } from '@/lib/bulk-certificate-generator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (!user) {
      return unauthorizedResponse()
    }

    const { id: organizationId } = await params

    // Verify membership
    const membership = await requireOrganizationMembership(organizationId)
    if (membership.role !== 'admin' && membership.role !== 'rep') {
      return forbiddenResponse('Only admins and reps can generate certificates')
    }

    const body = await req.json()
    const { batchId } = body

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
    }

    // Verify batch belongs to organization
    const batch = await prisma.bulkCertificateBatch.findUnique({
      where: { id: batchId },
      include: {
        certificates: {
          where: {
            certificateUrl: { equals: "" }, // Only process certificates without PDFs yet
          },
        },
      },
    })

    if (!batch || batch.organizationId !== organizationId) {
      return NextResponse.json(
        { error: 'Batch not found or does not belong to organization' },
        { status: 404 }
      )
    }

    if (batch.certificates.length === 0) {
      return NextResponse.json({
        message: 'No pending certificates to generate',
        processed: 0,
        success: 0,
        failed: 0,
      })
    }

    // Process certificates
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    for (const cert of batch.certificates) {
      try {
        // Generate PDF and upload
        const certificateUrl = await generateAndUploadBulkCertificate(cert.id)

        // Send email
        const emailSent = await sendBulkCertificateEmail(cert.id, certificateUrl)

        if (emailSent) {
          successCount++
        } else {
          failedCount++
          errors.push(`Failed to send email for ${cert.attendeeEmail}`)
        }
      } catch (err: any) {
        failedCount++
        errors.push(`Certificate ${cert.certificateNumber}: ${err.message}`)
        console.error(`Failed to process certificate ${cert.id}:`, err)
      }
    }

    return NextResponse.json({
      message: `Processed ${batch.certificates.length} certificate(s)`,
      processed: batch.certificates.length,
      success: successCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Certificate generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
