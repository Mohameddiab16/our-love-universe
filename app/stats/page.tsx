'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiBarChart2, FiImage, FiMessageCircle, FiCalendar, FiMapPin, FiHeart, FiTrendingUp } from 'react-icons/fi'

interface StatsData {
  totalMemories: number
  totalMessages: number
  totalOccasions: number
  topLocations: { location: string; count: number }[]
  memoriesByMonth: { month: string; count: number }[]
  moodBreakdown: { mood: string; count: number }[]
  daysSince: number | null
  firstMemoryDate: string | null
}

const moodLabels: Record<string, string> = {
  happy: '😊 سعيد',
  love: '💕 محبة',
  romantic: '🌹 رومانسي',
  nostalgic: '🌙 حنين',
  excited: '✨ متحمس',
}

export default function StatsPage() {
  const { activeWorldId } = useApp()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [activeWorldId])

  const loadStats = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Match the scoping used by the memories/messages/occasions pages so counts agree.
    const scope = (q: any) => activeWorldId
      ? q.eq('world_id', activeWorldId)
      : q.eq('user_id', user.id).is('world_id', null)

    const [{ data: memories }, { data: messages }, { data: occasions }] = await Promise.all([
      scope(supabase.from('memories').select('*')),
      scope(supabase.from('messages').select('*')),
      scope(supabase.from('occasions').select('*')),
    ])

    // Top locations
    const locationCounts: Record<string, number> = {}
    ;(memories || []).forEach((m: any) => {
      if (m.location) locationCounts[m.location] = (locationCounts[m.location] || 0) + 1
    })
    const topLocations = Object.entries(locationCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Memories by month (last 6 months)
    const monthCounts: Record<string, number> = {}
    ;(memories || []).forEach((m: any) => {
      const key = m.date.substring(0, 7)
      monthCounts[key] = (monthCounts[key] || 0) + 1
    })
    const memoriesByMonth = Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('ar-EG', { month: 'short', year: '2-digit' }),
        count,
      }))

    // Mood breakdown
    const moodCounts: Record<string, number> = {}
    ;(messages || []).forEach((m: any) => {
      const mood = m.mood || 'other'
      moodCounts[mood] = (moodCounts[mood] || 0) + 1
    })
    const moodBreakdown = Object.entries(moodCounts)
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count)

    // Days since first memory
    const allDates = [...(memories || []).map((m: any) => m.date), ...(occasions || []).map((o: any) => o.date)]
    allDates.sort()
    const firstDate = allDates[0] || null
    const daysSince = firstDate
      ? Math.floor((Date.now() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    setStats({
      totalMemories: memories?.length || 0,
      totalMessages: messages?.length || 0,
      totalOccasions: occasions?.length || 0,
      topLocations,
      memoriesByMonth,
      moodBreakdown,
      daysSince,
      firstMemoryDate: firstDate,
    })
    setLoading(false)
  }

  const maxBarCount = stats?.memoriesByMonth.reduce((m, i) => Math.max(m, i.count), 0) || 1

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiBarChart2 /> الإحصائيات
            </h1>
            <p className="text-gray-500 text-sm">نظرة على عالمنا بالأرقام 📊</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="stat-card h-32 bg-gray-50 animate-pulse" />)}
            </div>
          ) : !stats ? null : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="stat-card text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">{stats.totalMemories}</div>
                  <div className="text-gray-500 text-sm flex items-center justify-center gap-1">
                    <FiImage size={13} /> ذكرى
                  </div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">{stats.totalMessages}</div>
                  <div className="text-gray-500 text-sm flex items-center justify-center gap-1">
                    <FiMessageCircle size={13} /> رسالة
                  </div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">{stats.totalOccasions}</div>
                  <div className="text-gray-500 text-sm flex items-center justify-center gap-1">
                    <FiCalendar size={13} /> مناسبة
                  </div>
                </div>
                <div className="stat-card text-center">
                  <div className="text-3xl font-bold gradient-text mb-1">{stats.daysSince ?? '—'}</div>
                  <div className="text-gray-500 text-sm flex items-center justify-center gap-1">
                    <FiHeart size={13} /> يوم معاً
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Memories Bar Chart */}
                {stats.memoriesByMonth.length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiTrendingUp className="text-pink-400" /> الذكريات بالشهر
                    </h2>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {stats.memoriesByMonth.map(({ month, count }) => (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-bold text-pink-600">{count}</span>
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-pink-500 to-pink-300 transition-all"
                            style={{ height: `${(count / maxBarCount) * 120}px`, minHeight: '8px' }}
                          />
                          <span className="text-xs text-gray-400 text-center leading-tight">{month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Locations */}
                {stats.topLocations.length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiMapPin className="text-pink-400" /> أكثر الأماكن
                    </h2>
                    <div className="space-y-3">
                      {stats.topLocations.map(({ location, count }, i) => (
                        <div key={location}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium flex items-center gap-2">
                              <span className="text-pink-400 font-bold">#{i + 1}</span>
                              {location}
                            </span>
                            <span className="text-pink-500 font-bold">{count}</span>
                          </div>
                          <div className="h-2 bg-pink-50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all"
                              style={{ width: `${(count / stats.topLocations[0].count) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mood Breakdown */}
                {stats.moodBreakdown.length > 0 && (
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FiHeart className="text-pink-400" /> مزاج الرسائل
                    </h2>
                    <div className="space-y-3">
                      {stats.moodBreakdown.map(({ mood, count }) => (
                        <div key={mood} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            {moodLabels[mood] || mood}
                          </span>
                          <span className="text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                            {count} رسائل
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Love Quote card */}
                {stats.firstMemoryDate && (
                  <div className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-3">💕</div>
                    <p className="text-gray-500 text-sm mb-2">أول ذكرى لنا كانت في</p>
                    <p className="font-bold text-gray-800 text-lg">
                      {new Date(stats.firstMemoryDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {stats.daysSince !== null && (
                      <p className="text-pink-400 font-bold mt-3 text-xl">{stats.daysSince} يوم من الجمال 🌸</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
