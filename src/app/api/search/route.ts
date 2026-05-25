import { NextRequest, NextResponse } from 'next/server'
import { searchMulti } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || ''
  const data = await searchMulti(q)
  return NextResponse.json(data)
}
