'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface BulkCertificateUploadFormProps {
  organizationId: string
  courses: Array<{
    id: string
    title: string
    aiaCourseNumber: string
  }>
}

export function BulkCertificateUploadForm({
  organizationId,
  courses,
}: BulkCertificateUploadFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    if (!selectedCourseId) {
      setError('Please select a course first')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseId', selectedCourseId)

      const response = await fetch(`/api/organizations/${organizationId}/certificates/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setSuccess(
        `Successfully uploaded ${data.createdCount} certificate(s)${
          data.errors && data.errors.length > 0
            ? `. ${data.errors.length} row(s) had errors`
            : ''
        }`
      )

      if (data.errors && data.errors.length > 0) {
        setError(`Errors: ${data.errors.join('; ')}`)
      }

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect to certificates page after 2 seconds
      setTimeout(() => {
        router.push(`/org/${organizationId}/certificates`)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
      setLoading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const templateContent = `Full Name,Email,AIA Number,License Number,Presentation Date,Presenter Name,Location
John Doe,john.doe@example.com,12345678,CA-12345,02/15/2026,Jane Smith,ABC Architecture, Los Angeles, CA
Jane Smith,jane.smith@example.com,87654321,,02/15/2026,Jane Smith,XYZ Design Group, San Francisco, CA`

    const blob = new Blob([templateContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'certificate_template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-start">
          <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Course Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Course *
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Select a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title} (AIA #{course.aiaCourseNumber})
            </option>
          ))}
        </select>
        {courses.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            No courses available. Create a course first.
          </p>
        )}
      </div>

      {/* CSV Upload Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">CSV Format Requirements</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>
            <strong>Required columns:</strong> Full Name, Email, Presentation Date, Presenter Name,
            Location
          </li>
          <li>
            <strong>Optional columns:</strong> AIA Number, License Number
          </li>
          <li>Date format: MM/DD/YYYY (e.g., 02/15/2026)</li>
          <li>Maximum 100 rows per upload</li>
        </ul>
      </div>

      {/* Upload Section */}
      <div className="border-t pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={loading || !selectedCourseId}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                loading || !selectedCourseId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Select CSV File
                </>
              )}
            </label>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Template
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> After uploading, certificates will be generated and emails will be
          sent automatically. You can view the status on the Certificates page.
        </p>
      </div>
    </div>
  )
}
