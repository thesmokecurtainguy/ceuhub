import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import { blobPaths, uploadBufferToBlob } from './blob-storage'

// Set worker source for PDF.js
if (typeof window === 'undefined') {
  // Server-side: use require.resolve to find the worker file
  try {
    GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.js')
  } catch (error) {
    // Fallback if worker file not found
    console.warn('PDF.js worker not found. PDF parsing may not work correctly.')
  }
} else {
  // Client-side: use public path
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

export interface SlideImage {
  slideNumber: number
  imageUrl: string
}

/**
 * Parse PDF file and extract slides as images
 * NOTE: Server-side PDF parsing is disabled for MVP.
 * For MVP, manually upload slide images to Vercel Blob and create slide records via database.
 * This function is kept for future implementation.
 */
export async function parsePdfToSlides(
  pdfBuffer: Buffer,
  courseId: string
): Promise<SlideImage[]> {
  // TODO: Implement server-side PDF parsing when ready
  // For MVP, slides should be manually uploaded as images
  throw new Error(
    'Server-side PDF parsing is not implemented. Please upload slide images manually via Vercel Blob.'
  )
}

/**
 * Client-side PDF parsing (for preview purposes)
 * Note: This is a simplified version that can be used in the browser
 */
export async function parsePdfClientSide(file: File): Promise<SlideImage[]> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise
  const slideImages: SlideImage[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2.0 })
    
    // Create canvas element
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const context = canvas.getContext('2d')!
    
    await page.render({
      canvasContext: context as any,
      viewport: viewport,
    }).promise

    // Convert canvas to data URL
    const imageUrl = canvas.toDataURL('image/png')
    
    slideImages.push({
      slideNumber: pageNum,
      imageUrl,
    })
  }

  return slideImages
}