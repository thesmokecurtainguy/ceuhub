'use client'

import { Course } from '@/types'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface CourseDetailProps {
  course: Course
}

export function CourseDetail({ course }: CourseDetailProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)

  useEffect(() => {
    // Check if user is already enrolled
    if (session?.user) {
      fetch(`/api/users/${session.user.id}/enrollments`)
        .then((res) => res.json())
        .then((data) => {
          const userEnrollment = data.find((e: any) => e.courseId === course.id)
          if (userEnrollment) {
            setEnrollment(userEnrollment)
          }
        })
        .catch(console.error)
    }
  }, [session, course.id])

  const handleEnroll = async () => {
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    setIsEnrolling(true)
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: course.id }),
      })

      if (!response.ok) throw new Error('Enrollment failed')

      const data = await response.json()
      setEnrollment(data)
      router.push(`/courses/${course.id}/slide/1`)
    } catch (error) {
      console.error('Enrollment error:', error)
      alert('Failed to enroll. Please try again.')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleContinue = () => {
    if (enrollment) {
      router.push(`/courses/${course.id}/slide/${enrollment.progressSlide + 1}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        
        {course.providerLogoUrl && (
          <div className="mb-6">
            <img
              src={course.providerLogoUrl}
              alt={course.providerName}
              className="h-16 object-contain"
            />
          </div>
        )}

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700">{course.description}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-500">AIA Course #</div>
            <div className="font-semibold">{course.aiaCourseNumber}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Learning Units</div>
            <div className="font-semibold">{course.learningUnits} {course.learningUnitsType}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Speaker</div>
            <div className="font-semibold">{course.speakerName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Provider</div>
            <div className="font-semibold">{course.providerName}</div>
          </div>
        </div>

        <div className="flex gap-4">
          {enrollment ? (
            <>
              <button
                onClick={handleContinue}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Continue Course
              </button>
              {enrollment.completedAt && (
                <span className="flex items-center text-green-600 font-semibold">
                  ✓ Completed
                </span>
              )}
            </>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isEnrolling ? 'Enrolling...' : 'Start Course'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
