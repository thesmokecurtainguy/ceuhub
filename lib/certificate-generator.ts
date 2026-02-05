// NOTE: puppeteer removed for MVP - certificate generation will use a simpler approach
import { blobPaths, uploadBufferToBlob } from './blob-storage'
import { prisma } from './db'

export interface CertificateData {
  courseId: string
  userId: string
  userName: string
  userEmail: string
  userAiaNumber?: string
  quizScore: number
  completionDate: Date
  courseTitle: string
  aiaCourseNumber: string
  sessionNumber: string
  learningUnits: number
  learningUnitsType: string
  speakerName: string
  providerName: string
  providerNumber: string
  providerLogoUrl?: string
}

/**
 * Generate certificate HTML template
 */
function generateCertificateHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', serif;
      width: 11in;
      height: 8.5in;
      padding: 1in;
      background: white;
    }
    .certificate-container {
      border: 5px solid #003366;
      width: 100%;
      height: 100%;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      font-size: 2.5rem;
      color: #003366;
      margin-bottom: 1rem;
      font-weight: bold;
    }
    .logo {
      max-width: 200px;
      margin: 0 auto 1rem;
    }
    .content {
      text-align: center;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .certificate-text {
      font-size: 1.2rem;
      line-height: 1.8;
      margin: 2rem 0;
    }
    .recipient-name {
      font-size: 2rem;
      font-weight: bold;
      color: #003366;
      margin: 1rem 0;
      text-decoration: underline;
    }
    .course-details {
      margin: 2rem 0;
      font-size: 1rem;
      line-height: 1.6;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin: 1rem 0;
      text-align: left;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.9rem;
      border-top: 2px solid #003366;
      padding-top: 1rem;
    }
    .signature-section {
      display: flex;
      justify-content: space-around;
      margin-top: 2rem;
    }
    .signature-box {
      width: 250px;
      text-align: center;
    }
    .signature-line {
      border-top: 2px solid #000;
      margin-top: 60px;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="header">
      ${data.providerLogoUrl ? `<img src="${data.providerLogoUrl}" alt="Provider Logo" class="logo" />` : ''}
      <h1>CERTIFICATE OF COMPLETION</h1>
    </div>
    
    <div class="content">
      <div class="certificate-text">
        This is to certify that
      </div>
      
      <div class="recipient-name">
        ${data.userName}
      </div>
      
      <div class="certificate-text">
        has successfully completed the continuing education course
      </div>
      
      <div style="font-size: 1.5rem; font-weight: bold; margin: 1rem 0; color: #003366;">
        ${data.courseTitle}
      </div>
      
      <div class="course-details">
        <div class="details-grid">
          <div><strong>AIA Course Number:</strong> ${data.aiaCourseNumber}</div>
          <div><strong>Session Number:</strong> ${data.sessionNumber}</div>
          <div><strong>Learning Units:</strong> ${data.learningUnits} ${data.learningUnitsType}</div>
          <div><strong>Quiz Score:</strong> ${data.quizScore}%</div>
          ${data.userAiaNumber ? `<div><strong>AIA Number:</strong> ${data.userAiaNumber}</div>` : ''}
          <div><strong>Date Completed:</strong> ${data.completionDate.toLocaleDateString()}</div>
        </div>
      </div>
      
      <div class="certificate-text" style="margin-top: 2rem;">
        Presented by: ${data.speakerName}<br>
        Provider: ${data.providerName} (${data.providerNumber})
      </div>
    </div>
    
    <div class="footer">
      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>Provider Signature</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>Date</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate certificate PDF and upload to blob storage
 * NOTE: For MVP, this returns a placeholder URL. Certificate generation will be handled
 * via a separate service or manual process. The HTML template is still generated for reference.
 */
export async function generateCertificate(
  certificateId: string,
  data: CertificateData
): Promise<string> {
  // Generate HTML template (kept for future use)
  const html = generateCertificateHTML(data)
  
  // TODO: Implement certificate PDF generation
  // Options:
  // 1. Use a cloud service API (e.g., PDFShift, HTMLtoPDF)
  // 2. Generate on-demand via Next.js API route with html-to-pdf library
  // 3. Use a headless browser service
  
  // For now, return a placeholder URL or generate a simple HTML certificate
  // that can be printed to PDF by the browser
  const blobPath = blobPaths.certificate(certificateId)
  
  // Convert HTML to Buffer and upload
  const htmlBuffer = Buffer.from(html, 'utf-8')
  const certificateUrl = await uploadBufferToBlob(
    blobPath.replace('.pdf', '.html'),
    htmlBuffer,
    'text/html'
  )
  
  // Return URL - users can print to PDF from browser
  return certificateUrl
}

/**
 * Fetch certificate data from database and generate certificate
 */
export async function generateCertificateForQuizAttempt(
  quizAttemptId: string
): Promise<string> {
  const quizAttempt = await prisma.quizAttempt.findUnique({
    where: { id: quizAttemptId },
    include: {
      user: true,
      course: true,
      enrollment: true,
    },
  })

  if (!quizAttempt || !quizAttempt.passed) {
    throw new Error('Quiz attempt not found or did not pass')
  }

  const certificateId = crypto.randomUUID()
  const certificateData: CertificateData = {
    courseId: quizAttempt.course.id,
    userId: quizAttempt.user.id,
    userName: quizAttempt.user.name || quizAttempt.user.email,
    userEmail: quizAttempt.user.email,
    userAiaNumber: quizAttempt.user.aiaNumber || undefined,
    quizScore: quizAttempt.score,
    completionDate: quizAttempt.completedAt,
    courseTitle: quizAttempt.course.title,
    aiaCourseNumber: quizAttempt.course.aiaCourseNumber,
    sessionNumber: quizAttempt.course.sessionNumber,
    learningUnits: quizAttempt.course.learningUnits,
    learningUnitsType: quizAttempt.course.learningUnitsType,
    speakerName: quizAttempt.course.speakerName,
    providerName: quizAttempt.course.providerName,
    providerNumber: quizAttempt.course.providerNumber,
    providerLogoUrl: quizAttempt.course.providerLogoUrl || undefined,
  }

  const certificateUrl = await generateCertificate(certificateId, certificateData)

  // Create certificate record
  await prisma.certificate.create({
    data: {
      id: certificateId,
      quizAttemptId: quizAttempt.id,
      enrollmentId: quizAttempt.enrollment.id,
      userId: quizAttempt.user.id,
      courseId: quizAttempt.course.id,
      certificateUrl,
    },
  })

  return certificateUrl
}
