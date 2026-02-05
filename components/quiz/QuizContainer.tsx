'use client'

import { Question } from '@/types'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface QuizContainerProps {
  courseId: string
  enrollmentId: string
  questions: Question[]
}

export function QuizContainer({ courseId, enrollmentId, questions }: QuizContainerProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    score: number
    passed: boolean
    certificateUrl?: string
  } | null>(null)

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions before submitting.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollmentId,
          courseId,
          answers: Object.entries(answers).map(([questionId, answerSelected]) => ({
            questionId,
            answerSelected,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit quiz')
      }

      const data = await response.json()
      setResult({
        score: data.score,
        passed: data.passed,
        certificateUrl: data.certificateUrl,
      })
    } catch (error) {
      console.error('Quiz submission error:', error)
      alert('Failed to submit quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">
          {result.passed ? '🎉 Congratulations!' : 'Quiz Results'}
        </h2>
        
        <div className="mb-6">
          <div className={`text-4xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
            {result.score.toFixed(1)}%
          </div>
          <p className="text-gray-600">
            {result.passed
              ? 'You passed! Your certificate has been generated and emailed to you.'
              : `You need at least 80% to pass. You got ${result.score.toFixed(1)}%.`}
          </p>
        </div>

        {result.passed && result.certificateUrl && (
          <div className="mb-6">
            <a
              href={result.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Download Certificate
            </a>
          </div>
        )}

        <div className="flex gap-4">
          {result.passed ? (
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null)
                setAnswers({})
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Retake Quiz
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Course Quiz</h2>
      
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Question {index + 1}: {question.questionText}
            </h3>
            
            <div className="space-y-2">
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <label
                  key={option}
                  className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium mr-2">{option}:</span>
                  <span>{question[`option${option}` as keyof Question] as string}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length !== questions.length}
          className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
        </button>
      </div>
    </div>
  )
}
