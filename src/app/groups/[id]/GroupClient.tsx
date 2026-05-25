'use client'

import { useState } from 'react'
import Image from 'next/image'
import { tmdbImageUrl } from '@/lib/tmdb'
import { WatchGroup, WatchGroupMember, WatchGroupItem, TMDBResult } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, Check, X, Star } from 'lucide-react'
import MediaCard from '@/components/MediaCard'

interface Props {
  group: WatchGroup
  userId: string
  isCreator: boolean
  members: WatchGroupMember[]
  items: WatchGroupItem[]
}

type GroupItemStatus = 'suggested' | 'watching' | 'watched'

const statusColors: Record<GroupItemStatus, string> = {
  suggested: 'bg-gray-700 text-gray-300',
  watching: 'bg-blue-700 text-blue-100',
  watched: 'bg-green-700 text-green-100',
}

const statusLabels: Record<GroupItemStatus, string> = {
  suggested: 'Sugerido',
  watching: 'Assistindo',
  watched: 'Assistido',
}

export default function GroupClient({ group, userId, isCreator, members, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function doSearch(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setSearchResults(data.results || [])
    setSearching(false)
  }

  async function suggestItem(item: TMDBResult) {
    const title = item.media_type === 'movie' ? item.title : item.name
    const { data } = await supabase
      .from('watch_group_items')
      .upsert({
        group_id: group.id,
        tmdb_id: item.id,
        media_type: item.media_type,
        title,
        poster_path: item.poster_path,
        suggested_by: userId,
        status: 'suggested',
      }, { onConflict: 'group_id,tmdb_id,media_type' })
      .select('*, suggester:profiles(id, username, avatar_url)')
      .single()
    if (data) setItems(prev => [data, ...prev.filter(i => i.id !== data.id)])
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  async function updateItemStatus(itemId: string, status: GroupItemStatus) {
    await supabase.from('watch_group_items').update({ status }).eq('id', itemId)
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status } : i))
  }

  async function removeItem(itemId: string) {
    await supabase.from('watch_group_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function inviteMember() {
    setInviteMsg('')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', inviteEmail.trim())
      .single()

    if (!profile) {
      setInviteMsg('Usuário não encontrado. Certifique-se de usar o nome de usuário.')
      return
    }

    const { error } = await supabase
      .from('watch_group_members')
      .insert({ group_id: group.id, user_id: profile.id })

    if (error) {
      setInviteMsg('Usuário já é membro.')
      return
    }
    setInviteMsg('Membro adicionado com sucesso!')
    setInviteEmail('')
    router.refresh()
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">{group.name}</h1>
            {group.description && <p className="text-gray-500 text-sm mt-1">{group.description}</p>}
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-xl text-sm transition-colors"
              >
                <UserPlus size={14} />
                Convidar
              </button>
            )}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-xl text-sm transition-colors"
            >
              <Search size={14} />
              Sugerir
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {members.map(m => (
            <div key={m.id} title={(m.profile as { username: string | null } | undefined)?.username || 'Usuário'} className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white">
              {((m.profile as { username: string | null } | undefined)?.username?.[0] || '?').toUpperCase()}
            </div>
          ))}
          <span className="text-gray-500 text-sm">{members.length} membro{members.length !== 1 ? 's' : ''}</span>
        </div>

        {showInvite && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-3">Convidar membro</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="Nome de usuário"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500"
              />
              <button onClick={inviteMember} className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Convidar
              </button>
            </div>
            {inviteMsg && <p className="text-sm mt-2 text-gray-400">{inviteMsg}</p>}
          </div>
        )}

        {showSearch && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); doSearch(e.target.value) }}
                placeholder="Buscar para sugerir..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchResults([]) }} className="text-gray-500 hover:text-white p-2">
                <X size={16} />
              </button>
            </div>
            {searching && <p className="text-sm text-gray-500">Buscando...</p>}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map(item => (
                  <MediaCard
                    key={`${item.media_type}-${item.id}`}
                    item={item}
                    inWatchlist={items.some(i => i.tmdb_id === item.id && i.media_type === item.media_type)}
                    onAdd={suggestItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Star size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma sugestão ainda. Seja o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map(item => (
              <div key={item.id} className="bg-gray-900 rounded-xl overflow-hidden flex gap-3 p-3">
                <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                  {item.poster_path ? (
                    <Image
                      src={tmdbImageUrl(item.poster_path) || ''}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    por {(item.suggester as { username: string | null } | undefined)?.username || 'alguém'}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {(['suggested', 'watching', 'watched'] as GroupItemStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateItemStatus(item.id, s)}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                          item.status === s ? statusColors[s] : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                        }`}
                      >
                        {statusLabels[s]}
                      </button>
                    ))}
                    {isCreator && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-gray-700"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
