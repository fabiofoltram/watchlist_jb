'use client'

import Image from 'next/image'
import { useState } from 'react'
import { tmdbImageUrl } from '@/lib/tmdb'
import { WatchlistItem, WatchStatus } from '@/types'
import { Star, Trash2, StickyNote, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const statusLabels: Record<WatchStatus, string> = {
  want_to_watch: 'Quero ver',
  watching: 'Assistindo',
  watched: 'Assistido',
}

const statusColors: Record<WatchStatus, string> = {
  want_to_watch: 'bg-gray-700 text-gray-300',
  watching: 'bg-blue-700 text-blue-100',
  watched: 'bg-green-700 text-green-100',
}

interface WatchlistCardProps {
  item: WatchlistItem
}

export default function WatchlistCard({ item }: WatchlistCardProps) {
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(item.rating || 0)
  const [notes, setNotes] = useState(item.notes || '')
  const [status, setStatus] = useState<WatchStatus>(item.status)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const imageUrl = tmdbImageUrl(item.poster_path)

  async function save() {
    setSaving(true)
    await supabase
      .from('watchlist_items')
      .update({
        status,
        rating: rating || null,
        notes: notes || null,
        watched_at: status === 'watched' ? new Date().toISOString() : null,
      })
      .eq('id', item.id)
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function remove() {
    if (!confirm(`Remover "${item.title}" da sua lista?`)) return
    await supabase.from('watchlist_items').delete().eq('id', item.id)
    router.refresh()
  }

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden flex gap-3 p-3">
      <div className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-800">
        {imageUrl ? (
          <Image src={imageUrl} alt={item.title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.media_type === 'movie' ? 'text-blue-400' : 'text-orange-400'}`}>
              {item.media_type === 'movie' ? 'Filme' : 'Série'}
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(!editing)} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white">
              {editing ? <Check size={14} /> : <StickyNote size={14} />}
            </button>
            <button onClick={remove} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {!editing ? (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </span>
            {item.rating && (
              <span className="flex items-center gap-1 text-xs text-yellow-400">
                <Star size={10} className="fill-yellow-400" />
                {item.rating}/5
              </span>
            )}
            {item.notes && (
              <p className="text-xs text-gray-500 italic truncate">&ldquo;{item.notes}&rdquo;</p>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <select
              value={status}
              onChange={e => setStatus(e.target.value as WatchStatus)}
              className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white"
            >
              {Object.entries(statusLabels).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n === rating ? 0 : n)}>
                  <Star size={16} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} />
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Anotações..."
              rows={2}
              className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white resize-none placeholder-gray-600"
            />

            <button
              onClick={save}
              disabled={saving}
              className="w-full text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-1.5 rounded-lg font-medium transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
