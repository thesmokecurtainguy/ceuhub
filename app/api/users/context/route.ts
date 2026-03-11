import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/user-context'

export async function GET(req: NextRequest) {
  try {
    const context = await getUserContext()
    return NextResponse.json(context)
  } catch (error) {
    console.error('Get user context error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
