import { put, list, del } from '@vercel/blob'
import { Readable } from 'stream'

export interface BlobUploadOptions {
  contentType?: string
  access?: 'public' | 'private'
}

/**
 * Upload a file to Vercel Blob Storage
 */
export async function uploadToBlob(
  path: string,
  data: string | ArrayBuffer | Blob | FormData | ReadableStream | Readable,
  options?: BlobUploadOptions
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }
  
  const blob = await put(path, data as any, {
    access: (options?.access || 'public') as 'public',
    contentType: options?.contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

/**
 * Upload a file buffer to Vercel Blob
 */
export async function uploadBufferToBlob(
  path: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  return uploadToBlob(path, buffer as any, { contentType, access: 'public' })
}

/**
 * List files in a directory
 */
export async function listBlobs(prefix: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }
  
  const { blobs } = await list({
    prefix,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blobs
}

/**
 * Delete a blob
 */
export async function deleteBlob(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }
  
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
}

/**
 * Generate blob paths for course-related files
 */
export const blobPaths = {
  coursePdf: (courseId: string) => `ceuhub/${courseId}/original.pdf`,
  slideImage: (courseId: string, slideNumber: number) =>
    `ceuhub/${courseId}/slides/slide-${slideNumber}.png`,
  slideVideo: (courseId: string, slideNumber: number) =>
    `ceuhub/${courseId}/videos/slide-${slideNumber}.mp4`,
  certificate: (certificateId: string) => `ceuhub/certificates/${certificateId}.pdf`,
  providerLogo: (courseId: string) => `ceuhub/logos/${courseId}.png`,
}
