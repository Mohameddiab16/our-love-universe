import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, is_admin, is_blocked, created_at')
    .order('created_at', { ascending: false })

  const { data: subscriptions } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id, plan, expires_at')

  const subMap: Record<string, any> = {}
  subscriptions?.forEach(s => { subMap[s.user_id] = s })

  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  authUsers?.users?.forEach(u => { emailMap[u.id] = u.email || '' })

  const users = (profiles || []).map(p => ({
    ...p,
    email: emailMap[p.id] || '',
    plan: subMap[p.id]?.plan || 'free',
    expires_at: subMap[p.id]?.expires_at || null,
  }))

  return NextResponse.json({ users })
}
