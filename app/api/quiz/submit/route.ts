import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateQuizScore, didPassQuiz } from '@/lib/utils'
import { generateCertificateForQuizAttempt } from '@/lib/certificate-generator'
import { sendCertificateEmail, sendPresenterNotificationEmail } from '@/lib/email'

const submitSchema = z.object({
  enrollmentId: z.string(),
  courseId: z.string(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      answerSelected: z.string(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = submitSchema.parse(body)

    // Verify enrollment belongs to user
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        user: true,
        course: {
          include: {
            presenter: true,
          },
        },
      },
    })

    if (!enrollment || enrollment.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get questions for the course
    const questions = await prisma.question.findMany({
      where: { courseId: data.courseId },
    })

    if (questions.length !== 10) {
      return NextResponse.json({ error: 'Course must have 10 questions' }, { status: 400 })
    }

    // Calculate score
    const { score, answers: detailedAnswers } = calculateQuizScore(data.answers, questions)
    const passed = didPassQuiz(score)

    // Get attempt number
    const previousAttempts = await prisma.quizAttempt.count({
      where: {
        enrollmentId: data.enrollmentId,
      },
    })

    // Create quiz attempt
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        enrollmentId: data.enrollmentId,
        courseId: data.courseId,
        userId: session.user.id,
        attemptNumber: previousAttempts + 1,
        score,
        answers: detailedAnswers,
        passed,
        completedAt: new Date(),
      },
      include: {
        user: true,
        course: true,
      },
    })

    // If passed, generate certificate and send emails
    if (passed) {
      // Update enrollment as completed
      await prisma.enrollment.update({
        where: { id: data.enrollmentId },
        data: {
          completedAt: new Date(),
          progressSlide: -1, // Mark as completed
        },
      })

      // Generate certificate
      const certificateUrl = await generateCertificateForQuizAttempt(quizAttempt.id)

      // Get certificate record
      const certificate = await prisma.certificate.findUnique({
        where: { quizAttemptId: quizAttempt.id },
        include: {
          course: true,
          user: true,
        },
      })

      if (certificate) {
        // Create completion log
        await prisma.completionLog.create({
          data: {
            courseId: data.courseId,
            userId: session.user.id,
            userName: enrollment.user.name || enrollment.user.email,
            userEmail: enrollment.user.email,
            userAiaNumber: enrollment.user.aiaNumber || null,
            quizScore: score,
            completionDate: new Date(),
            certificateId: certificate.id,
          },
        })

        // Send emails
        try {
          await sendCertificateEmail(
            enrollment.user.email,
            enrollment.user.name || enrollment.user.email,
            enrollment.course.title,
            certificateUrl
          )

          await prisma.certificate.update({
            where: { id: certificate.id },
            data: { emailedToAttendeeAt: new Date() },
          })

          await sendPresenterNotificationEmail(
            enrollment.course.presenter.email,
            enrollment.user.name || enrollment.user.email,
            enrollment.user.email,
            enrollment.user.aiaNumber,
            enrollment.course.title,
            score,
            new Date()
          )

          await prisma.certificate.update({
            where: { id: certificate.id },
            data: { emailedToPresenterAt: new Date() },
          })
        } catch (emailError) {
          console.error('Email sending error:', emailError)
          // Don't fail the request if email fails
        }
      }

      return NextResponse.json({
        ...quizAttempt,
        certificateUrl,
      })
    }

    return NextResponse.json(quizAttempt)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Submit quiz error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


