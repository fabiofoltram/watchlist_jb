import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DashboardClient from '@/components/DashboardClient'
import { WatchlistItem } from '@/types'

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

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <DashboardClient items={watchlist} />
      </div>
    </>
  )
}
