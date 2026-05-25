import { NextRequest, NextResponse } from 'next/server'
import { getItemDetails } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mediaType = searchParams.get('mediaType') as 'movie' | 'tv'
  const tmdbId = parseInt(searchParams.get('tmdbId') || '0')

  if (!mediaType || !tmdbId) return NextResponse.json({ genres: [], providers: [] })

  const details = await getItemDetails(mediaType, tmdbId)
  return NextResponse.json(details)
}
