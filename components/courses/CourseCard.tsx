'use client'

import { Course } from '@/types'
import Link from 'next/link'

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const slideCount = course._count?.slides || 0

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{slideCount} slides</span>
          <span>AIA #{course.aiaCourseNumber}</span>
        </div>
        
        {course.providerLogoUrl && (
          <div className="mt-4">
            <img
              src={course.providerLogoUrl}
              alt={course.providerName}
              className="h-10 object-contain"
            />
          </div>
        )}
      </div>
    </Link>
  )
}


