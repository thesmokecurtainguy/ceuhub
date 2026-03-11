import PDFDocument from 'pdfkit'
import { blobPaths, uploadBufferToBlob } from './blob-storage'
import { prisma } from './db'
import { sendEmail } from './email'

export interface BulkCertificateData {
  attendeeName: string
  attendeeEmail: string
  attendeeAiaNumber?: string | null
  courseTitle: string
  courseNumber: string
  sessionNumber: string
  learningUnits: number
  learningUnitsType: string
  presentationDate: Date
  presentationLocation: string
  presenterName: string
  providerName: string
  providerNumber: string
  providerLogoUrl?: string | null
  certificateNumber: string
}

/**
 * Generate PDF certificate for bulk uploads
 * Based on Hidden Breaches certificate design (landscape orientation)
 */
export async function generateBulkCertificatePDF(
  data: BulkCertificateData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Landscape: 11" x 8.5" (792 x 612 points)
    const doc = new PDFDocument({
      size: [792, 612], // Landscape letter size
      margins: { top: 36, bottom: 36, left: 36, right: 36 },
    })

    const buffers: Buffer[] = []
    doc.on('data', buffers.push.bind(buffers))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers)
      resolve(pdfBuffer)
    })
    doc.on('error', reject)

    const pageWidth = 792
    const pageHeight = 612
    const margin = 36

    // Colors (matching Hidden Breaches design)
    const providerRed = '#C8102E'
    const darkGray = '#333333'
    const lightGray = '#666666'

    // Outer border (3pt)
    doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2)
      .lineWidth(3)
      .strokeColor(providerRed)
      .stroke()

    // Inner border (1pt)
    doc.rect(margin + 7.2, margin + 7.2, pageWidth - (margin + 7.2) * 2, pageHeight - (margin + 7.2) * 2)
      .lineWidth(1)
      .strokeColor(providerRed)
      .stroke()

    // Header - "AIA CONTINUING EDUCATION"
    doc.fontSize(28)
      .fillColor(providerRed)
      .font('Helvetica-Bold')
      .text('AIA CONTINUING EDUCATION', margin, margin + 20, {
        width: pageWidth - margin * 2,
        align: 'center',
      })

    // "Certificate of Completion"
    doc.fontSize(22)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text('Certificate of Completion', margin, margin + 60, {
        width: pageWidth - margin * 2,
        align: 'center',
      })

    // Decorative line
    doc.moveTo(margin + 72, margin + 100)
      .lineTo(pageWidth - margin - 72, margin + 100)
      .lineWidth(2)
      .strokeColor(providerRed)
      .stroke()

    // "This is to certify that"
    doc.fontSize(14)
      .fillColor(lightGray)
      .font('Helvetica')
      .text('This is to certify that', margin, margin + 140, {
        width: pageWidth - margin * 2,
        align: 'center',
      })

    // Recipient name
    doc.fontSize(26)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(data.attendeeName, margin, margin + 170, {
        width: pageWidth - margin * 2,
        align: 'center',
      })

    // "has successfully completed..."
    doc.fontSize(14)
      .fillColor(lightGray)
      .font('Helvetica')
      .text(
        'has successfully completed the following AIA/CES registered program:',
        margin,
        margin + 210,
        {
          width: pageWidth - margin * 2,
          align: 'center',
        }
      )

    // Course title
    doc.fontSize(16)
      .fillColor(darkGray)
      .font('Helvetica-Bold')
      .text(data.courseTitle, margin, margin + 250, {
        width: pageWidth - margin * 2,
        align: 'center',
      })

    // Learning units
    doc.fontSize(18)
      .fillColor(providerRed)
      .font('Helvetica-Bold')
      .text(
        `${data.learningUnits} ${data.learningUnitsType}`,
        margin,
        margin + 290,
        {
          width: pageWidth - margin * 2,
          align: 'center',
        }
      )

    // Details section (left side)
    const detailsY = margin + 340
    const leftX = margin + 72
    const rightX = pageWidth - margin - 144

    doc.fontSize(11)
      .fillColor(lightGray)
      .font('Helvetica')
      .text(`Course Number: ${data.courseNumber}`, leftX, detailsY)
      .text(`Session: ${data.sessionNumber}`, leftX, detailsY + 18)
      .text(`Provider: ${data.providerName}`, leftX, detailsY + 36)
      .text(`Provider Number: ${data.providerNumber}`, leftX, detailsY + 54)

    // Details section (right side)
    const completionDate = data.presentationDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })

    doc.text(`Completion Date: ${completionDate}`, rightX, detailsY)
      .text(`Certificate ID: ${data.certificateNumber}`, rightX, detailsY + 18)
      .text(`Presentation Date: ${completionDate}`, rightX, detailsY + 36)
      .text(`Location: ${data.presentationLocation}`, rightX, detailsY + 54)

    // Footer
    doc.fontSize(9)
      .fillColor(lightGray)
      .font('Helvetica')
      .text(
        `This certificate is issued by ${data.providerName}, an AIA Approved Provider.`,
        margin,
        pageHeight - margin - 20,
        {
          width: pageWidth - margin * 2,
          align: 'center',
        }
      )

    doc.end()
  })
}

