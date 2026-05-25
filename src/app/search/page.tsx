import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SearchClient from './SearchClient'

export default async function SearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('watchlist_items')
    .select('tmdb_id, media_type')
    .eq('user_id', user.id)

  const watchlistSet = new Set((items || []).map(i => `${i.media_type}-${i.tmdb_id}`))

  return <SearchClient userId={user.id} watchlistSet={watchlistSet} />
}
