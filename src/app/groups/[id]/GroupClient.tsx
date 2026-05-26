'use client'

import { useState } from 'react'
import Image from 'next/image'
import { tmdbImageUrl } from '@/lib/tmdb'
import { WatchGroup, WatchGroupMember, WatchGroupItem, TMDBResult } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, Search, X, Star, Pencil, UserMinus, Trash2 } from 'lucide-react'
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

export default function GroupClient({ group, userId, isCreator, members: initialMembers, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [members, setMembers] = useState(initialMembers)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteUsername, setInviteUsername] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [editDesc, setEditDesc] = useState(group.description || '')
  const [editSaving, setEditSaving] = useState(false)
  const [groupName, setGroupName] = useState(group.name)
  const [groupDesc, setGroupDesc] = useState(group.description || '')
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
      .eq('username', inviteUsername.trim())
      .single()

    if (!profile) {
      setInviteMsg('Usuário não encontrado.')
      return
    }

    const { error } = await supabase
      .from('watch_group_members')
      .insert({ group_id: group.id, user_id: profile.id })

    if (error) {
      setInviteMsg('Usuário já é membro.')
      return
    }
    setInviteMsg('Membro adicionado!')
    setInviteUsername('')
    router.refresh()
  }

  async function removeMember(memberId: string, memberUserId: string) {
    if (memberUserId === group.created_by) return
    await supabase.from('watch_group_members').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
  }

  async function saveEdit() {
    if (!editName.trim()) return
    setEditSaving(true)
    await supabase
      .from('watch_groups')
      .update({ name: editName.trim(), description: editDesc.trim() || null })
      .eq('id', group.id)
    setGroupName(editName.trim())
    setGroupDesc(editDesc.trim())
    setEditSaving(false)
    setShowEdit(false)
    router.refresh()
  }

  async function deleteGroup() {
    if (!confirm(`Excluir o grupo "${groupName}"? Esta ação não pode ser desfeita.`)) return
    await supabase.from('watch_group_items').delete().eq('group_id', group.id)
    await supabase.from('watch_group_members').delete().eq('group_id', group.id)
    await supabase.from('watch_groups').delete().eq('id', group.id)
    router.push('/groups')
  }

  const statusSummary = {
    suggested: items.filter(i => i.status === 'suggested').length,
    watching: items.filter(i => i.status === 'watching').length,
    watched: items.filter(i => i.status === 'watched').length,
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white">{groupName}</h1>
            {groupDesc && <p className="text-gray-500 text-sm mt-1">{groupDesc}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            {isCreator && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm transition-colors"
              >
                <Pencil size={13} />
                Editar
              </button>
            )}
            {isCreator && (
              <button
                onClick={() => setShowInvite(!showInvite)}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-sm transition-colors"
              >
                <UserPlus size={13} />
                Convidar
              </button>
            )}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-2 rounded-xl text-sm transition-colors"
            >
              <Search size={13} />
              Sugerir
            </button>
          </div>
        </div>

        {/* Membros */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {members.map(m => {
            const username = (m.profile as { username: string | null } | undefined)?.username
            const isOwner = m.user_id === group.created_by
            return (
              <div key={m.id} className="flex items-center gap-1 bg-gray-800 rounded-full pl-1 pr-2 py-0.5">
                <div className="w-6 h-6 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {(username?.[0] || '?').toUpperCase()}
                </div>
                <span className="text-xs text-gray-300">{username || 'Usuário'}</span>
                {isCreator && !isOwner && (
                  <button onClick={() => removeMember(m.id, m.user_id)} className="ml-0.5 text-gray-600 hover:text-red-400">
                    <X size={10} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Resumo */}
        {items.length > 0 && (
          <div className="flex gap-3 mb-6">
            {statusSummary.suggested > 0 && (
              <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">
                {statusSummary.suggested} sugerido{statusSummary.suggested !== 1 ? 's' : ''}
              </span>
            )}
            {statusSummary.watching > 0 && (
              <span className="text-xs bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full">
                {statusSummary.watching} assistindo
              </span>
            )}
            {statusSummary.watched > 0 && (
              <span className="text-xs bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                {statusSummary.watched} assistido{statusSummary.watched !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Modal editar */}
        {showEdit && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setShowEdit(false)}>
            <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-white mb-4">Editar grupo</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nome do grupo"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
                />
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 rounded-lg bg-gray-800 text-gray-300 text-sm font-medium hover:bg-gray-700">
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving || !editName.trim()}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium"
                >
                  {editSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <button
                onClick={deleteGroup}
                className="w-full mt-3 py-2 rounded-lg text-xs text-red-500 hover:text-red-400 hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={12} />
                Excluir grupo
              </button>
            </div>
          </div>
        )}

        {/* Convidar */}
        {showInvite && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-white mb-3">Convidar membro</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inviteMember()}
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

        {/* Buscar para sugerir */}
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

        {/* Lista de itens */}
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

        {/* Excluir grupo (rodapé, só criador) */}
        {isCreator && (
          <div className="mt-12 pt-6 border-t border-gray-800">
            <button
              onClick={deleteGroup}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
              Excluir grupo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