/**
 * Generate certificate PDF, upload to blob storage, create Certificate record, and return URL
 */
export async function generateAndUploadBulkCertificate(
  bulkCertificateId: string
): Promise<string> {
  const bulkCert = await prisma.bulkCertificate.findUnique({
    where: { id: bulkCertificateId },
    include: {
      batch: {
        include: {
          course: true,
        },
      },
    },
  })

  if (!bulkCert) {
    throw new Error('Bulk certificate not found')
  }

  const course = bulkCert.batch.course

  if (!course) {
    throw new Error('Course not found for bulk certificate')
  }
  if (!course) {
    throw new Error('Course not found')
  }

  // Generate PDF
  const pdfBuffer = await generateBulkCertificatePDF({
    attendeeName: bulkCert.attendeeName,
    attendeeEmail: bulkCert.attendeeEmail,
    attendeeAiaNumber: bulkCert.attendeeAiaNumber,
    courseTitle: bulkCert.courseTitle,
    courseNumber: bulkCert.courseNumber,
    sessionNumber: bulkCert.sessionNumber,
    learningUnits: course.learningUnits,
    learningUnitsType: course.learningUnitsType,
    presentationDate: bulkCert.presentationDate,
    presentationLocation: bulkCert.presentationLocation,
    presenterName: bulkCert.repName,
    providerName: course.providerName,
    providerNumber: course.providerNumber,
    providerLogoUrl: course.providerLogoUrl,
    certificateNumber: bulkCert.certificateNumber,
  })

  // Upload to blob storage
  const blobPath = blobPaths.certificate(bulkCert.certificateNumber)
  const certificateUrl = await uploadBufferToBlob(blobPath, pdfBuffer, 'application/pdf')

  // Update bulk certificate with URL
  await prisma.bulkCertificate.update({
    where: { id: bulkCertificateId },
    data: { certificateUrl },
  })

  // Get or create user for this attendee
  let user = await prisma.user.findUnique({
    where: { email: bulkCert.attendeeEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: bulkCert.attendeeEmail,
        name: bulkCert.attendeeName,
        aiaNumber: bulkCert.attendeeAiaNumber,
      },
    })
  }

  // Get or create enrollment (required for Certificate model)
  let enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId: course.id,
    },
  })

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        progressSlide: 0,
        completedAt: bulkCert.presentationDate, // Mark as completed on presentation date
      },
    })
  }

  // Create Certificate record (linked to BulkCertificate)
  await prisma.certificate.create({
    data: {
      bulkCertificateId: bulkCert.id,
      userId: user.id,
      enrollmentId: enrollment.id,
      courseId: course.id,
      certificateUrl,
      certificateNumber: bulkCert.certificateNumber,
      generatedAt: new Date(),
    },
  })

  return certificateUrl
}

/**
 * Send certificate email for bulk uploads
 */
