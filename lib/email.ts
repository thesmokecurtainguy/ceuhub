import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer
    contentType?: string
  }>
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'ceuHUB <noreply@ceuhub.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content.toString('base64'),
        content_type: att.contentType,
      })),
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

/**
 * Send certificate email to attendee
 */
export async function sendCertificateEmail(
  attendeeEmail: string,
  attendeeName: string,
  courseTitle: string,
  certificateUrl: string
) {
  const certificateResponse = await fetch(certificateUrl)
  const certificateBuffer = Buffer.from(await certificateResponse.arrayBuffer())

  return sendEmail({
    to: attendeeEmail,
    subject: `Your Certificate of Completion: ${courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">Congratulations!</h1>
        <p>Dear ${attendeeName},</p>
        <p>Congratulations on successfully completing the course <strong>${courseTitle}</strong>!</p>
        <p>Your certificate of completion is attached to this email.</p>
        <p>You can also download it at any time from your dashboard.</p>
        <p>Thank you for using ceuHUB!</p>
        <br>
        <p>Best regards,<br>The ceuHUB Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${courseTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        content: certificateBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

/**
 * Send completion notification to presenter
 */
export async function sendPresenterNotificationEmail(
  presenterEmail: string,
  attendeeName: string,
  attendeeEmail: string,
  attendeeAiaNumber: string | null,
  courseTitle: string,
  quizScore: number,
  completionDate: Date
) {
  return sendEmail({
    to: presenterEmail,
    subject: `New Course Completion: ${courseTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #003366;">New Course Completion</h1>
        <p>Dear Course Presenter,</p>
        <p>A new attendee has completed your course:</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Course:</strong> ${courseTitle}</li>
          <li><strong>Attendee Name:</strong> ${attendeeName}</li>
          <li><strong>Attendee Email:</strong> ${attendeeEmail}</li>
          ${attendeeAiaNumber ? `<li><strong>AIA Number:</strong> ${attendeeAiaNumber}</li>` : ''}
          <li><strong>Quiz Score:</strong> ${quizScore}%</li>
          <li><strong>Completion Date:</strong> ${completionDate.toLocaleDateString()}</li>
        </ul>
        <p>You can view all completions in your presenter dashboard.</p>
        <br>
        <p>Best regards,<br>The ceuHUB Team</p>
      </div>
    `,
  })
}


