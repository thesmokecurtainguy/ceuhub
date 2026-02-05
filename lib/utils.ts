/**
 * Utility functions for common operations
 */

/**
 * Calculate quiz score from answers
 */
export function calculateQuizScore(
  answers: Array<{ questionId: string; answerSelected: string }>,
  questions: Array<{ id: string; correctAnswer: string }>
): { score: number; answers: Array<{ questionId: string; answerSelected: string; isCorrect: boolean }> } {
  let correctCount = 0
  const detailedAnswers = answers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId)
    const isCorrect = question?.correctAnswer === answer.answerSelected
    if (isCorrect) correctCount++
    return {
      questionId: answer.questionId,
      answerSelected: answer.answerSelected,
      isCorrect: !!isCorrect,
    }
  })

  const score = (correctCount / questions.length) * 100
  return { score, answers: detailedAnswers }
}

/**
 * Check if user passed quiz (>= 80%)
 */
export function didPassQuiz(score: number): boolean {
  return score >= 80
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate AIA number format (if needed)
 */
export function isValidAiaNumber(aiaNumber: string): boolean {
  // Basic validation - adjust based on actual AIA number format
  return /^[A-Z0-9-]+$/.test(aiaNumber)
}

/**
 * Generate random string for tokens
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Slugify string for URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}


