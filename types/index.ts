import { Session } from 'next-auth'

export interface ExtendedSession extends Session {
  user: {
    id: string
    email?: string | null
    name?: string | null
  }
}

export interface User {
  id: string
  email: string
  name: string | null
  aiaNumber: string | null
  role?: string | null // "platform_admin", "organization_admin", "rep", "student"
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  presenterId: string
  organizationId?: string | null // New: link to organization
  title: string
  description: string
  aiaCourseNumber: string
  sessionNumber: string
  location: string
  learningUnits: number
  learningUnitsType: string
  speakerName: string
  speakerTitle: string
  courseType: string
  providerName: string
  providerContactName: string
  providerAddress: string
  providerCity: string
  providerState: string
  providerZip: string
  providerPhone: string
  providerEmail: string
  providerNumber: string
  providerLogoUrl: string | null
  pdfUrl: string
  // New fields for video integration and hosting
  videoProvider?: string | null // "youtube", "vimeo", "wistia", "custom", "hosted"
  requireVideoCompletion?: boolean
  isHosted?: boolean // Self-paced hosting enabled
  createdAt: Date
  updatedAt: Date
  presenter?: {
    id: string
    name: string | null
    email: string
  }
  _count?: {
    slides: number
    questions: number
    enrollments: number
  }
}

export interface Slide {
  id: string
  courseId: string
  slideNumber: number
  imageUrl: string
  videoUrl: string | null
  // New fields for external video integration
  videoProvider?: string | null // "youtube", "vimeo", "wistia", "custom", "hosted"
  videoEmbedUrl?: string | null
  videoExternalId?: string | null
  videoProgressTracking?: boolean
  createdAt: Date
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: Date
  completedAt: Date | null
  progressSlide: number
  course?: Course
}

export interface Question {
  id: string
  courseId: string
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  createdAt: Date
  updatedAt: Date
}

export interface QuizAttempt {
  id: string
  enrollmentId: string
  courseId: string
  userId: string
  attemptNumber: number
  score: number
  answers: Array<{
    questionId: string
    answerSelected: string
    isCorrect: boolean
  }>
  passed: boolean
  attemptedAt: Date
  completedAt: Date
  certificate?: {
    id: string
    certificateUrl: string
    generatedAt: Date
  }
}

export interface Certificate {
  id: string
  quizAttemptId?: string | null // Now optional for bulk certificates
  bulkCertificateId?: string | null // New: link to bulk cert
  enrollmentId: string
  userId: string
  courseId: string
  certificateNumber?: string | null // New: trackable number
  certificateUrl: string
  generatedAt: Date
  emailedToAttendeeAt: Date | null
  emailedToPresenterAt: Date | null
  course?: {
    id: string
    title: string
    aiaCourseNumber: string
    learningUnits: number
    learningUnitsType: string
  }
  quizAttempt?: {
    score: number
    completedAt: Date
  }
  // New: for bulk certificates
  bulkCertificate?: {
    id: string
    attendeeName: string
    attendeeEmail: string
    courseTitle: string
    presentationDate: Date
  }
}
