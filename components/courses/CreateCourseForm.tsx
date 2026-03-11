'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface CreateCourseFormProps {
  organizationId: string
  organizationData?: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zip: string
    aiaProviderNumber: string
    logoUrl: string
    contactName: string
  }
}

export function CreateCourseForm({ organizationId, organizationData }: CreateCourseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aiaCourseNumber: '',
    sessionNumber: '',
    location: '',
    learningUnits: '',
    learningUnitsType: 'LU',
    speakerName: '',
    speakerTitle: '',
    courseType: 'H',
    providerName: organizationData?.name || '',
    providerContactName: organizationData?.contactName || '',
    providerAddress: organizationData?.address || '',
    providerCity: organizationData?.city || '',
    providerState: organizationData?.state || '',
    providerZip: organizationData?.zip || '',
    providerPhone: organizationData?.phone || '',
    providerEmail: organizationData?.email || '',
    providerNumber: organizationData?.aiaProviderNumber || '',
    providerLogoUrl: organizationData?.logoUrl || '',
    pdfUrl: '',
    videoProvider: '',
    requireVideoCompletion: false,
    isHosted: false, // Track 1: Self-paced online (session/location not needed)
  })

  // Update form when organizationData changes
  useEffect(() => {
    if (organizationData) {
      setFormData((prev) => ({
        ...prev,
        providerName: organizationData.name,
        providerContactName: organizationData.contactName,
        providerAddress: organizationData.address,
        providerCity: organizationData.city,
        providerState: organizationData.state,
        providerZip: organizationData.zip,
        providerPhone: organizationData.phone,
        providerEmail: organizationData.email,
        providerNumber: organizationData.aiaProviderNumber,
        providerLogoUrl: organizationData.logoUrl,
      }))
    }
  }, [organizationData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizationId,
          learningUnits: parseInt(formData.learningUnits),
          requireVideoCompletion: formData.requireVideoCompletion,
          isHosted: formData.isHosted,
          // For hosted courses, use placeholder values for session/location
          sessionNumber: formData.isHosted ? 'N/A' : formData.sessionNumber,
          location: formData.isHosted ? 'Online' : formData.location,
          providerLogoUrl: formData.providerLogoUrl || null,
          videoProvider: formData.videoProvider || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course')
      }

      // Redirect to the course page or organization dashboard
      router.push(`/org/${organizationId}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create course')
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Course Type Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Course Delivery Type</h3>
        <p className="text-sm text-gray-600 mb-4">
          Select how this course will be delivered to students
        </p>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isHosted"
            checked={formData.isHosted}
            onChange={handleChange}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Self-Paced Online Course (Track 1)
            </span>
            <p className="text-xs text-gray-600 mt-1">
              Students watch/take course individually, complete quiz, and receive certificate automatically. 
              Session number and location not required.
            </p>
          </div>
        </label>
        {!formData.isHosted && (
          <div className="mt-3 text-sm text-gray-600">
            <p className="font-medium">Rep/Presenter Track (Track 2)</p>
            <p className="text-xs mt-1">
              Rep uploads attendee information to generate certificates in bulk. 
              Session number and location are required.
            </p>
          </div>
        )}
      </div>

      {/* Basic Course Information */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AIA Course Number *
            </label>
            <input
              type="text"
              name="aiaCourseNumber"
              value={formData.aiaCourseNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Session Number - Only required for Track 2 (Rep/Presenter) */}
          {!formData.isHosted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Number *
              </label>
              <input
                type="text"
                name="sessionNumber"
                value={formData.sessionNumber}
                onChange={handleChange}
                required={!formData.isHosted}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {/* Location - Only required for Track 2 (Rep/Presenter) */}
          {!formData.isHosted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required={!formData.isHosted}
                placeholder="City, State or Venue name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Learning Units */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Units</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Units *
            </label>
            <input
              type="number"
              name="learningUnits"
              value={formData.learningUnits}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning Units Type *
            </label>
            <select
              name="learningUnitsType"
              value={formData.learningUnitsType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LU">LU (Learning Units)</option>
              <option value="HSW">HSW (Health, Safety, Welfare)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Speaker Information */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Speaker Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker Name *
            </label>
            <input
              type="text"
              name="speakerName"
              value={formData.speakerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Speaker Title *
            </label>
            <input
              type="text"
              name="speakerTitle"
              value={formData.speakerTitle}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Provider Information */}
      <div className="border-b pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Provider Information</h2>
          <span className="text-sm text-gray-500 italic">Pre-filled from organization</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Name *
            </label>
            <input
              type="text"
              name="providerName"
              value={formData.providerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Number *
            </label>
            <input
              type="text"
              name="providerNumber"
              value={formData.providerNumber}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name *
            </label>
            <input
              type="text"
              name="providerContactName"
              value={formData.providerContactName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email *
            </label>
            <input
              type="email"
              name="providerEmail"
              value={formData.providerEmail}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              name="providerPhone"
              value={formData.providerPhone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <input
              type="text"
              name="providerAddress"
              value={formData.providerAddress}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              name="providerCity"
              value={formData.providerCity}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              name="providerState"
              value={formData.providerState}
              onChange={handleChange}
              required
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              name="providerZip"
              value={formData.providerZip}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider Logo URL (optional)
            </label>
            <input
              type="url"
              name="providerLogoUrl"
              value={formData.providerLogoUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Course Details */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Type *
            </label>
            <select
              name="courseType"
              value={formData.courseType}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="H">H (Health)</option>
              <option value="HSW">HSW (Health, Safety, Welfare)</option>
              <option value="SD">SD (Sustainable Design)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF URL *
            </label>
            <input
              type="url"
              name="pdfUrl"
              value={formData.pdfUrl}
              onChange={handleChange}
              required
              placeholder="https://example.com/course.pdf"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Video & Hosting Options */}
      <div className="border-b pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Presentation Format</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Provider (optional)
            </label>
            <select
              name="videoProvider"
              value={formData.videoProvider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Slide Presentation)</option>
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
              <option value="wistia">Wistia</option>
              <option value="custom">Custom Video</option>
              <option value="hosted">Hosted Video</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select if this course uses video content. Can be slides, video, or interactive (like Hidden Breaches).
            </p>
          </div>
          {formData.isHosted && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireVideoCompletion"
                  checked={formData.requireVideoCompletion}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Require Video Completion</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Students must complete video viewing before taking the quiz
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Course'}
        </button>
      </div>
    </form>
  )
}
