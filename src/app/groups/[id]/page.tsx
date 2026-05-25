import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GroupClient from './GroupClient'

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: group } = await supabase
    .from('watch_groups')
    .select('*')
    .eq('id', id)
    .single()

  if (!group) notFound()

  const { data: membership } = await supabase
    .from('watch_group_members')
    .select('id')
    .eq('group_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/groups')

  const { data: members } = await supabase
    .from('watch_group_members')
    .select('*, profile:profiles(id, username, avatar_url)')
    .eq('group_id', id)

  const { data: groupItems } = await supabase
    .from('watch_group_items')
    .select('*, suggester:profiles(id, username, avatar_url)')
    .eq('group_id', id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <GroupClient
        group={group}
        userId={user.id}
        isCreator={group.created_by === user.id}
        members={members || []}
        items={groupItems || []}
      />
    </>
  )
}
