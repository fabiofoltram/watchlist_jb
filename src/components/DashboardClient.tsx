'use client'

import { useState, useMemo } from 'react'
import WatchlistCard from '@/components/WatchlistCard'
import { WatchlistItem, WatchStatus } from '@/types'
import Link from 'next/link'
import { Search, Plus, X } from 'lucide-react'

const statusGroups: { key: WatchStatus; label: string; emoji: string }[] = [
  { key: 'watching', label: 'Assistindo', emoji: '▶️' },
  { key: 'want_to_watch', label: 'Quero ver', emoji: '🔖' },
  { key: 'watched', label: 'Assistido', emoji: '✅' },
]

interface Props {
  items: WatchlistItem[]
}

export default function DashboardClient({ items }: Props) {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [filterGenre, setFilterGenre] = useState<string>('all')

  const availableProviders = useMemo(() => {
    const map = new Map<string, string>()
    for (const item of items) {
      for (const p of item.providers ?? []) map.set(p.provider_name, p.logo_path)
    }
    return Array.from(map.entries()).map(([name, logo_path]) => ({ name, logo_path }))
  }, [items])

  const availableGenres = useMemo(() => {
    const seen = new Set<string>()
    const genres: string[] = []
    for (const item of items) {
      for (const g of item.genres ?? []) {
        if (!seen.has(g.name)) { seen.add(g.name); genres.push(g.name) }
      }
    }
    return genres
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filterType !== 'all' && item.media_type !== filterType) return false
      if (filterProvider !== 'all' && !item.providers?.some(p => p.provider_name === filterProvider)) return false
      if (filterGenre !== 'all' && !item.genres?.some(g => g.name === filterGenre)) return false
      return true
    })
  }, [items, filterType, filterProvider, filterGenre])

  const grouped = statusGroups.reduce((acc, { key }) => {
    acc[key] = filtered.filter(i => i.status === key)
    return acc
  }, {} as Record<WatchStatus, WatchlistItem[]>)

  const hasFilters = filterType !== 'all' || filterProvider !== 'all' || filterGenre !== 'all'

  function clearFilters() {
    setFilterType('all')
    setFilterProvider('all')
    setFilterGenre('all')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Minha Lista</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length !== items.length
              ? `${filtered.length} de ${items.length} título${items.length !== 1 ? 's' : ''}`
              : `${items.length} título${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Adicionar
        </Link>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 mb-8">
          {/* Tipo */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'movie', 'tv'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filterType === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'movie' ? 'Filmes' : 'Séries'}
              </button>
            ))}
          </div>

          {/* Plataformas */}
          {availableProviders.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setFilterProvider('all')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filterProvider === 'all' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Todas
              </button>
              {availableProviders.map(p => (
                <button
                  key={p.name}
                  onClick={() => setFilterProvider(filterProvider === p.name ? 'all' : p.name)}
                  title={p.name}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium transition-colors border ${
                    filterProvider === p.name
                      ? 'border-violet-500 bg-violet-600/20 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                    alt={p.name}
                    width={16}
                    height={16}
                    className="rounded-sm"
                  />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Gêneros */}
          {availableGenres.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterGenre('all')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filterGenre === 'all' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              {availableGenres.map(g => (
                <button
                  key={g}
                  onClick={() => setFilterGenre(filterGenre === g ? 'all' : g)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                    filterGenre === g ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <X size={12} />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-xl font-semibold text-white mb-2">Lista vazia</h2>
          <p className="text-gray-500 mb-6">Busque filmes e séries para adicionar</p>
          <Link href="/search" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors mx-auto w-fit">
            <Search size={16} />
            Buscar títulos
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>Nenhum título corresponde aos filtros selecionados.</p>
          <button onClick={clearFilters} className="mt-3 text-violet-400 hover:text-violet-300 text-sm">
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {statusGroups.map(({ key, label, emoji }) => {
            const group = grouped[key]
            if (group.length === 0) return null
            return (
              <section key={key}>
                <h2 className="text-lg font-semibold text-white mb-4">
                  {emoji} {label} <span className="text-gray-500 font-normal text-sm">({group.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.map(item => (
                    <WatchlistCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