export async function sendBulkCertificateEmail(
  bulkCertificateId: string,
  certificateUrl: string
): Promise<boolean> {
  const bulkCert = await prisma.bulkCertificate.findUnique({
    where: { id: bulkCertificateId },
    include: {
      batch: {
        include: {
          course: true,
          organization: true,
        },
      },
    },
  })

  if (!bulkCert) {
    throw new Error('Bulk certificate not found')
  }

  const course = bulkCert.batch.course

  if (!course) {
    throw new Error('Course not found for bulk certificate')
  }
  const org = bulkCert.batch.organization

  // Fetch PDF from blob storage
  const pdfResponse = await fetch(certificateUrl)
  if (!pdfResponse.ok) {
    throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`)
  }
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())

  // Email HTML template (similar to Hidden Breaches)
  const completionDate = bulkCert.presentationDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #C8102E; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; background-color: #f9f9f9; }
        .highlight { background-color: #fff; border-left: 4px solid #C8102E; padding: 15px; margin: 20px 0; }
        .details { background-color: #fff; padding: 20px; border-radius: 5px; }
        .details table { width: 100%; border-collapse: collapse; }
        .details td { padding: 8px 0; }
        .details td:first-child { font-weight: bold; color: #666; }
        .presentation { background-color: #fffde7; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Congratulations, ${bulkCert.attendeeName}!</h1>
        </div>
        <div class="content">
          <p>Thank you for attending our presentation! You have successfully completed the AIA Continuing Education course:</p>
          
          <div class="highlight">
            <strong style="font-size: 18px; color: #C8102E;">${bulkCert.courseTitle}</strong>
            <br><br>
            <strong style="font-size: 20px;">${course?.learningUnits || "N/A"} ${course?.learningUnitsType || ""}</strong>
          </div>
          
          <div class="presentation">
            <h3 style="margin-top: 0; color: #ff9800;">📅 Presentation Details</h3>
            <table>
              <tr><td>Date:</td><td>${completionDate}</td></tr>
              <tr><td>Presenter:</td><td>${bulkCert.repName}</td></tr>
              <tr><td>Location:</td><td>${bulkCert.presentationLocation}</td></tr>
            </table>
          </div>
          
          <div class="details">
            <table>
              <tr>
                <td>Certificate ID:</td>
                <td>${bulkCert.certificateNumber}</td>
              </tr>
              <tr>
                <td>Completion Date:</td>
                <td>${completionDate}</td>
              </tr>
              <tr>
                <td>Provider:</td>
                <td>${course?.providerName || org.name}</td>
              </tr>
              <tr>
                <td>Provider Number:</td>
                <td>${course?.providerNumber || org.aiaProviderNumber || "N/A"}</td>
              </tr>
            </table>
          </div>
          
          <p style="margin-top: 20px;">
            <strong>Your certificate is attached to this email as a PDF.</strong> 
            Please save it for your records and submit it to AIA for credit.
          </p>
          
          <p>
            If you provided your AIA member number, your credit will 
            also be reported directly to AIA within 30 days.
          </p>
        </div>
        <div class="footer">
          <p>
            © ${new Date().getFullYear()} ${org.name}<br>
            AIA Approved Provider #${course?.providerNumber || org.aiaProviderNumber || "N/A"}
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail({
      to: bulkCert.attendeeEmail,
      subject: `Congratulations! Your AIA Certificate - ${bulkCert.courseTitle}`,
      html: htmlContent,
      attachments: [
        {
          filename: `AIA_Certificate_${bulkCert.certificateNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    // Update email sent status
    await prisma.bulkCertificate.update({
      where: { id: bulkCertificateId },
      data: {
        emailedToAttendeeAt: new Date(),
      },
    })

    // Update Certificate record email status
    await prisma.certificate.updateMany({
      where: { bulkCertificateId: bulkCert.id },
      data: {
        emailedToAttendeeAt: new Date(),
      },
    })

    return true
  } catch (error) {
    console.error('Failed to send bulk certificate email:', error)
    return false
  }
}
