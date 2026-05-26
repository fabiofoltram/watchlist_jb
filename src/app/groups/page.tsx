import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Users, Film } from 'lucide-react'
import CreateGroupButton from './CreateGroupButton'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('watch_group_members')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = (memberships || []).map(m => m.group_id)

  const { data: groups } = groupIds.length > 0
    ? await supabase
        .from('watch_groups')
        .select('*, watch_group_members(count), watch_group_items(count)')
        .in('id', groupIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Grupos</h1>
              <p className="text-gray-500 text-sm mt-1">Assista junto com amigos</p>
            </div>
            <CreateGroupButton userId={user.id} />
          </div>

          {!groups || groups.length === 0 ? (
            <div className="text-center py-20">
              <Users size={48} className="mx-auto mb-4 text-gray-700" />
              <h2 className="text-xl font-semibold text-white mb-2">Nenhum grupo ainda</h2>
              <p className="text-gray-500 mb-6">Crie um grupo e convide amigos para assistir juntos</p>
              <CreateGroupButton userId={user.id} />
            </div>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => {
                const memberCount = (group.watch_group_members as { count: number }[])[0]?.count ?? 0
                const itemCount = (group.watch_group_items as { count: number }[])[0]?.count ?? 0
                return (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl p-5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{group.name}</h3>
                        {group.description && (
                          <p className="text-gray-500 text-sm mt-1">{group.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-sm shrink-0">
                        <span className="flex items-center gap-1">
                          <Film size={13} />
                          {itemCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={13} />
                          {memberCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
