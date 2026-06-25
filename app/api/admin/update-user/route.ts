import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, targetUserId, plan, blocked } = await req.json()

  if (action === 'set_plan') {
    const expiresAt = plan === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseAdmin.from('user_subscriptions')
      .upsert({ user_id: targetUserId, plan, expires_at: expiresAt }, { onConflict: 'user_id' })
    return NextResponse.json({ success: true })
  }

  if (action === 'set_blocked') {
    await supabaseAdmin.from('profiles').update({ is_blocked: blocked }).eq('id', targetUserId)
    if (blocked) {
      await supabaseAdmin.auth.admin.signOut(targetUserId)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
