'use client'

import { Slide } from '@/types'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SlideViewerProps {
  courseId: string
  slideNumber: number
  totalSlides: number
}

export function SlideViewer({ courseId, slideNumber, totalSlides }: SlideViewerProps) {
  const router = useRouter()
  const [slide, setSlide] = useState<Slide | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)

  useEffect(() => {
    async function fetchSlide() {
      try {
        const response = await fetch(`/api/courses/${courseId}/slides`)
        const slides: Slide[] = await response.json()
        const currentSlide = slides.find((s) => s.slideNumber === slideNumber)
        setSlide(currentSlide || null)
      } catch (error) {
        console.error('Failed to fetch slide:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlide()
  }, [courseId, slideNumber])

  useEffect(() => {
    // Update progress when slide changes
    if (slide && slideNumber > 0) {
      updateProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideNumber])

  const updateProgress = async () => {
    setIsUpdatingProgress(true)
    try {
      // Get current user's enrollments
      const sessionRes = await fetch('/api/users/me')
      const user = await sessionRes.json()
      const enrollmentsRes = await fetch(`/api/users/${user.id}/enrollments`)
      const enrollments = await enrollmentsRes.json()
      const enrollment = enrollments.find((e: any) => e.courseId === courseId)

      if (enrollment) {
        await fetch(`/api/enrollments/${enrollment.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progressSlide: slideNumber }),
        })
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    } finally {
      setIsUpdatingProgress(false)
    }
  }

  const handleNext = () => {
    if (slideNumber < totalSlides) {
      router.push(`/courses/${courseId}/slide/${slideNumber + 1}`)
    } else {
      router.push(`/courses/${courseId}/quiz`)
    }
  }

  const handlePrevious = () => {
    if (slideNumber > 1) {
      router.push(`/courses/${courseId}/slide/${slideNumber - 1}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading slide...</div>
      </div>
    )
  }

  if (!slide) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Slide not found</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-500">
            Slide {slideNumber} of {totalSlides}
          </div>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Course
          </button>
        </div>

        <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img
            src={slide.imageUrl}
            alt={`Slide ${slideNumber}`}
            className="w-full h-auto"
          />
          {slide.videoUrl && (
            <div className="absolute bottom-4 right-4">
              <video
                src={slide.videoUrl}
                controls
                className="max-w-xs rounded-lg shadow-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={slideNumber === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {slideNumber === totalSlides ? 'Take Quiz' : 'Next Slide'}
          </button>
        </div>
      </div>
    </div>
  )
}
