import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const in1Day = new Date(today); in1Day.setDate(in1Day.getDate() + 1)
  const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  // Get all occasions that are today, tomorrow, or in 7 days
  const { data: occasions } = await supabase
    .from('occasions')
    .select('id, title, date, user_id, world_id')
    .in('date', [fmt(today), fmt(in1Day), fmt(in7Days)])

  if (!occasions?.length) return NextResponse.json({ ok: true, sent: 0 })

  const notifications: any[] = []

  for (const occ of occasions) {
    const occDate = new Date(occ.date)
    const diffDays = Math.round((occDate.getTime() - today.getTime()) / 86400000)

    const label = diffDays === 0 ? 'اليوم! 🎉' : diffDays === 1 ? 'غداً ⏰' : 'بعد 7 أيام 📅'
    const title = `${occ.title} — ${label}`
    const body = `لا تنسَ هذه المناسبة المميزة 💕`

    // Notify the occasion owner
    notifications.push({ user_id: occ.user_id, title, body, type: 'occasion' })

    // If world occasion, notify all world members + owner
    if (occ.world_id) {
      const { data: members } = await supabase
        .from('world_members')
        .select('user_id')
        .eq('world_id', occ.world_id)

      for (const m of members || []) {
        if (m.user_id !== occ.user_id) {
          notifications.push({ user_id: m.user_id, title, body, type: 'occasion' })
        }
      }

      const { data: world } = await supabase
        .from('worlds')
        .select('owner_id')
        .eq('id', occ.world_id)
        .single()

      if (world && world.owner_id !== occ.user_id) {
        notifications.push({ user_id: world.owner_id, title, body, type: 'occasion' })
      }
    }
  }

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }

  return NextResponse.json({ ok: true, sent: notifications.length })
}
