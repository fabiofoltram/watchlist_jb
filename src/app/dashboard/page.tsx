import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import WatchlistCard from '@/components/WatchlistCard'
import { WatchlistItem, WatchStatus } from '@/types'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

const statusGroups: { key: WatchStatus; label: string; emoji: string }[] = [
  { key: 'watching', label: 'Assistindo', emoji: '▶️' },
  { key: 'want_to_watch', label: 'Quero ver', emoji: '🔖' },
  { key: 'watched', label: 'Assistido', emoji: '✅' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  const watchlist = (items || []) as WatchlistItem[]

  const grouped = statusGroups.reduce((acc, { key }) => {
    acc[key] = watchlist.filter(i => i.status === key)
    return acc
  }, {} as Record<WatchStatus, WatchlistItem[]>)

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Minha Lista</h1>
              <p className="text-gray-500 text-sm mt-1">{watchlist.length} título{watchlist.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Adicionar
            </Link>
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold text-white mb-2">Lista vazia</h2>
              <p className="text-gray-500 mb-6">Busque filmes e séries para adicionar</p>
              <Link href="/search" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors mx-auto w-fit">
                <Search size={16} />
                Buscar títulos
              </Link>
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
      </div>
    </>
  )
}
