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

  const { inviteToken } = await req.json()

  // Get invitation
  const { data: inv, error: invErr } = await supabaseAdmin
    .from('partner_invitations')
    .select('*')
    .eq('token', inviteToken)
    .single()

  if (invErr || !inv) return NextResponse.json({ error: 'رابط الدعوة غير صالح' }, { status: 404 })
  if (inv.status === 'accepted') return NextResponse.json({ error: 'تم قبول هذه الدعوة مسبقاً' }, { status: 400 })

  // Check not already a member
  const { data: existing } = await supabaseAdmin
    .from('world_members')
    .select('id')
    .eq('world_id', inv.world_id)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'أنت عضو في هذا العالم مسبقاً' }, { status: 400 })

  // Add as member (bypasses RLS with service role)
  const { error: memberErr } = await supabaseAdmin.from('world_members').insert({
    world_id: inv.world_id,
    user_id: user.id,
    role: inv.role || 'editor',
  })

  if (memberErr) return NextResponse.json({ error: 'حدث خطأ في الانضمام' }, { status: 500 })

  // Mark invitation as accepted
  await supabaseAdmin
    .from('partner_invitations')
    .update({ status: 'accepted' })
    .eq('token', inviteToken)

  // Get world info to return
  const { data: world } = await supabaseAdmin
    .from('worlds')
    .select('id, name, owner_id')
    .eq('id', inv.world_id)
    .single()

  return NextResponse.json({ success: true, worldId: inv.world_id, ownerId: world?.owner_id })
}
