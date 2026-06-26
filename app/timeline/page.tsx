'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiClock, FiImage, FiMessageCircle, FiCalendar, FiMapPin, FiX, FiMusic } from 'react-icons/fi'

interface TimelineItem {
  id: string
  type: 'memory' | 'message' | 'occasion'
  title: string
  description: string
  date: string
  location?: string | null
  mood?: string | null
  occasionType?: string
  image_url?: string | null
  song_url?: string | null
}

const typeConfig = {
  memory: { icon: FiImage, color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', text: 'ذكرى', dot: 'bg-pink-400' },
  message: { icon: FiMessageCircle, color: 'from-purple-400 to-pink-500', bg: 'bg-purple-50', text: 'رسالة', dot: 'bg-purple-400' },
  occasion: { icon: FiCalendar, color: 'from-yellow-400 to-orange-400', bg: 'bg-yellow-50', text: 'مناسبة', dot: 'bg-yellow-400' },
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match?.[1] || null
}

function fmtDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function TimelinePage() {
  const { activeWorldId } = useApp()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'memory' | 'message' | 'occasion'>('all')
  const [selected, setSelected] = useState<TimelineItem | null>(null)

  useEffect(() => { loadAll() }, [activeWorldId])

  const loadAll = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let memoriesQ = supabase.from('memories').select('*')
    let messagesQ = supabase.from('messages').select('*')
    let occasionsQ = supabase.from('occasions').select('*')

    if (activeWorldId) {
      memoriesQ = memoriesQ.eq('world_id', activeWorldId)
      messagesQ = messagesQ.eq('world_id', activeWorldId)
      occasionsQ = occasionsQ.eq('world_id', activeWorldId)
    } else {
      memoriesQ = memoriesQ.eq('user_id', user.id).is('world_id', null)
      messagesQ = messagesQ.eq('user_id', user.id).is('world_id', null)
      occasionsQ = occasionsQ.eq('user_id', user.id).is('world_id', null)
    }

    const [{ data: memories }, { data: messages }, { data: occasions }] = await Promise.all([
      memoriesQ, messagesQ, occasionsQ,
    ])

    const all: TimelineItem[] = [
      ...(memories || []).map(m => ({
        id: m.id, type: 'memory' as const,
        title: m.title, description: m.description, date: m.date, location: m.location,
        image_url: m.image_url, song_url: m.song_url,
      })),
      ...(messages || []).map(m => ({
        id: m.id, type: 'message' as const,
        title: m.title, description: m.content, date: m.created_at.split('T')[0], mood: m.mood,
      })),
      ...(occasions || []).map(o => ({
        id: o.id, type: 'occasion' as const,
        title: o.title, description: o.description || '', date: o.date, occasionType: o.type,
      })),
    ]

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setItems(all)
    setLoading(false)
  }

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  // Group by year-month — parse as local date to avoid UTC timezone shift
  const grouped = filtered.reduce((acc, item) => {
    const [year, month] = item.date.split('-')
    const key = `${year}-${month}`
    if (!acc[key]) {
      const d = new Date(Number(year), Number(month) - 1, 1)
      acc[key] = { label: d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' }), items: [] }
    }
    acc[key].items.push(item)
    return acc
  }, {} as Record<string, { label: string; items: TimelineItem[] }>)

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiClock /> الخط الزمني
            </h1>
            <p className="text-gray-500 text-sm">رحلتنا عبر الزمن 🌙</p>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap mb-8">
            {(['all', 'memory', 'message', 'occasion'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                  filter === f
                    ? 'bg-gradient-to-r from-pink-400 to-pink-600 text-white border-transparent shadow-md'
                    : 'border-pink-100 text-gray-500 hover:border-pink-300'
                }`}
              >
                {f === 'all' ? 'الكل' : f === 'memory' ? '📸 ذكريات' : f === 'message' ? '💌 رسائل' : '🎉 مناسبات'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⏰</div>
              <p className="text-xl font-semibold text-gray-700">لا توجد عناصر</p>
              <p className="text-gray-400 mt-2">ابدأ بإضافة ذكريات ورسائل ومناسبات</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-transparent" />

              <div className="space-y-8 pr-14">
                {Object.entries(grouped).map(([key, { label, items: groupItems }]) => (
                  <div key={key}>
                    {/* Month label */}
                    <div className="relative flex items-center mb-4">
                      <div className="absolute -right-14 w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
                        <FiClock className="text-white text-sm" />
                      </div>
                      <h2 className="text-base font-bold text-gray-700 bg-white px-3 py-1 rounded-full border border-pink-100 shadow-sm">
                        {label}
                      </h2>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {groupItems.map(item => {
                        const config = typeConfig[item.type]
                        const Icon = config.icon
                        return (
                          <div key={item.id} className="relative">
                            {/* Dot */}
                            <div className={`absolute -right-10 top-4 w-3 h-3 rounded-full ${config.dot} ring-2 ring-white shadow`} />

                            <div className="memory-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(item)}>
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className="text-white text-base" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} font-medium`} style={{ color: '#666' }}>
                                      {config.text}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {(() => { const [y,m,d] = item.date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' }) })()}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                                  {item.description && (
                                    <p className="text-gray-500 text-sm line-clamp-2">{item.description}</p>
                                  )}
                                  {item.location && (
                                    <span className="inline-flex items-center gap-1 text-xs text-pink-400 mt-1">
                                      <FiMapPin size={10} /> {item.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {selected && (() => {
        const config = typeConfig[selected.type]
        const Icon = config.icon
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelected(null)}>
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800">
                <FiX size={18} />
              </button>

              {selected.type === 'memory' && selected.image_url && (
                <img src={selected.image_url} alt={selected.title} className="w-full h-auto rounded-t-3xl" />
              )}

              <div className="p-6">
                <div className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${config.bg} font-medium mb-3`} style={{ color: '#666' }}>
                  <Icon size={12} /> {config.text}
                </div>
                <h2 className="text-2xl font-bold gradient-text mb-3">{selected.title}</h2>
                {selected.description && (
                  <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{selected.description}</p>
                )}

                <div className="flex flex-wrap gap-3 mb-4">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <FiCalendar size={13} className="text-pink-400" /> {fmtDate(selected.date)}
                  </span>
                  {selected.location && (
                    <span className="text-sm text-pink-500 flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
                      <FiMapPin size={12} /> {selected.location}
                    </span>
                  )}
                </div>

                {selected.type === 'memory' && selected.song_url && getYouTubeId(selected.song_url) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <FiMusic size={14} className="text-pink-400" /> أغنية الذكرى 🎵
                    </p>
                    <div className="rounded-2xl overflow-hidden">
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${getYouTubeId(selected.song_url)}?autoplay=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </AuthGuard>
  )
}
