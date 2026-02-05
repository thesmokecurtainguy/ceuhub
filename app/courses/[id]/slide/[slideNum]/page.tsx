import { prisma } from '@/lib/db'
import { SlideViewer } from '@/components/courses/SlideViewer'
import { notFound } from 'next/navigation'

export default async function SlidePage({
  params,
}: {
  params: Promise<{ id: string; slideNum: string }>
}) {
  const { id, slideNum } = await params
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          slides: true,
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  const slideNumber = parseInt(slideNum, 10)
  const totalSlides = course._count.slides

  if (isNaN(slideNumber) || slideNumber < 1 || slideNumber > totalSlides) {
    notFound()
  }

  return <SlideViewer courseId={id} slideNumber={slideNumber} totalSlides={totalSlides} />
}
