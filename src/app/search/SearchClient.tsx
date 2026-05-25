'use client'

import { useState, useCallback, useRef } from 'react'
import Navbar from '@/components/Navbar'
import MediaCard from '@/components/MediaCard'
import { TMDBResult } from '@/types'
import { Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  watchlistSet: Set<string>
}

type AddStatus = 'want_to_watch' | 'watching' | 'watched'

export default function SearchClient({ userId, watchlistSet: initialSet }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBResult[]>([])
  const [loading, setLoading] = useState(false)
  const [watchlistSet, setWatchlistSet] = useState(initialSet)
  const [modal, setModal] = useState<TMDBResult | null>(null)
  const [addStatus, setAddStatus] = useState<AddStatus>('want_to_watch')
  const [adding, setAdding] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.results || [])
    setLoading(false)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 400)
  }

  function openModal(item: TMDBResult) {
    setModal(item)
    setAddStatus('want_to_watch')
  }

  async function addToWatchlist() {
    if (!modal) return
    setAdding(true)
    const title = modal.media_type === 'movie' ? modal.title : modal.name
    const detailsRes = await fetch(`/api/item-details?mediaType=${modal.media_type}&tmdbId=${modal.id}`)
    const { genres, providers } = await detailsRes.json()
    await supabase.from('watchlist_items').upsert({
      user_id: userId,
      tmdb_id: modal.id,
      media_type: modal.media_type,
      title,
      poster_path: modal.poster_path,
      status: addStatus,
      genres,
      providers,
    }, { onConflict: 'user_id,tmdb_id,media_type' })
    setWatchlistSet(prev => new Set(prev).add(`${modal.media_type}-${modal.id}`))
    setAdding(false)
    setModal(null)
    router.refresh()
  }

  const statusLabels = {
    want_to_watch: 'Quero ver',
    watching: 'Assistindo',
    watched: 'Assistido',
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">Buscar</h1>

          <div className="relative mb-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={e => handleInput(e.target.value)}
              placeholder="Buscar filmes e séries..."
              className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-lg"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            )}
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-500">Buscando...</div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {results.map(item => (
                <MediaCard
                  key={`${item.media_type}-${item.id}`}
                  item={item}
                  inWatchlist={watchlistSet.has(`${item.media_type}-${item.id}`)}
                  onAdd={openModal}
                />
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">Nenhum resultado para &ldquo;{query}&rdquo;</div>
          )}

          {!query && (
            <div className="text-center py-12 text-gray-600">
              <Search size={48} className="mx-auto mb-3 opacity-30" />
              <p>Digite o nome de um filme ou série</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setModal(null)}>
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-1">
              {modal.media_type === 'movie' ? modal.title : modal.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Como deseja adicionar?</p>

            <div className="space-y-2 mb-5">
              {(Object.entries(statusLabels) as [AddStatus, string][]).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setAddStatus(value)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    addStatus === value
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700">
                Cancelar
              </button>
              <button
                onClick={addToWatchlist}
                disabled={adding}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium"
              >
                {adding ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
