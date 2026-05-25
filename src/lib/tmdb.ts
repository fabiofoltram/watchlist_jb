const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const tmdbImageUrl = (path: string | null, size = 'w500') =>
  path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null

export async function searchMulti(query: string, page = 1) {
  const key = process.env.TMDB_API_KEY
  if (!key) return { results: [], total_pages: 0, total_results: 0 }

  const res = await fetch(
    `${TMDB_BASE}/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false&language=pt-BR`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return { results: [], total_pages: 0, total_results: 0 }
  const data = await res.json()
  return {
    results: data.results.filter((r: { media_type: string }) => r.media_type === 'movie' || r.media_type === 'tv'),
    total_pages: data.total_pages,
    total_results: data.total_results,
  }
}

export async function getTrending(mediaType: 'movie' | 'tv' | 'all' = 'all', timeWindow: 'day' | 'week' = 'week') {
  const key = process.env.TMDB_API_KEY
  if (!key) return []

  const res = await fetch(
    `${TMDB_BASE}/trending/${mediaType}/${timeWindow}?api_key=${key}&language=pt-BR`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export async function getRecommendations(mediaType: 'movie' | 'tv', tmdbId: number) {
  const key = process.env.TMDB_API_KEY
  if (!key) return []

  const res = await fetch(
    `${TMDB_BASE}/${mediaType}/${tmdbId}/recommendations?api_key=${key}&language=pt-BR`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.results || []).slice(0, 12)
}

export async function getDetails(mediaType: 'movie' | 'tv', tmdbId: number) {
  const key = process.env.TMDB_API_KEY
  if (!key) return null

  const res = await fetch(
    `${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${key}&language=pt-BR`,
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) return null
  return res.json()
}

export async function getItemDetails(mediaType: 'movie' | 'tv', tmdbId: number) {
  const key = process.env.TMDB_API_KEY
  if (!key) return { genres: [], providers: [] }

  const [detailsRes, providersRes] = await Promise.all([
    fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${key}&language=pt-BR`, { next: { revalidate: 3600 } }),
    fetch(`${TMDB_BASE}/${mediaType}/${tmdbId}/watch/providers?api_key=${key}`, { next: { revalidate: 3600 } }),
  ])

  const genres: { id: number; name: string }[] = []
  const providers: { provider_id: number; provider_name: string; logo_path: string }[] = []

  if (detailsRes.ok) {
    const data = await detailsRes.json()
    for (const g of data.genres || []) genres.push({ id: g.id, name: g.name })
  }

  if (providersRes.ok) {
    const data = await providersRes.json()
    for (const p of data.results?.BR?.flatrate || []) {
      providers.push({ provider_id: p.provider_id, provider_name: p.provider_name, logo_path: p.logo_path })
    }
  }

  return { genres, providers }
}
