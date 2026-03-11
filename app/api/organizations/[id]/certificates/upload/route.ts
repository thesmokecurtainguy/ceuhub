import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, requireOrganizationMembership, unauthorizedResponse, forbiddenResponse } from '@/lib/permissions'
import { parse } from 'csv-parse/sync'

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

    // Verify membership (admin or rep can upload)
    const membership = await requireOrganizationMembership(organizationId)
    if (membership.role !== 'admin' && membership.role !== 'rep') {
      return forbiddenResponse('Only admins and reps can upload certificates')
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const courseId = formData.get('courseId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Verify course belongs to organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || course.organizationId !== organizationId) {
      return NextResponse.json({ error: 'Course not found or does not belong to organization' }, { status: 404 })
    }

    // Read and parse CSV
    const csvContent = await file.text()
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })
    const recordsTyped = records as Array<Record<string, string>>

    // Validate required columns
    const requiredColumns = ['Full Name', 'Email', 'Presentation Date', 'Presenter Name', 'Location']
    
    if (recordsTyped.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 })
    }

    const headers = Object.keys(recordsTyped[0])
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      )
    }

    // Limit to 100 rows
    if (recordsTyped.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 rows per upload. Please split your CSV into smaller files.' },
        { status: 400 }
      )
    }

    // Get or create default certificate template for organization
    let template = await prisma.certificateTemplate.findFirst({
      where: { organizationId, accreditationType: 'AIA' },
    })

    if (!template) {
      // Create default template
      template = await prisma.certificateTemplate.create({
        data: {
          organizationId,
          name: 'Default AIA Template',
          accreditationType: 'AIA',
          isDefault: true,
          htmlTemplate: '<div>Default Certificate Template</div>',
        },
      })
    }

    // Create batch
    const batch = await prisma.bulkCertificateBatch.create({
      data: {
        organizationId,
        uploadedById: user.id,
        templateId: template.id,
        courseId,
        fileName: file.name,
        totalRows: recordsTyped.length,
        status: 'processing',
      },
    })

    const errors: string[] = []
    let createdCount = 0

    // Process each row
    for (let rowNum = 0; rowNum < recordsTyped.length; rowNum++) {
      const row = recordsTyped[rowNum]
      
      try {
        // Validate required fields
        const fullName = row['Full Name']?.trim()
        const email = row['Email']?.trim()
        const presentationDate = row['Presentation Date']?.trim()
        const presenterName = row['Presenter Name']?.trim()
        const location = row['Location']?.trim()

        if (!fullName || !email || !presentationDate || !presenterName || !location) {
          errors.push(`Row ${rowNum + 2}: Missing required fields`)
          continue
        }

        // Validate email format
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailPattern.test(email)) {
          errors.push(`Row ${rowNum + 2}: Invalid email format: ${email}`)
          continue
        }

        // Parse presentation date (MM/DD/YYYY)
        let parsedDate: Date
        try {
          const [month, day, year] = presentationDate.split('/')
          parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date')
          }
        } catch {
          errors.push(`Row ${rowNum + 2}: Invalid date format: ${presentationDate}. Use MM/DD/YYYY`)
          continue
        }

        // Optional fields
        const aiaNumber = row['AIA Number']?.trim() || null
        const licenseNumber = row['License Number']?.trim() || null

        // Get presenter email (from user or organization)
        const presenterEmail = user.email

        // Generate certificate number (will be finalized when certificate is generated)
        const certificateNumber = `CERT-${course.aiaCourseNumber}-${parsedDate.toISOString().split('T')[0].replace(/-/g, '')}-${String(createdCount + 1).padStart(5, '0')}`

        // Create bulk certificate record
        await prisma.bulkCertificate.create({
          data: {
            batchId: batch.id,
            certificateNumber,
            attendeeName: fullName,
            attendeeEmail: email,
            attendeeAiaNumber: aiaNumber,
            attendeeLocation: location,
            courseTitle: course.title,
            courseNumber: course.aiaCourseNumber,
            sessionNumber: course.sessionNumber,
            presentationDate: parsedDate,
            presentationLocation: location,
            repName: presenterName,
            repEmail: presenterEmail,
            certificateUrl: '', // Will be set when PDF is generated
          },
        })

        // Create contact record for marketing database
        await prisma.contact.upsert({
          where: { email },
          create: {
            email,
            name: fullName,
            aiaNumber: aiaNumber,
            location: location,
            organizationId,
            sourceBatchId: batch.id,
          },
          update: {
            name: fullName,
            aiaNumber: aiaNumber,
            location: location,
          },
        })

        createdCount++
      } catch (err: any) {
        errors.push(`Row ${rowNum + 2}: ${err.message || 'Processing error'}`)
      }
    }

    // Update batch status
    await prisma.bulkCertificateBatch.update({
      where: { id: batch.id },
      data: {
        successfulRows: createdCount,
        failedRows: records.length - createdCount,
        status: createdCount > 0 ? 'completed' : 'failed',
        completedAt: new Date(),
        errorLog: errors.length > 0 ? errors.join('\n') : null,
      },
    })

    // Auto-generate certificates and send emails in background
    if (createdCount > 0) {
      // Trigger certificate generation (will be async)
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/organizations/${organizationId}/certificates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: batch.id }),
      }).catch(err => {
        console.error('Failed to trigger certificate generation:', err)
      })
    }

    return NextResponse.json({
      message: `Successfully uploaded ${createdCount} certificate(s)`,
      createdCount,
      errors: errors.length > 0 ? errors : undefined,
      batchId: batch.id,
    })
  } catch (error: any) {
    console.error('CSV upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// Note: Certificate generation is triggered asynchronously after upload
// The generation endpoint will process all certificates in the batch
