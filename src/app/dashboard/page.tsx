import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DashboardClient from '@/components/DashboardClient'
import { WatchlistItem, WatchGroup } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: items }, { data: memberships }] = await Promise.all([
    supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false }),
    supabase
      .from('watch_group_members')
      .select('group_id')
      .eq('user_id', user.id),
  ])

  const groupIds = (memberships || []).map(m => m.group_id)
  const { data: groups } = groupIds.length > 0
    ? await supabase.from('watch_groups').select('*').in('id', groupIds).order('name')
    : { data: [] }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <DashboardClient
          items={(items || []) as WatchlistItem[]}
          groups={(groups || []) as WatchGroup[]}
        />
      </div>
    </>
  )
}
